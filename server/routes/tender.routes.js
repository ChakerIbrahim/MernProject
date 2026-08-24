const TenderController = require('../controllers/tender.controller');
const { isAuth, isApprovedOrganization, isOwnerOrAdmin } = require('../config/jwt.config');
const Tender = require('../models/tender.model');

/**
 * Registers all API routes related to procurement tenders.
 * Includes creation, listing, updating, and closing endpoints.
 */
module.exports = (app) => {
    app.post('/api/tenders', isAuth, isApprovedOrganization, TenderController.createTender);
    app.get('/api/tenders', isAuth, TenderController.listTenders);
    app.get('/api/tenders/:id', isAuth, TenderController.getTenderById);

    // Using isOwnerOrAdmin but ensuring only owner can update inside the controller by checking role if needed,
    // wait, FR-8.1 says "owning Organization to edit", FR-8.2 says "owner or Admin to close".
    // We can use isOwnerOrAdmin for both, and in updateTender controller, reject if admin.
    app.patch('/api/tenders/:id', isAuth, isOwnerOrAdmin(Tender), (req, res, next) => {
        if (req.user.role === 'admin') {
            return res.status(403).json({ error: "لا يمكن للمشرف تعديل تفاصيل العطاء" });
        }
        next();
    }, TenderController.updateTender);

    app.delete('/api/tenders/:id', isAuth, isOwnerOrAdmin(Tender), TenderController.closeTender);
};
