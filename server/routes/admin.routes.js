const express = require("express");
const {
  listPendingOrganizations,
  approveOrganization,
  rejectOrganization,
} = require("../controllers/admin.controller");
const { isAuth, isRole } = require("../config/jwt.config");

const router = express.Router();

// Middleware order is always isAuth -> isRole([...]) -> controller (FR-5.2, FR-5.3).
const adminOnly = [isAuth, isRole(["admin"])];

router.get("/admin/organizations/pending", ...adminOnly, listPendingOrganizations);
router.patch("/admin/organizations/:id/approve", ...adminOnly, approveOrganization);
router.patch("/admin/organizations/:id/reject", ...adminOnly, rejectOrganization);

module.exports = router;
