const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT Bearer token from the Authorization header.
 * Attaches the decoded payload to req.user if valid.
 * Returns 401 if missing or invalid.
 */
module.exports.isAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "غير مصرح لك بالوصول" });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ error: "الجلسة منتهية أو غير صالحة" });
        }
        req.user = payload;
        next();
    });
};

/**
 * Restricts access to specific roles.
 * Must be used after isAuth.
 * Returns 403 if req.user.role is not in allowedRoles.
 */
module.exports.isRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "لا تملك الصلاحية الكافية" });
        }
        next();
    };
};

/**
 * Checks for a JWT but does not reject the request if missing.
 * Attaches req.user if a valid token exists, otherwise proceeds anonymously.
 */
module.exports.optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET, (err, payload) => {
        if (!err) req.user = payload;
        next();
    });
};

/**
 * Allows admins, or organizations with 'approved' status in the database.
 * Requires a database lookup for organizations to verify current status.
 * Returns 403 if not approved or wrong role.
 */
module.exports.isApprovedOrganizationOrAdmin = async (req, res, next) => {
    try {
        if (req.user?.role === 'admin') return next();
        if (req.user?.role !== 'organization') {
            return res.status(403).json({ error: "هذا الإجراء مخصص للمؤسسات المعتمدة أو المشرف" });
        }

        const User = require('../models/user.model');
        const organization = await User.findById(req.user.id).select('status role');
        if (!organization || organization.role !== 'organization' || organization.status !== 'approved') {
            return res.status(403).json({ error: "حساب المؤسسة غير معتمد حتى الآن" });
        }
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Strictly requires the user to be an 'approved' organization.
 * Performs a database lookup to confirm status.
 * Returns 403 if unapproved or not an organization.
 */
module.exports.isApprovedOrganization = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'organization') {
            return res.status(403).json({ error: "هذا الإجراء مخصص للمؤسسات فقط" });
        }
        const User = require('../models/user.model');
        const org = await User.findById(req.user.id);
        if (!org || org.status !== 'approved') {
            return res.status(403).json({ error: "حساب المؤسسة غير معتمد حتى الآن" });
        }
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Verifies the user is either an admin or the owner of the specific resource.
 * Looks up the document by ID and compares its ownerField to req.user.id.
 * Returns 404 if not found, 403 if not owned/admin.
 */
module.exports.isOwnerOrAdmin = (model, idParam = 'id', ownerField = 'createdBy') => {
    return async (req, res, next) => {
        try {
            if (req.user.role === 'admin') {
                return next();
            }

            const doc = await model.findById(req.params[idParam]);
            if (!doc) {
                return res.status(404).json({ error: "العنصر غير موجود" });
            }

            if (doc[ownerField].toString() !== req.user.id) {
                return res.status(403).json({ error: "لا تملك الصلاحية لتعديل هذا العنصر" });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};
