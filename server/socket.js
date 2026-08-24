const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const BidProposal = require('./models/bidProposal.model');
const ChatRequest = require('./models/chatRequest.model');
const NegotiationMessage = require('./models/negotiationMessage.model');

let io;

const roomName = (id) => `negotiation:${id}`;

const isParticipant = (context, userId, isRequest = false) => {
    if (isRequest) {
        return context.tender && (context.owner?.toString() === userId || context.requester?.toString() === userId);
    }
    const tenderOwnerId = context.tender?.createdBy?.toString();
    const submitterId = context.submittedBy?.toString();
    return context.tender && (tenderOwnerId === userId || submitterId === userId);
};

module.exports = {
    /**
     * Initializes the Socket.io server with CORS and JWT authentication.
     * Registers all real-time chat event handlers (join, send, mark read).
     * Returns the initialized io instance.
     */
    init: (httpServer, allowedOrigin) => {
        io = new Server(httpServer, {
            cors: {
                origin: allowedOrigin || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // The client sends the same JWT used by the protected REST requests.
        io.use((socket, next) => {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('الجلسة مطلوبة'));

            jwt.verify(token, process.env.SECRET, (err, payload) => {
                if (err) return next(new Error('الجلسة منتهية أو غير صالحة'));
                socket.user = payload;
                next();
            });
        });

        io.on('connection', (socket) => {
            socket.emit('Welcome', 'Welcome to the Negotiation Chat!');

            socket.on('join_global_notifications', () => {
                if (socket.user && socket.user.id) {
                    socket.join(`user_notifications:${socket.user.id}`);
                }
            });

            socket.on('join_negotiation', async ({ proposalId, type = 'proposal' } = {}) => {
                try {
                    const isRequest = type === 'request';
                    let context;
                    if (isRequest) {
                        context = await ChatRequest.findById(proposalId).populate('tender');
                    } else {
                        context = await BidProposal.findById(proposalId).populate('tender', 'createdBy');
                    }

                    const canJoin = context && context.status === 'accepted' && (
                        socket.user.role === 'admin' || isParticipant(context, socket.user.id, isRequest)
                    );

                    if (!canJoin) {
                        return socket.emit('socket_error', { error: 'لا تملك الصلاحية للانضمام إلى هذه المحادثة' });
                    }

                    socket.join(roomName(proposalId));
                    socket.emit('negotiation_joined', { proposalId });
                } catch (err) {
                    console.error('Socket join error:', err.message);
                    socket.emit('socket_error', { error: 'تعذّر الانضمام إلى المحادثة' });
                }
            });

            socket.on('leave_negotiation', ({ proposalId } = {}) => {
                if (proposalId) socket.leave(roomName(proposalId));
            });

            // REST remains the source of truth for saving messages.
            socket.on('send_new_message', async ({ proposalId, message, type = 'proposal' } = {}) => {
                try {
                    const room = roomName(proposalId);
                    if (!socket.rooms.has(room) || !message?._id) return;

                    const query = {
                        _id: message._id,
                        sender: socket.user.id
                    };
                    if (type === 'request') {
                        query.chatRequest = proposalId;
                    } else {
                        query.proposal = proposalId;
                    }

                    const savedMessage = await NegotiationMessage.findOne(query).populate('sender', 'name companyName');

                    if (!savedMessage) return;

                    socket.broadcast.to(room).emit('receive_new_message', {
                        proposalId,
                        message: savedMessage
                    });

                    // Also notify the recipient globally so their header badge updates
                    let recipientId;
                    if (type === 'request') {
                        const reqDoc = await ChatRequest.findById(proposalId);
                        if (reqDoc) {
                            recipientId = reqDoc.owner.toString() === socket.user.id ? reqDoc.requester.toString() : reqDoc.owner.toString();
                        }
                    } else {
                        const propDoc = await BidProposal.findById(proposalId).populate('tender', 'createdBy');
                        if (propDoc) {
                            recipientId = propDoc.submittedBy.toString() === socket.user.id ? propDoc.tender.createdBy.toString() : propDoc.submittedBy.toString();
                        }
                    }

                    if (recipientId) {
                        socket.broadcast.to(`user_notifications:${recipientId}`).emit('unread_badge_update', {});
                    }
                } catch (err) {
                    console.error('Socket message error:', err.message);
                }
            });

            socket.on('mark_messages_read', async ({ proposalId, messageIds, type = 'proposal' } = {}) => {
                try {
                    const room = roomName(proposalId);
                    if (!socket.rooms.has(room) || !Array.isArray(messageIds) || messageIds.length === 0) return;

                    const query = {
                        _id: { $in: messageIds },
                        sender: { $ne: socket.user.id },
                        isRead: false
                    };
                    if (type === 'request') {
                        query.chatRequest = proposalId;
                    } else {
                        query.proposal = proposalId;
                    }

                    const unreadMessages = await NegotiationMessage.find(query).select('_id');

                    const readMessageIds = unreadMessages.map((message) => message._id.toString());
                    if (readMessageIds.length === 0) return;

                    await NegotiationMessage.updateMany(
                        { _id: { $in: readMessageIds } },
                        { $set: { isRead: true } }
                    );

                    socket.emit('messages_marked_read', { proposalId, readMessageIds });
                    socket.broadcast.to(room).emit('messages_were_read', { proposalId, readMessageIds });

                    // Update the badge for the person who just read the messages
                    socket.emit('unread_badge_update', {});
                } catch (err) {
                    console.error('Socket read receipt error:', err.message);
                }
            });

            socket.on('disconnect', () => {
                // Disconnect handler (debug logging removed for production)
            });
        });

        return io;
    },
    /**
     * Returns the initialized Socket.io instance.
     * Throws an error if called before init().
     */
    getIO: () => {
        if (!io) throw new Error('Socket.io not initialized!');
        return io;
    }
};
