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

    if (tender.status !== "open") {
      discardUploadedFile(req.file);
      return next(httpError(400, CLOSED_TENDER_MESSAGE));
    }

    if (String(tender.createdBy) === String(req.user._id)) {
      discardUploadedFile(req.file);
      return next(httpError(403, SELF_BID_MESSAGE));
    }

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
      submittedBy: req.user._id,
      documentUrl: `/uploads/${req.file.filename}`,
      finalPrice: req.body.finalPrice,
      status: "submitted",
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
 */
const listProposalsForTender = async (req, res, next) => {
  try {
    const proposals = await BidProposal.find({ tender: req.resource._id })
      .populate("submittedBy", "companyName email")
      .sort({ createdAt: -1 });

    res.json({ proposals });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proposals?mine=true — the submitting organization's own proposals.
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

    const finalPrice = Number(req.body.finalPrice);
    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      return next(fieldError("finalPrice", "يرجى إدخال سعر صحيح."));
    }

    proposal.finalPrice = finalPrice;
    await proposal.save();

    res.json({ proposal });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/proposals/:id/status — FR-11.2
 */
const updateProposalStatus = async (req, res, next) => {
  try {
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