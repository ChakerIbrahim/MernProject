const User = require("../models/user.model");

const ALREADY_DECIDED = "تمت معالجة هذا الطلب مسبقاً.";
const NOT_FOUND = "لا توجد مؤسسة بهذا المعرّف.";

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
};

/**
 * Loads a pending organization or throws the right status.
 * 404 for "no such organization", 400 for "already approved or rejected" —
 * a second decision must not look like a silent success.
 */
const loadPendingOrganization = async (id) => {
  const organization = await User.findOne({ _id: id, role: "organization" });
  if (!organization) throw httpError(404, NOT_FOUND);
  if (organization.status !== "pending") throw httpError(400, ALREADY_DECIDED);
  return organization;
};

/** GET /api/admin/organizations/pending — FR-4.1 */
const listPendingOrganizations = async (req, res, next) => {
  try {
    const organizations = await User.find({
      role: "organization",
      status: "pending",
    }).sort({ createdAt: 1 });

    res.json({ organizations });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/organizations/:id/approve — FR-4.2 */
const approveOrganization = async (req, res, next) => {
  try {
    const organization = await loadPendingOrganization(req.params.id);

    organization.status = "approved";
    organization.rejectionReason = undefined;
    await organization.save();

    // TODO(sprint-08): send the approval notice through the shared EmailJS
    // helper (FR-4.4, FR-16.1). It is triggered client-side; a failed send must
    // never roll back or retry this approval (FR-4.5, NFR-R2) — the record
    // above is already the source of truth.

    res.json({ organization });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/admin/organizations/:id/reject — FR-4.3 */
const rejectOrganization = async (req, res, next) => {
  try {
    const organization = await loadPendingOrganization(req.params.id);

    const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";

    organization.status = "rejected";
    organization.rejectionReason = reason || undefined;
    await organization.save();

    // TODO(sprint-08): send the rejection notice through the shared EmailJS
    // helper (FR-4.4, FR-16.1), including rejectionReason when present. A
    // failed send must never roll back this rejection (FR-4.5, NFR-R2).

    res.json({ organization });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listPendingOrganizations,
  approveOrganization,
  rejectOrganization,
};
