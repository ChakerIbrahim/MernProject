const AuctionController = require('../controllers/auction.controller');
const upload = require('../config/multer.config');
const rateLimit = require('express-rate-limit');
const {
    isAuth,
    isRole,
    optionalAuth,
    isApprovedOrganizationOrAdmin
} = require('../config/jwt.config');

const bidLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'تم تجاوز عدد المزايدات المسموح به. حاول مرة أخرى بعد قليل.' }
});

/**
 * Registers all auction-related API routes.
 * Includes public listing, bidding (with rate limiting), and creation.
 */
module.exports = (app) => {
    // These public routes intentionally remain outside any auth router middleware.
    app.get('/api/auctions', AuctionController.listActiveAuctions);
    app.get('/api/auctions/:id', optionalAuth, AuctionController.getAuctionById);

    app.post(
        '/api/auctions',
        isAuth,
        isRole(['admin', 'organization']),
        isApprovedOrganizationOrAdmin,
        upload.fields([
            { name: 'officialDocument', maxCount: 1 },
            { name: 'images', maxCount: 8 },
            { name: 'image', maxCount: 1 }
        ]),
        AuctionController.createAuction
    );

    app.post('/api/auctions/:id/bid', bidLimiter, isAuth, isRole(['individual', 'organization']), AuctionController.placeBid);
    app.get('/api/users/me/created-auctions', isAuth, isRole(['organization', 'admin']), AuctionController.listCreatedAuctions);
    app.get('/api/users/me/auctions', isAuth, isRole(['individual', 'organization']), AuctionController.listMyAuctions);
};
