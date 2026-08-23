const express = require("express");
const {
  createTender,
  listTenders,
  getTenderById,
  updateTender,
  closeTender,
  listAllTendersForAdmin,
} = require("../controllers/tender.controller");
const { isAuth, isRole, isApprovedOrganization } = require("../config/jwt.config");
const { isOwnerOrAdmin } = require("../config/ownership.config");
const Tender = require("../models/tender.model");

const router = express.Router();

// Order is always: authenticate, then authorize by role/status, then check
// ownership, then the controller (FR-5.2, FR-5.3, FR-6.3).

// FR-6.1 / FR-6.3 — only an APPROVED organization may publish.
router.post("/tenders", isAuth, isApprovedOrganization, createTender);

// FR-7.1 — any authenticated user may browse.
router.get("/tenders", isAuth, listTenders);
router.get("/tenders/:id", isAuth, getTenderById);

// Admin oversight — every tender regardless of status. Declared here so it
// mounts alongside the other tender routes even though it's under /admin.
router.get("/admin/tenders", isAuth, isRole(["admin"]), listAllTendersForAdmin);

// FR-8.1 — editing belongs to the owning organization alone. allowAdmin is
// false here: an admin moderates by closing (below), not by rewriting content.
router.patch(
  "/tenders/:id",
  isAuth,
  isRole(["organization"]),
  isOwnerOrAdmin(Tender, { allowAdmin: false }),
  updateTender
);

// FR-8.2 / FR-8.3 — the owner or an admin may close or cancel any tender.
router.delete(
  "/tenders/:id",
  isAuth,
  isRole(["organization", "admin"]),
  isOwnerOrAdmin(Tender),
  closeTender
);

module.exports = router;