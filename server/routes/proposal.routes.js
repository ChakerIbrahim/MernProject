const express = require("express");
const {
  submitProposal,
  listMyProposals,
  listProposalsForTender,
  getProposalById,
  updateProposalPrice,
  updateProposalStatus,
} = require("../controllers/proposal.controller");
const { analyzeProposal } = require("../controllers/ai.controller");
const { isAuth, isRole, isApprovedOrganization } = require("../config/jwt.config");
const { isOwnerOrAdmin } = require("../config/ownership.config");
const { upload, verifyUploadedFile } = require("../config/multer.config");
const Tender = require("../models/tender.model");

const router = express.Router();

// FR-9.1 — only an approved organization submits, and never on its own tender
// (the self-bid check lives in the controller, which has the tender loaded).
router.post(
  "/tenders/:id/proposals",
  isAuth,
  isApprovedOrganization,
  upload.single("proposalDocument"),
  verifyUploadedFile,
  submitProposal
);

// FR-11.1 — the tender's owner or an admin. isOwnerOrAdmin loads the tender
// from :id and refuses everyone else, which is what stops one organization
// reading another's prices.
router.get(
  "/tenders/:id/proposals",
  isAuth,
  isOwnerOrAdmin(Tender),
  listProposalsForTender
);

// The caller's own proposals, so a submitter can find an accepted one and
// open its negotiation thread (FR-15.1). Declared BEFORE /proposals/:id so
// "mine" is never read as an id.
router.get("/proposals", isAuth, isApprovedOrganization, listMyProposals);

// Tender owner, submitter, or admin — decided inside the controller, since the
// answer depends on two different documents.
router.get("/proposals/:id", isAuth, getProposalById);

// FR-10.1 / FR-10.2 — the submitting organization analyses its own document.
// Returns 502 on any AI failure so the client offers the manual path (FR-10.4).
router.post("/proposals/:id/analyze", isAuth, isApprovedOrganization, analyzeProposal);

// FR-10.3 — the submitter revises its own final price after seeing the analysis.
router.patch("/proposals/:id", isAuth, isApprovedOrganization, updateProposalPrice);

// FR-11.2 — the tender owner accepts or rejects. Never touches other proposals.
router.patch("/proposals/:id/status", isAuth, isApprovedOrganization, updateProposalStatus);

module.exports = router;
