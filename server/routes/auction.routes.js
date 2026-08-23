const express = require("express");
const {
  createAuction,
  listActiveAuctions,
  getAuctionById,
  placeBid,
  listMyBidAuctions,
  listPendingAuctions,
  approveAuction,
} = require("../controllers/auction.controller");
const {
  isAuth,
  isRole,
  isApprovedOrganizationOrAdmin,
  attachUserIfPresent,
} = require("../config/jwt.config");
const { upload, verifyUploadedFile } = require("../config/multer.config");
const { bidLimiter } = require("../config/rateLimit.config");

const router = express.Router();

// --- public (FR-12.4) -----------------------------------------------------
// No router-level isAuth anywhere in this file: mounting these behind auth is
// the documented way to break FR-12.4 by accident. attachUserIfPresent never
// rejects — it lets the list serve ?mine=true and lets the detail route
// recognise a creator or an admin.
router.get("/auctions", attachUserIfPresent, listActiveAuctions);
router.get("/auctions/:id", attachUserIfPresent, getAuctionById);

// --- authenticated --------------------------------------------------------
// FR-12.1 — an approved organization or an admin may list an auction.
router.post(
  "/auctions",
  isAuth,
  isApprovedOrganizationOrAdmin,
  upload.single("image"),
  verifyUploadedFile,
  createAuction
);

// FR-13.1 — only an individual bids. Organizations and admins get 403.
router.post(
  "/auctions/:id/bid",
  bidLimiter,
  isAuth,
  isRole(["individual"]),
  placeBid
);

// FR-14.4 — the individual's own bidding history with outcomes (SRS §4.2).
router.get("/users/me/auctions", isAuth, isRole(["individual"]), listMyBidAuctions);

// --- admin ----------------------------------------------------------------
router.get("/admin/auctions/pending", isAuth, isRole(["admin"]), listPendingAuctions);
router.patch("/admin/auctions/:id/approve", isAuth, isRole(["admin"]), approveAuction);
router.patch("/admin/auctions/:id/reject", isAuth, isRole(["admin"]), rejectAuction);

module.exports = router;
