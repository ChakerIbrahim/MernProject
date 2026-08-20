const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

/**
 * Signs the token returned by login. The payload carries only the identifier
 * and the role — never the password hash or anything else sensitive.
 *
 * No expiry is set: that is accepted limitation L-1 for the MVP, not an
 * oversight. See SRS §7.1.
 */
const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.SECRET);

const unauthenticated = () => {
  const err = new Error("unauthenticated");
  err.status = 401;
  return err;
};

/**
 * FR-5.1, FR-5.2, NFR-S3. Verifies the Bearer token before any controller
 * logic runs and attaches the *database record* to req.user, so role and
 * status are re-derived server-side on every request (FR-5.4, NFR-S6) rather
 * than trusted from the token's claims or — never — the request body.
 */
const isAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) return next(unauthenticated());

    let payload;
    try {
      payload = jwt.verify(token, process.env.SECRET);
    } catch {
      // Expired, malformed, or tampered signature — all 401, never 403.
      return next(unauthenticated());
    }

    const user = await User.findById(payload.id);
    if (!user) return next(unauthenticated());

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * FR-5.3. A factory, so routes read: isAuth, isRole(["admin"]).
 * Runs only after isAuth; 403 means authenticated but wrong role, which is a
 * different outcome from 401 and later sprints depend on the distinction.
 *
 * @param {string[]} allowed
 */
const isRole = (allowed) => (req, res, next) => {
  if (!req.user) return next(unauthenticated());

  if (!allowed.includes(req.user.role)) {
    const err = new Error("forbidden");
    err.status = 403;
    return next(err);
  }

  next();
};

/**
 * FR-6.3 / FR-1.5 — the status gate. An organization whose account is still
 * pending, or was rejected, may authenticate but may not act.
 *
 * Built here in Sprint 02 so that Sprint 03 puts it in front of tender
 * creation rather than improvising the check inside a controller. Without it a
 * pending organization can create tenders by calling the API directly, since
 * hiding the button on the client is only a usability measure (FR-5.5).
 */
const isApprovedOrganization = (req, res, next) => {
  if (!req.user) return next(unauthenticated());

  if (req.user.role !== "organization") {
    const err = new Error("forbidden");
    err.status = 403;
    return next(err);
  }

  if (req.user.status !== "approved") {
    const err = new Error(
      "لا يمكن تنفيذ هذا الإجراء قبل موافقة الإدارة على حساب المؤسسة."
    );
    err.status = 403;
    err.expose = true;
    return next(err);
  }

  next();
};

module.exports = { signToken, isAuth, isRole, isApprovedOrganization };
