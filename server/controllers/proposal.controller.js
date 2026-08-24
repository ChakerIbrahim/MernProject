const BidProposal = require('../models/bidProposal.model');
const Tender = require('../models/tender.model');

/**
 * Submits a new proposal for a specific tender.
 * Expects form-data with a document file and finalPrice.
 * Enforces the rule that an owner cannot bid on their own tender.
 * Returns the created proposal object.
 */
module.exports.submitProposal = async (req, res, next) => {
    try {
        const tenderId = req.params.id;
        const tender = await Tender.findById(tenderId);

        if (!tender) {
            return res.status(404).json({ error: "العطاء غير موجود" });
        }

        if (tender.status !== 'open') {
            return res.status(400).json({ error: "لا يمكن تقديم عروض على عطاء مغلق أو ملغى" });
        }

        if (tender.createdBy.toString() === req.user.id) {
            return res.status(403).json({ error: "لا يمكنك تقديم عرض على عطاء تملكه" });
        }

        if (!req.file) {
            return res.status(400).json({ errors: { document: "مستند العرض مطلوب" } });
        }

        // Validate magic numbers for PDF (similar to auth controller)
        try {
            const { fileTypeFromFile } = await import('file-type');
            const type = await fileTypeFromFile(req.file.path);

            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!type || !allowedMimeTypes.includes(type.mime)) {
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ errors: { document: 'الملف غير مدعوم، يرجى رفع صورة أو ملف PDF' } });
            }
        } catch (e) {
            console.error("File type check failed", e);
        }

        const documentUrl = `/uploads/${req.file.filename}`;

        let aiExtractedData = undefined;
        if (req.body.aiExtractedData) {
            try {
                aiExtractedData = JSON.parse(req.body.aiExtractedData);
            } catch (e) {
                // Ignore parse errors, just don't save the AI data
            }
        }

        const proposal = await BidProposal.create({
            tender: tenderId,
            submittedBy: req.user.id,
            documentUrl,
            finalPrice: req.body.finalPrice,
            aiExtractedData,
            status: 'submitted'
        });

        res.status(201).json({ proposal });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "لقد قدّمت عرضاً على هذا العطاء مسبقاً" });
        }
        next(err);
    }
};

/**
 * Retrieves all proposals submitted by the currently authenticated organization.
 * Returns a JSON object containing the proposals array.
 */
module.exports.listMyProposals = async (req, res, next) => {
    try {
        const proposals = await BidProposal.find({ submittedBy: req.user.id })
            .populate({
                path: 'tender',
                select: 'title status createdBy',
                populate: { path: 'createdBy', select: 'companyName name' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ proposals });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all proposals submitted against a specific tender.
 * Restricted to the tender owner or an admin.
 * Returns a JSON object containing the proposals array.
 */
module.exports.listProposalsForTender = async (req, res, next) => {
    try {
        const tenderId = req.params.id;
        const tender = await Tender.findById(tenderId);

        if (!tender) {
            return res.status(404).json({ error: "العطاء غير موجود" });
        }

        // Only owner or admin can view proposals
        if (tender.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: "لا تملك الصلاحية لعرض هذه العروض" });
        }

        const proposals = await BidProposal.find({ tender: tenderId })
            .populate('submittedBy', 'companyName name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ proposals });
    } catch (err) {
        next(err);
    }
};

/**
 * Updates the status of a proposal (e.g., accepted, rejected).
 * Restricted to the owner of the tender.
 * Returns the updated proposal object.
 */
module.exports.updateProposalStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "حالة غير صالحة" });
        }

        const proposal = await BidProposal.findById(req.params.id).populate('tender');

        if (!proposal) {
            return res.status(404).json({ error: "العرض غير موجود" });
        }

        // Only tender owner can change status
        if (proposal.tender.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: "لا تملك الصلاحية لتغيير حالة هذا العرض" });
        }

        proposal.status = status;
        await proposal.save();


        res.status(200).json({ proposal });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a single proposal by its ID.
 * Restricted to the submitter, the tender owner, or an admin.
 * Returns the populated proposal object.
 */
module.exports.getProposalById = async (req, res, next) => {
    try {
        const proposal = await BidProposal.findById(req.params.proposalId)
            .populate('submittedBy', 'companyName name')
            .populate({
                path: 'tender',
                select: 'title createdBy',
                populate: { path: 'createdBy', select: 'companyName name' }
            });

        if (!proposal) {
            return res.status(404).json({ error: "العرض غير موجود" });
        }

        const tenderOwnerId = proposal.tender.createdBy.toString();
        const submitterId = proposal.submittedBy._id.toString();

        // Only tender owner, submitter, or admin can view
        if (req.user.id !== tenderOwnerId && req.user.id !== submitterId && req.user.role !== 'admin') {
            return res.status(403).json({ error: "لا تملك الصلاحية لعرض هذا العرض" });
        }

        res.status(200).json({ proposal });
    } catch (err) {
        next(err);
    }
};
