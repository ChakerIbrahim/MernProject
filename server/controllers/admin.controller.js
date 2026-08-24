const User = require('../models/user.model');
const { sendEmail } = require('../services/email.service');

/**
 * Retrieves all organization accounts currently awaiting approval.
 * Returns a JSON object containing the organizations array.
 */
module.exports.listPendingOrganizations = async (req, res, next) => {
    try {
        const organizations = await User.find({ role: 'organization', status: 'pending' }).select('-password');
        res.status(200).json({ organizations });
    } catch (err) {
        next(err);
    }
};

/**
 * Approves a pending organization and sends an email notification.
 * Expects the organization ID in req.params.id.
 * Returns the updated organization and email status.
 */
module.exports.approveOrganization = async (req, res, next) => {
    try {
        const { id } = req.params;
        const org = await User.findById(id);

        if (!org || org.role !== 'organization') {
            return res.status(404).json({ error: "المؤسسة غير موجودة" });
        }
        if (org.status !== 'pending') {
            return res.status(400).json({ error: "تم اتخاذ قرار مسبقاً بشأن هذه المؤسسة" });
        }

        org.status = 'approved';
        await org.save();

        const emailSent = await sendEmail({
            templateType: 'GENERAL',
            to_email: org.email,
            to_name: org.companyName || org.name,
            subject: 'تم اعتماد حساب المؤسسة - اعتماد',
            details: 'تم اعتماد حساب مؤسستكم ويمكنكم الآن تسجيل الدخول واستخدام خدمات منصة اعتماد.'
        });

        res.status(200).json({ organization: org, emailSent });
    } catch (err) {
        next(err);
    }
};

/**
 * Rejects a pending organization, saves an optional reason, and sends an email.
 * Expects the organization ID in req.params.id and reason in req.body.
 * Returns the updated organization and email status.
 */
module.exports.rejectOrganization = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        const org = await User.findById(id);

        if (!org || org.role !== 'organization') {
            return res.status(404).json({ error: "المؤسسة غير موجودة" });
        }
        if (org.status !== 'pending') {
            return res.status(400).json({ error: "تم اتخاذ قرار مسبقاً بشأن هذه المؤسسة" });
        }

        org.status = 'rejected';
        org.rejectionReason = rejectionReason || '';
        await org.save();

        const emailSent = await sendEmail({
            templateType: 'GENERAL',
            to_email: org.email,
            to_name: org.companyName || org.name,
            subject: 'تحديث حالة طلب المؤسسة - اعتماد',
            details: rejectionReason ? `تم رفض طلب التسجيل. السبب: ${rejectionReason}` : 'تم رفض طلب تسجيل المؤسسة.'
        });

        res.status(200).json({ organization: org, emailSent });
    } catch (err) {
        next(err);
    }
};

// --- Account Management ---
/**
 * Retrieves all non-admin users in the system.
 * Returns a JSON object containing the users array.
 */
module.exports.listUsers = async (req, res, next) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.status(200).json({ users });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a single user by their ID, excluding the password field.
 * Returns the user object or 404 if not found.
 */
module.exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes a user's status to 'deactivated'. Admins cannot be deactivated.
 * Returns a success message and the updated user object.
 */
module.exports.deactivateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role === 'admin') return res.status(404).json({ error: 'لا يمكن تعطيل هذا الحساب' });
        user.status = 'deactivated';
        await user.save();
        res.status(200).json({ message: 'تم تعطيل الحساب بنجاح', user });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes a user's status to 'approved', re-enabling their account.
 * Returns a success message and the updated user object.
 */
module.exports.activateUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'الحساب غير موجود' });
        user.status = 'approved';
        await user.save();
        res.status(200).json({ message: 'تم تفعيل الحساب بنجاح', user });
    } catch (err) {
        next(err);
    }
};

/**
 * Permanently deletes a user from the database. Admins cannot be deleted.
 * Returns a success message.
 */
module.exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role === 'admin') return res.status(404).json({ error: 'لا يمكن حذف هذا الحساب' });
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف الحساب نهائياً' });
    } catch (err) {
        next(err);
    }
};

// --- Tender Management ---
const Tender = require('../models/tender.model');

/**
 * Retrieves all tenders, populating the creator's basic details.
 * Returns a JSON object containing the tenders array.
 */
module.exports.listTenders = async (req, res, next) => {
    try {
        const tenders = await Tender.find().populate('createdBy', 'name companyName email').sort({ createdAt: -1 });
        res.status(200).json({ tenders });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes a tender's status to 'closed'.
 * Returns a success message and the updated tender object.
 */
module.exports.closeTender = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ error: 'العطاء غير موجود' });
        tender.status = 'closed';
        await tender.save();
        res.status(200).json({ message: 'تم إغلاق العطاء بنجاح', tender });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes a tender's status to 'open'.
 * Returns a success message and the updated tender object.
 */
module.exports.openTender = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ error: 'العطاء غير موجود' });
        tender.status = 'open';
        await tender.save();
        res.status(200).json({ message: 'تم فتح العطاء بنجاح', tender });
    } catch (err) {
        next(err);
    }
};

/**
 * Permanently deletes a tender from the database.
 * Returns a success message.
 */
module.exports.deleteTender = async (req, res, next) => {
    try {
        const tender = await Tender.findById(req.params.id);
        if (!tender) return res.status(404).json({ error: 'العطاء غير موجود' });
        await Tender.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف العطاء نهائياً' });
    } catch (err) {
        next(err);
    }
};

// --- Auction Management ---
const Auction = require('../models/auction.model');

/**
 * Retrieves all auctions, populating the creator's basic details.
 * Returns a JSON object containing the auctions array.
 */
module.exports.listAuctions = async (req, res, next) => {
    try {
        const auctions = await Auction.find().populate('createdBy', 'name companyName email').sort({ createdAt: -1 });
        res.status(200).json({ auctions });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes an auction's status to 'ended'.
 * Returns a success message and the updated auction object.
 */
module.exports.closeAuction = async (req, res, next) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ error: 'المزاد غير موجود' });
        auction.status = 'ended';
        await auction.save();
        res.status(200).json({ message: 'تم إغلاق المزاد بنجاح', auction });
    } catch (err) {
        next(err);
    }
};

/**
 * Changes an auction's status to 'active'.
 * Returns a success message and the updated auction object.
 */
module.exports.openAuction = async (req, res, next) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ error: 'المزاد غير موجود' });
        auction.status = 'active';
        await auction.save();
        res.status(200).json({ message: 'تم فتح المزاد بنجاح', auction });
    } catch (err) {
        next(err);
    }
};

/**
 * Permanently deletes an auction from the database.
 * Returns a success message.
 */
module.exports.deleteAuction = async (req, res, next) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ error: 'المزاد غير موجود' });
        await Auction.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'تم حذف المزاد نهائياً' });
    } catch (err) {
        next(err);
    }
};
