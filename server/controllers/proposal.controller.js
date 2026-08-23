const BidProposal = require("../models/bidProposal.model");
const Tender = require("../models/tender.model");
const { discardUploadedFile } = require("../config/multer.config");

const SELF_BID_MESSAGE = "لا يمكنك تقديم عرض على عطاء تملكه.";
const DUPLICATE_MESSAGE = "لقد قدّمت عرضاً على هذا العطاء مسبقاً.";
const CLOSED_TENDER_MESSAGE = "لا يمكن تقديم عرض على عطاء مغلق أو ملغى.";

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
};

const fieldError = (field, message) => {
  const err = new Error("validation failed");
  err.status = 400;
  err.errors = { [field]: message };
  return err;
};

/**
 * POST /api/tenders/:id/proposals — FR-9
 *
 * multer has already written the document by the time this runs, so every
 * rejection path discards it rather than leaving an orphan on disk.
 */
const submitProposal = async (req, res, next) => {
  try {
    const tender = await Tender.findById(req.params.id);

    if (!tender) {
      discardUploadedFile(req.file);
      return next(httpError(404, "العطاء المطلوب غير موجود."));
    }

    // Nonsense data otherwise: a proposal against a tender nobody can accept.
    if (tender.status !== "open") {
      discardUploadedFile(req.file);
      return next(httpError(400, CLOSED_TENDER_MESSAGE));
    }

    // FR-9.2 — the tender's own owner may not bid on it.
    if (String(tender.createdBy) === String(req.user._id)) {
      discardUploadedFile(req.file);
      return next(httpError(403, SELF_BID_MESSAGE));
    }

    // FR-9.3 — first line of defence. The unique index is the real one.
    const existing = await BidProposal.findOne({
      tender: tender._id,
      submittedBy: req.user._id,
    });
    if (existing) {
      discardUploadedFile(req.file);
      return next(httpError(400, DUPLICATE_MESSAGE));
    }

    if (!req.file) {
      return next(fieldError("proposalDocument", "مستند العرض مطلوب."));
    }

    const proposal = new BidProposal({
      tender: tender._id,
      // FR-5.4: the submitter is the authenticated caller, never a body value.
      submittedBy: req.user._id,
      documentUrl: `/uploads/${req.file.filename}`,
      finalPrice: req.body.finalPrice,
      // FR-9.4 — always "submitted" on creation.
      status: "submitted",
      // aiExtractedData is deliberately absent until Sprint 05 (FR-10).
    });

    try {
      await proposal.validate();
    } catch (schemaError) {
      discardUploadedFile(req.file);
      const errors = {};
      for (const field of Object.keys(schemaError.errors || {})) {
        errors[field] = schemaError.errors[field].message;
      }
      const err = new Error("validation failed");
      err.status = 400;
      err.errors = errors;
      return next(err);
    }

    try {
      await proposal.save();
    } catch (saveError) {
      discardUploadedFile(req.file);
      // The compound unique index fired — two submissions raced past the
      // controller check above. A validation failure, not a server fault.
      if (saveError.code === 11000) {
        return next(httpError(400, DUPLICATE_MESSAGE));
      }
      throw saveError;
    }

    res.json({ proposal });
  } catch (err) {
    discardUploadedFile(req.file);
    next(err);
  }
};

/**
 * GET /api/tenders/:id/proposals — FR-11.1
 *
 * isOwnerOrAdmin has already loaded the tender and refused anyone who is
 * neither its owner nor an admin. That guard is what keeps competitors from
 * reading each other's prices.
 */
