const AdminController = require('../controllers/admin.controller');
const AuctionController = require('../controllers/auction.controller');
const { isAuth, isRole } = require('../config/jwt.config');

/**
 * Registers all admin-specific API routes.
 * Every route here is protected by isAuth and isRole(['admin']).
 */
module.exports = (app) => {
    app.get('/api/admin/organizations/pending', isAuth, isRole(['admin']), AdminController.listPendingOrganizations);
    app.patch('/api/admin/organizations/:id/approve', isAuth, isRole(['admin']), AdminController.approveOrganization);
    app.patch('/api/admin/organizations/:id/reject', isAuth, isRole(['admin']), AdminController.rejectOrganization);
    app.get('/api/admin/auctions/pending', isAuth, isRole(['admin']), AuctionController.listPendingAuctions);
    app.patch('/api/admin/auctions/:id/approve', isAuth, isRole(['admin']), AuctionController.approveAuction);

    // Account Management
    app.get('/api/admin/users', isAuth, isRole(['admin']), AdminController.listUsers);
    app.get('/api/admin/users/:id', isAuth, isRole(['admin']), AdminController.getUserById);
    app.patch('/api/admin/users/:id/deactivate', isAuth, isRole(['admin']), AdminController.deactivateUser);
    app.patch('/api/admin/users/:id/activate', isAuth, isRole(['admin']), AdminController.activateUser);
    app.delete('/api/admin/users/:id', isAuth, isRole(['admin']), AdminController.deleteUser);

    // Tender Management
    app.get('/api/admin/tenders', isAuth, isRole(['admin']), AdminController.listTenders);
    app.patch('/api/admin/tenders/:id/close', isAuth, isRole(['admin']), AdminController.closeTender);
    app.patch('/api/admin/tenders/:id/open', isAuth, isRole(['admin']), AdminController.openTender);
    app.delete('/api/admin/tenders/:id', isAuth, isRole(['admin']), AdminController.deleteTender);

    // Auction Management
    app.get('/api/admin/auctions', isAuth, isRole(['admin']), AdminController.listAuctions);
    app.patch('/api/admin/auctions/:id/close', isAuth, isRole(['admin']), AdminController.closeAuction);
    app.patch('/api/admin/auctions/:id/open', isAuth, isRole(['admin']), AdminController.openAuction);
    app.delete('/api/admin/auctions/:id', isAuth, isRole(['admin']), AdminController.deleteAuction);
};
