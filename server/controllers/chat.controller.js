const mongoose = require('mongoose');
const ChatRequest = require('../models/chatRequest.model');
const BidProposal = require('../models/bidProposal.model');
const Tender = require('../models/tender.model');
const NegotiationMessage = require('../models/negotiationMessage.model');

/**
 * Creates a new ChatRequest from the authenticated organization to a tender owner.
 * Returns 400 if a request already exists or if the user owns the tender.
 * Returns the created chatRequest object.
 */
module.exports.requestChat = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.tenderId);
        if (!tender) return res.status(404).json({ error: "العطاء غير موجود" });

        if (tender.createdBy.toString() === req.user.id) {
            return res.status(400).json({ error: "لا يمكنك طلب محادثة على عطائك الخاص" });
        }

        const existingRequest = await ChatRequest.findOne({ tender: tender._id, requester: req.user.id });
        if (existingRequest) {
            return res.status(400).json({ error: "لقد قمت بطلب محادثة مسبقاً لهذا العطاء" });
        }

        const chatRequest = await ChatRequest.create({
            tender: tender._id,
            requester: req.user.id,
            owner: tender.createdBy,
            status: 'pending'
        });

        res.status(201).json({ chatRequest });
    } catch (err) {
        next(err);
    }
};

/**
 * Updates the status of a ChatRequest (accepted/rejected).
 * Restricted to the owner of the tender associated with the request.
 * Returns the updated chatRequest object.
 */
module.exports.updateChatRequestStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: "حالة غير صالحة" });
        }

        const chatRequest = await ChatRequest.findById(req.params.id);
        if (!chatRequest) return res.status(404).json({ error: "طلب المحادثة غير موجود" });

        if (chatRequest.owner.toString() !== req.user.id) {
            return res.status(403).json({ error: "لا تملك الصلاحية للرد على هذا الطلب" });
        }

        chatRequest.status = status;
        await chatRequest.save();

        res.status(200).json({ chatRequest });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all active conversations (accepted proposals and chat requests) for the user.
 * Aggregates unread message counts for each conversation thread.
 * Returns a JSON object containing proposals, chatRequests, and unreadCounts.
 */
module.exports.listInbox = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // 1. Fetch accepted proposals (the original chat mechanism)
        const proposals = await BidProposal.find({
            status: 'accepted',
            $or: [{ 'tender.createdBy': userId }, { submittedBy: userId }]
        }).populate('tender', 'title createdBy').populate('submittedBy', 'name companyName');
        // Note: tender.createdBy match won't work perfectly in $or without a lookup or manual filtering if tender is just an ObjectId in DB.
        // Let's do it safely:
        const myProposals = await BidProposal.find({ status: 'accepted', submittedBy: userId })
            .populate({ path: 'tender', select: 'title createdBy', populate: { path: 'createdBy', select: 'name companyName' } });

        const myTenders = await Tender.find({ createdBy: userId }).select('_id title');
        const myTenderIds = myTenders.map(t => t._id);
        const proposalsOnMyTenders = await BidProposal.find({ status: 'accepted', tender: { $in: myTenderIds } })
            .populate('tender', 'title createdBy')
            .populate('submittedBy', 'name companyName');

        // 2. Fetch chat requests (the new mechanism)
        const myRequests = await ChatRequest.find({ requester: userId })
            .populate({ path: 'tender', select: 'title createdBy', populate: { path: 'createdBy', select: 'name companyName' } });
        const requestsOnMyTenders = await ChatRequest.find({ owner: userId })
            .populate('tender', 'title createdBy')
            .populate('requester', 'name companyName');

        // 3. Aggregate unread counts
        const allProposalIds = [...myProposals, ...proposalsOnMyTenders].map(p => p._id);
        const allChatRequestIds = [...myRequests, ...requestsOnMyTenders].filter(r => r.status === 'accepted').map(r => r._id);

        const unreadProposalMessages = await NegotiationMessage.aggregate([
            { $match: { proposal: { $in: allProposalIds }, isRead: false, sender: { $ne: new mongoose.Types.ObjectId(userId) } } },
            { $group: { _id: '$proposal', count: { $sum: 1 } } }
        ]);

        const unreadRequestMessages = await NegotiationMessage.aggregate([
            { $match: { chatRequest: { $in: allChatRequestIds }, isRead: false, sender: { $ne: new mongoose.Types.ObjectId(userId) } } },
            { $group: { _id: '$chatRequest', count: { $sum: 1 } } }
        ]);

        const unreadMap = {};
        unreadProposalMessages.forEach(m => unreadMap[`proposal_${m._id}`] = m.count);
        unreadRequestMessages.forEach(m => unreadMap[`request_${m._id}`] = m.count);

        res.status(200).json({
            proposals: [...myProposals, ...proposalsOnMyTenders],
            chatRequests: [...myRequests, ...requestsOnMyTenders],
            unreadCounts: unreadMap
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Calculates the total number of unread messages and pending chat requests for the user.
 * Returns a JSON object with the combined count.
 */
module.exports.getUnreadBadgeCount = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const myTenders = await Tender.find({ createdBy: userId }).select('_id');
        const myTenderIds = myTenders.map(t => t._id);

        const activeProposals = await BidProposal.find({
            status: 'accepted',
            $or: [{ submittedBy: userId }, { tender: { $in: myTenderIds } }]
        }).select('_id');

        const activeRequests = await ChatRequest.find({
            status: 'accepted',
            $or: [{ requester: userId }, { owner: userId }]
        }).select('_id');

        const pendingRequests = await ChatRequest.countDocuments({
            owner: userId,
            status: 'pending'
        });

        const proposalIds = activeProposals.map(p => p._id);
        const requestIds = activeRequests.map(r => r._id);

        const unreadMessages = await NegotiationMessage.countDocuments({
            sender: { $ne: userId },
            isRead: false,
            $or: [
                { proposal: { $in: proposalIds } },
                { chatRequest: { $in: requestIds } }
            ]
        });

        res.status(200).json({ count: unreadMessages + pendingRequests });
    } catch (err) {
        next(err);
    }
};