const listProposalsForTender = async (req, res, next) => {
  try {
    const proposals = await BidProposal.find({ tender: req.resource._id })
      // email is included because EmailJS sends from the browser (C-8), so the
      // tender owner's client needs the recipient address to notify a decision
      // (FR-11.3). Nothing else about the submitter is exposed.
      .populate("submittedBy", "companyName email")
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proposals?mine=true — the submitting organization's own proposals.
 *
 * Not in SRS §4.2, but SRS §4.1 describes the organization dashboard as
 * "My tenders, my proposals", and Sprint 09 needs it: FR-15.1 gives the
 * submitter half of the negotiation thread, and without this list there is no
 * way for them to reach an accepted proposal. Follows the ?mine=true pattern
 * used for tenders and auctions.
 */
const listMyProposals = async (req, res, next) => {
  try {
    const proposals = await BidProposal.find({ submittedBy: req.user._id })
      .populate("tender", "title category status createdBy")
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proposals/:id
 *
 * Readable by the owner of the tender, the organization that submitted it, or
 * an admin. Nobody else — the submitter needs their own record for the AI panel
 * in Sprint 05 (FR-10.2), and the tender owner needs it to decide (FR-11).
 */
const getProposalById = async (req, res, next) => {
  try {
    const proposal = await BidProposal.findById(req.params.id)
      .populate("submittedBy", "companyName")
      .populate("tender", "title createdBy status");

    if (!proposal) return next(httpError(404, "العرض المطلوب غير موجود."));

    const callerId = String(req.user._id);
    const isAdmin = req.user.role === "admin";
    const isSubmitter = String(proposal.submittedBy?._id) === callerId;
    const isTenderOwner = String(proposal.tender?.createdBy) === callerId;

    if (!isAdmin && !isSubmitter && !isTenderOwner) {
      const err = new Error("forbidden");
      err.status = 403;
      return next(err);
    }

    res.json({ proposal });
  } catch (err) {
    next(err);
  }
};

const DECISIONS = ["accepted", "rejected"];

/**
 * PATCH /api/proposals/:id — FR-10.3
 *
 * The submitting organization revises its own final price after seeing the AI
 * analysis, while the proposal is still awaiting a decision. The AI figure is
 * advisory: whatever sits here is what binds, and aiExtractedData is kept
 * separately so the tender owner can compare the two.
 */
const updateProposalPrice = async (req, res, next) => {
  try {
    const proposal = await BidProposal.findById(req.params.id);
    if (!proposal) return next(httpError(404, "العرض المطلوب غير موجود."));

    if (String(proposal.submittedBy) !== String(req.user._id)) {
      const err = new Error("forbidden");
      err.status = 403;
      return next(err);
    }

    if (proposal.status !== "submitted") {
      return next(httpError(400, "لا يمكن تعديل عرض تمت معالجته."));
    }

    proposal.finalPrice = req.body.finalPrice;
    await proposal.save();

    res.json({ proposal });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/proposals/:id/status — FR-11.2
 *
 * The tender owner alone decides. Accepting one proposal deliberately leaves
 * every other proposal untouched at "submitted" — FR-11.4 forbids auto-
 * rejecting the rest, which must be a separate explicit action.
 */
const updateProposalStatus = async (req, res, next) => {
  try {
    // submittedBy is populated too, so the decision response has the same
    // shape as the list response and the client can merge it in place.
    const proposal = await BidProposal.findById(req.params.id)
      .populate("tender", "createdBy title")
      .populate("submittedBy", "companyName email");
    if (!proposal) return next(httpError(404, "العرض المطلوب غير موجود."));

    if (String(proposal.tender?.createdBy) !== String(req.user._id)) {
      const err = new Error("forbidden");
      err.status = 403;
      return next(err);
    }

    if (!DECISIONS.includes(req.body.status)) {
      const err = new Error("validation failed");
      err.status = 400;
      err.errors = { status: "القرار غير صالح. اختر قبول العرض أو رفضه." };
      return next(err);
    }

    if (proposal.status !== "submitted") {
      return next(httpError(400, "تمت معالجة هذا العرض مسبقاً."));
    }

    proposal.status = req.body.status;
    await proposal.save();

    // FR-11.3 / FR-16.1 — the decision notice is sent from the browser by
    // notifyProposalAccepted / notifyProposalRejected in
    // client/src/functions/sendEmail.js, which is why submittedBy is populated
    // with the address above. A failed send never rolls back this decision
    // (NFR-R2) — the record above is the source of truth.

    res.json({ proposal });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitProposal,
  listMyProposals,
  listProposalsForTender,
  getProposalById,
  updateProposalPrice,
  updateProposalStatus,
};
