const AIController = require('../controllers/ai.controller');
const { isAuth, isRole, isApprovedOrganization } = require('../config/jwt.config');
const upload = require('../config/multer.config');

/**
 * Registers all AI-related API routes for document extraction and validation.
 * Uses multer middleware for file uploads.
 */
module.exports = (app) => {
    app.post(
        '/api/auth/analyze-id',
        upload.single('idDocument'),
        AIController.analyzeIdDocument
    );

    app.post(
        '/api/tenders/analyze-book',
        isAuth,
        isRole(['organization']),
        isApprovedOrganization,
        upload.single('officialBook'),
        AIController.analyzeTenderBook
    );

    // We use a separate multer instance or just the same one but we need to intercept it before proposal creation.
    // Wait, the requirement says POST /api/proposals/:id/analyze. The ID is the tender ID.
    // Submitter uploads the file here FIRST to get the AI analysis, then submits the final proposal.
    app.post(
        '/api/proposals/:id/analyze',
        isAuth,
        isRole(['organization']),
        isApprovedOrganization,
        upload.single('document'),
        AIController.analyzeDocument
    );

    app.post(
        '/api/auctions/analyze-item',
        isAuth,
        isRole(['organization']),
        isApprovedOrganization,
        upload.single('officialDocument'),
        AIController.analyzeAuctionItem
    );

    app.post(
        '/api/proposals/:proposalId/review-ai',
        isAuth,
        isRole(['organization', 'admin']),
        AIController.analyzeExistingProposal
    );
};
