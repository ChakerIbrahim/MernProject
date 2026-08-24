const fs = require('fs');
const mongoose = require('mongoose');
const Auction = require('../models/auction.model');
const BidHistory = require('../models/bidHistory.model');
const { resolveAuctionState } = require('../functions/auction-state');
const { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_MIME_TYPES } = require('../config/upload-types');

const allowedImageMimeTypes = ALLOWED_IMAGE_MIME_TYPES;
const allowedDocumentMimeTypes = ALLOWED_MIME_TYPES;

const withTimeRemaining = (auction) => {
    const item = auction.toObject ? auction.toObject() : auction;
    return {
        ...item,
        timeRemainingMs: Math.max(0, new Date(item.endsAt).getTime() - Date.now())
    };
};

const validateAuctionImage = async (file) => {
    if (!file) return true;
    const { fileTypeFromFile } = await import('file-type');
    const detectedType = await fileTypeFromFile(file.path);
    return Boolean(detectedType && allowedImageMimeTypes.includes(detectedType.mime));
};

const populateAuction = (query) => query
    .populate('createdBy', 'name companyName email')
    .populate('currentHighestBidder', 'name email companyName');

/**
 * Creates a new auction with optional uploaded images and an official document.
 * Expects form-data in req.body and req.files.
 * Returns the created auction (status: 'pending_approval').
 */
