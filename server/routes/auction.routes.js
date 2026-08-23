const express = require("express");
const {
  createAuction,
  listActiveAuctions,
  getAuctionById,
  placeBid,
  listMyBidAuctions,
  listPendingAuctions,
  approveAuction,
  rejectAuction,
  listAllAuctions,
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
router.get("/auctions", attachUserIfPresent, listActiveAuctions);
router.get("/auctions/:id", attachUserIfPresent, getAuctionById);

// --- authenticated --------------------------------------------------------
router.post(
  "/auctions",
  isAuth,
  isApprovedOrganizationOrAdmin,
  upload.single("image"),
  verifyUploadedFile,
  createAuction
);

router.post(
  "/auctions/:id/bid",
  bidLimiter,
  isAuth,
  isRole(["individual"]),
  placeBid
);

router.get("/users/me/auctions", isAuth, isRole(["individual"]), listMyBidAuctions);

// --- admin ----------------------------------------------------------------
router.get("/admin/auctions/pending", isAuth, isRole(["admin"]), listPendingAuctions);
router.get("/admin/auctions", isAuth, isRole(["admin"]), listAllAuctions);
router.patch("/admin/auctions/:id/approve", isAuth, isRole(["admin"]), approveAuction);
router.patch("/admin/auctions/:id/reject", isAuth, isRole(["admin"]), rejectAuction);

module.exports = router;