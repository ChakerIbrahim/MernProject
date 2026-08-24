const ChatController = require('../controllers/chat.controller');
const { isAuth, isRole, isApprovedOrganization } = require('../config/jwt.config');

/**
 * Registers all API routes related to chat requests and the unified inbox.
 * All routes are restricted to authenticated organizations.
 */
module.exports = (app) => {
    // Request a chat with a tender owner
    app.post(
        '/api/tenders/:tenderId/chat-requests',
        isAuth,
        isRole(['organization']),
        isApprovedOrganization,
        ChatController.requestChat
    );

    // Accept or reject a chat request
    app.patch(
        '/api/chat-requests/:id/status',
        isAuth,
        isRole(['organization']),
        ChatController.updateChatRequestStatus
    );

    // Get the unified chat inbox (proposals + chat requests)
    app.get(
        '/api/users/me/chat-inbox',
        isAuth,
        isRole(['organization']),
        ChatController.listInbox
    );

    // Get the unread badge count
    app.get(
        '/api/users/me/chat-badge',
        isAuth,
        isRole(['organization']),
        ChatController.getUnreadBadgeCount
    );
};