module.exports.createAuction = async (req, res, next) => {
    try {
        const files = req.files || {};
        const legacyImage = req.file ? [req.file] : [];
        const imageFiles = [...legacyImage, ...(files.images || [])];
        const documentFile = files.officialDocument?.[0] || null;

        for (const image of imageFiles) {
            const isValidImage = await validateAuctionImage(image);
            if (!isValidImage) {
                fs.unlinkSync(image.path);
                return res.status(400).json({ errors: { images: "إحدى الصور غير مدعومة، يرجى رفع JPG أو PNG" } });
            }
        }

        if (documentFile) {
            const { fileTypeFromFile } = await import('file-type');
            const detectedType = await fileTypeFromFile(documentFile.path);
            if (!detectedType || !allowedDocumentMimeTypes.includes(detectedType.mime)) {
                fs.unlinkSync(documentFile.path);
                return res.status(400).json({ errors: { officialDocument: "الوثيقة غير مدعومة، يرجى رفع PDF أو JPG أو PNG" } });
            }
        }

        let itemFields = [];
        if (req.body.itemFields) {
            try {
                itemFields = JSON.parse(req.body.itemFields);
            } catch (error) {
                return res.status(400).json({ errors: { itemFields: "بيانات الحقول الإضافية غير صالحة" } });
            }
        }
        if (!Array.isArray(itemFields) || itemFields.length > 30 || itemFields.some((field) => !field?.label || !String(field.label).trim())) {
            return res.status(400).json({ errors: { itemFields: "تحقق من الحقول الإضافية المدخلة" } });
        }
        const missingItemField = itemFields.find((field) => field.required && !String(field.value || '').trim());
        if (missingItemField) {
            return res.status(400).json({ errors: { itemFields: `الحقل المطلوب غير مكتمل: ${missingItemField.label}` } });
        }

        const { title, description, startingPrice, endsAt } = req.body;
        const requestedDocumentUrl = String(req.body.officialDocumentUrl || '');
        const savedDocumentUrl = requestedDocumentUrl.startsWith('/uploads/')
            ? requestedDocumentUrl
            : (documentFile ? `/uploads/${documentFile.filename}` : '');
        const imageUrls = imageFiles.map((file) => `/uploads/${file.filename}`);
        const auction = new Auction({
            title,
            description,
            startingPrice,
            endsAt,
            imageUrl: imageUrls[0] || '',
            images: imageUrls,
            officialDocumentUrl: savedDocumentUrl,
            officialDocumentName: req.body.officialDocumentName || documentFile?.originalname || '',
            itemFields: itemFields.map((field) => ({
                key: String(field.key || field.label).trim().slice(0, 80),
                label: String(field.label).trim().slice(0, 120),
                value: String(field.value || '').trim().slice(0, 1000),
                type: ['text', 'number', 'date'].includes(field.type) ? field.type : 'text',
                required: Boolean(field.required),
                source: field.source === 'document' ? 'document' : 'manual'
            })),
            createdBy: req.user.id,
            status: 'pending_approval'
        });

        await auction.save();
        const populatedAuction = await populateAuction(Auction.findById(auction._id));
        res.status(201).json({ auction: withTimeRemaining(populatedAuction) });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all active auctions that have not yet expired.
 * Resolves lazy state updates before returning the list.
 * Returns a JSON object containing the auctions array.
 */
module.exports.listActiveAuctions = async (req, res, next) => {
    try {
        const candidates = await populateAuction(Auction.find({ status: 'active' }).sort({ endsAt: 1 }));
        const resolved = await Promise.all(candidates.map(resolveAuctionState));
        const now = new Date();
        const auctions = resolved.filter((auction) => auction.status === 'active' && auction.endsAt > now);
        res.status(200).json({ auctions: auctions.map(withTimeRemaining) });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a single auction by ID, resolving its state (e.g., closing it if expired).
 * Includes the 10 most recent bids in the response.
 * Returns 404 if not found or if it is pending and the user is not the owner/admin.
 */
module.exports.getAuctionById = async (req, res, next) => {
    try {
        const auction = await populateAuction(Auction.findById(req.params.id));
        if (!auction) return res.status(404).json({ error: "المزاد غير موجود" });

        await resolveAuctionState(auction);

        const canSeePending = req.user && (
            req.user.role === 'admin' ||
            auction.createdBy._id.toString() === req.user.id
        );
        if (auction.status === 'pending_approval' && !canSeePending) {
            return res.status(404).json({ error: "المزاد غير موجود" });
        }

        const bidHistory = await BidHistory.find({ auction: auction._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('bidder', 'name companyName')
            .select('bidder amount createdAt')
            .lean();

        res.status(200).json({ auction: { ...withTimeRemaining(auction), bidHistory } });
    } catch (err) {
        next(err);
    }
};

/**
 * Places a bid on an active auction.
 * Expects the bid amount in req.body.amount.
 * Returns 400 if the bid is not higher than the current price or the auction is closed.
 */
module.exports.placeBid = async (req, res, next) => {
    try {
        const amount = Number(req.body?.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({ errors: { amount: "أدخل قيمة مزايدة صحيحة" } });
        }

        const existingAuction = await Auction.findById(req.params.id);
        if (!existingAuction) return res.status(404).json({ error: "المزاد غير موجود" });

        if (existingAuction.createdBy.toString() === req.user.id) {
            return res.status(403).json({ error: "لا يمكنك المزايدة على مزادك الخاص" });
        }

        await resolveAuctionState(existingAuction);
        if (existingAuction.status !== 'active' || existingAuction.endsAt <= new Date()) {
            return res.status(400).json({ error: "المزاد غير نشط أو انتهى" });
        }

        const updated = await Auction.findOneAndUpdate(
            {
                _id: req.params.id,
                status: 'active',
                endsAt: { $gt: new Date() },
                currentPrice: { $lt: amount }
            },
            {
                $set: {
                    currentPrice: amount,
                    currentHighestBidder: req.user.id
                }
            },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(400).json({ errors: { amount: "يجب أن تكون المزايدة أعلى من السعر الحالي" } });
        }

        await BidHistory.create({
            auction: updated._id,
            bidder: req.user.id,
            amount
        });

        const populatedAuction = await populateAuction(Auction.findById(updated._id));
        res.status(200).json({ auction: withTimeRemaining(populatedAuction) });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all auctions created by the currently authenticated user.
 * Returns a JSON object containing the auctions array.
 */
module.exports.listCreatedAuctions = async (req, res, next) => {
    try {
        const auctions = await populateAuction(Auction.find({ createdBy: req.user.id }).sort({ createdAt: -1 }));
        res.status(200).json({ auctions: auctions.map(withTimeRemaining) });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all auctions the currently authenticated user has bid on.
 * Aggregates bid history to determine the user's highest bid and current outcome (winning/won/lost).
 * Returns a JSON object containing the augmented auctions array.
 */
module.exports.listMyAuctions = async (req, res, next) => {
    try {
        const bidderId = new mongoose.Types.ObjectId(req.user.id);
        const summaries = await BidHistory.aggregate([
            { $match: { bidder: bidderId } },
            {
                $group: {
                    _id: '$auction',
                    highestBid: { $max: '$amount' },
                    lastBidAt: { $max: '$createdAt' }
                }
            }
        ]);

        const auctions = await Promise.all(summaries.map(async (summary) => {
            const auction = await populateAuction(Auction.findById(summary._id));
            if (!auction) return null;
            await resolveAuctionState(auction);

            const isWinner = auction.currentHighestBidder && auction.currentHighestBidder._id.toString() === req.user.id;
            let outcome = 'outbid';
            if (auction.status === 'ended') outcome = isWinner ? 'won' : 'lost';
            else if (auction.status === 'cancelled') outcome = 'lost';
            else if (isWinner) outcome = 'winning';

            return {
                ...withTimeRemaining(auction),
                highestBid: summary.highestBid,
                lastBidAt: summary.lastBidAt,
                outcome
            };
        }));

        res.status(200).json({ auctions: auctions.filter(Boolean) });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all auctions awaiting admin approval.
 * Restricted to admins via routes. Returns a JSON object containing the auctions array.
 */
module.exports.listPendingAuctions = async (req, res, next) => {
    try {
        const auctions = await populateAuction(Auction.find({ status: 'pending_approval' }).sort({ createdAt: 1 }));
        res.status(200).json({ auctions: auctions.map(withTimeRemaining) });
    } catch (err) {
        next(err);
    }
};

/**
 * Approves a pending auction, making it active and publicly visible.
 * Restricted to admins via routes.
 * Returns the updated auction object.
 */
module.exports.approveAuction = async (req, res, next) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ error: "المزاد غير موجود" });
        if (auction.status !== 'pending_approval') {
            return res.status(400).json({ error: "لا يمكن اعتماد هذا المزاد لأنه ليس قيد المراجعة" });
        }

        auction.status = 'active';
        await auction.save();
        const populatedAuction = await populateAuction(Auction.findById(auction._id));
        res.status(200).json({ auction: withTimeRemaining(populatedAuction) });
    } catch (err) {
        next(err);
    }
};
