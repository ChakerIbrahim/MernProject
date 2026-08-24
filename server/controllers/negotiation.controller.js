const BidProposal = require('../models/bidProposal.model');
const ChatRequest = require('../models/chatRequest.model');
const NegotiationMessage = require('../models/negotiationMessage.model');

/**
 * Helper function to fetch and validate the context for a conversation.
 * Supports both ChatRequest and BidProposal.
 */
const getConversationContext = async (id, isChatRequest, userId) => {
    let context, isTenderOwner, isSubmitter;
    if (isChatRequest) {
        context = await ChatRequest.findById(id).populate('tender');
        if (context) {
            isTenderOwner = context.owner.toString() === userId;
            isSubmitter = context.requester.toString() === userId;
        }
    } else {
        context = await BidProposal.findById(id).populate('tender');
        if (context) {
            isTenderOwner = context.tender.createdBy.toString() === userId;
            isSubmitter = context.submittedBy.toString() === userId;
        }
    }
    return { context, isTenderOwner, isSubmitter };
};
// io is no longer imported here; the client emits socket events directly to the server

/**
 * Retrieves all messages for a specific conversation (BidProposal or ChatRequest).
 * Automatically marks incoming unread messages as read.
 * Restricted to the participants (tender owner, submitter) or an admin.
 * Returns a JSON object containing the messages, newly read IDs, and context.
 */
module.exports.listMessages = async (req, res, next) => {
    try {
        const isChatRequest = req.query.type === 'request';
        const isAdmin = req.user.role === 'admin';
        const { context, isTenderOwner, isSubmitter } = await getConversationContext(req.params.id, isChatRequest, req.user.id);

        if (!context) {
            return res.status(404).json({ error: isChatRequest ? "الطلب غير موجود" : "العرض غير موجود" });
        }
        if (context.status !== 'accepted') {
            return res.status(400).json({ error: isChatRequest ? "لا يمكن بدء المحادثة إلا للطلبات المقبولة" : "لا يمكن بدء التفاوض إلا للعروض المقبولة" });
        }

        if (!isTenderOwner && !isSubmitter && !isAdmin) {
            return res.status(403).json({ error: "لا تملك الصلاحية لعرض هذه المحادثة" });
        }

        const query = isChatRequest ? { chatRequest: context._id } : { proposal: context._id };
        const messages = await NegotiationMessage.find(query)
            .populate('sender', 'name companyName')
            .sort({ createdAt: 1 });
        let readMessageIds = [];

        // Mark unread messages sent by the OTHER party as read when this user lists them
        if (!isAdmin && messages.length > 0) {
            const unreadIds = messages
                .filter(msg => !msg.isRead && msg.sender._id.toString() !== req.user.id)
                .map(msg => msg._id.toString());

            if (unreadIds.length > 0) {
                await NegotiationMessage.updateMany(
                    { _id: { $in: unreadIds } },
                    { $set: { isRead: true } }
                );
                // Update the in-memory array so the current response reflects the change
                readMessageIds = unreadIds;
                const unreadIdSet = new Set(unreadIds);
                messages.forEach(msg => {
                    if (unreadIdSet.has(msg._id.toString())) msg.isRead = true;
                });

                // Note: Socket emission for read receipts is now handled by the client
                // listening to this response and emitting 'mark_messages_read' to the server.
            }
        }

        res.status(200).json({ messages, readMessageIds, context });
    } catch (err) {
        next(err);
    }
};

/**
 * Sends a new message in a specific conversation (BidProposal or ChatRequest).
 * Validates participation and persists the message to the database.
 * Returns the populated message object.
 */
module.exports.sendMessage = async (req, res, next) => {
    try {
        const isChatRequest = req.query.type === 'request';
        const { context, isTenderOwner, isSubmitter } = await getConversationContext(req.params.id, isChatRequest, req.user.id);

        if (!context) {
            return res.status(404).json({ error: isChatRequest ? "الطلب غير موجود" : "العرض غير موجود" });
        }
        if (context.status !== 'accepted') {
            return res.status(400).json({ error: isChatRequest ? "لا يمكن إرسال رسائل إلا للطلبات المقبولة" : "لا يمكن إرسال رسائل إلا للعروض المقبولة" });
        }

        if (!isTenderOwner && !isSubmitter) {
            return res.status(403).json({ error: "لا تملك الصلاحية للمشاركة في هذه المحادثة" });
        }

        if (!req.body.body || !req.body.body.trim()) {
            return res.status(400).json({ errors: { body: "نص الرسالة مطلوب" } });
        }

        const messageData = {
            sender: req.user.id,
            body: req.body.body.trim()
        };
        if (isChatRequest) {
            messageData.chatRequest = context._id;
        } else {
            messageData.proposal = context._id;
        }

        const message = await NegotiationMessage.create(messageData);

        const populatedMessage = await NegotiationMessage.findById(message._id).populate('sender', 'name companyName');

        // Note: Socket emission for the new message is now handled by the client
        // after receiving this 201 response, by emitting 'send_new_message'.

        res.status(201).json({ message: populatedMessage });
    } catch (err) {
        next(err);
    }
};
