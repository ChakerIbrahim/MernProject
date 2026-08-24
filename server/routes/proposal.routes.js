const ProposalController = require('../controllers/proposal.controller');
const NegotiationController = require('../controllers/negotiation.controller');
const AiController = require('../controllers/ai.controller');
const { isAuth, isRole, isApprovedOrganization } = require('../config/jwt.config');
const upload = require('../config/multer.config');

/**
 * Registers all API routes related to proposals and their associated negotiation messages.
 * Uses multer middleware for proposal document uploads.
 */
module.exports = (app) => {
    // Submit proposal (Approved Org only)
    app.post(
        '/api/tenders/:id/proposals',
        isAuth,
        isRole(['organization']),
        isApprovedOrganization,
        upload.single('document'),
        ProposalController.submitProposal
    );

    // List proposals for a tender (Owner or Admin)
    app.get(
        '/api/tenders/:id/proposals',
        isAuth,
        ProposalController.listProposalsForTender
    );

    // Change proposal status (Tender Owner)
    app.patch(
        '/api/proposals/:id/status',
        isAuth,
        ProposalController.updateProposalStatus
    );

    // List proposals submitted by the current organization
    app.get(
        '/api/users/me/proposals',
        isAuth,
        isRole(['organization']),
        ProposalController.listMyProposals
    );

    // Get specific proposal (Owner, Submitter, or Admin)
    app.get(
        '/api/proposals/:proposalId',
        isAuth,
        ProposalController.getProposalById
    );

    app.get('/api/proposals/:id/messages', isAuth, NegotiationController.listMessages);
    app.post('/api/proposals/:id/messages', isAuth, isRole(['organization']), NegotiationController.sendMessage);
};
