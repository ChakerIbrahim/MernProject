const BidProposal = require("../models/bidProposal.model");
const NegotiationMessage = require("../models/negotiationMessage.model");

const NOT_ACCEPTED = "لا تُفتح غرفة التفاوض إلا بعد قبول العرض.";
const NOT_FOUND = "العرض المطلوب غير موجود.";

const httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  err.expose = true;
  return err;
};

const forbidden = () => {
  const err = new Error("forbidden");
  err.status = 403;
  return err;
};

/**
 * FR-15.1 — a thread has exactly two participants: the tender owner and the
 * organization whose proposal was accepted. Everyone else, including other
 * bidders on the same tender, is refused: the thread carries commercially
 * sensitive negotiation.
 *
 * An admin may read but never post — moderation, not participation.
 *
 * @param {string} proposalId
 * @param {object} user
 * @param {{ requirePost?: boolean }} [options]
 */
const loadThreadContext = async (proposalId, user, { requirePost = false } = {}) => {
  const proposal = await BidProposal.findById(proposalId)
    .populate("submittedBy", "companyName name")
    .populate("tender", "title createdBy");

  if (!proposal) throw httpError(404, NOT_FOUND);

  const callerId = String(user._id);
  const isSubmitter = String(proposal.submittedBy?._id) === callerId;
  const isTenderOwner = String(proposal.tender?.createdBy) === callerId;
  const isAdmin = user.role === "admin";

  if (!isSubmitter && !isTenderOwner && !isAdmin) throw forbidden();

  // Reading is open to the two participants and an admin; posting is not.
  if (requirePost && !isSubmitter && !isTenderOwner) throw forbidden();

  // FR-15.1 — the thread exists only once the proposal has been accepted.
  if (proposal.status !== "accepted") throw httpError(400, NOT_ACCEPTED);

  return { proposal, isSubmitter, isTenderOwner, isAdmin };
};

/** GET /api/proposals/:id/messages — FR-15.1, oldest first. */
const listMessages = async (req, res, next) => {
  try {
    const { proposal, isTenderOwner, isSubmitter } = await loadThreadContext(
      req.params.id,
      req.user
    );

    const messages = await NegotiationMessage.find({ proposal: proposal._id })
      .populate("sender", "companyName name role")
      .sort({ createdAt: 1 });

    res.json({
      messages,
      // Enough context for the client to render the thread header and decide
      // whether to show the composer and the draft control.
      thread: {
        proposalId: proposal._id,
        tenderTitle: proposal.tender?.title ?? "",
        counterpartyName: proposal.submittedBy?.companyName ?? "",
        finalPrice: proposal.finalPrice,
        contractDraft: proposal.contractDraft ?? "",
        canPost: isTenderOwner || isSubmitter,
        isTenderOwner,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/proposals/:id/messages — FR-15.1, participants only. */
const postMessage = async (req, res, next) => {
  try {
    const { proposal } = await loadThreadContext(req.params.id, req.user, {
      requirePost: true,
    });

    const message = new NegotiationMessage({
      proposal: proposal._id,
      // FR-5.4 discipline: the sender is the authenticated caller.
      sender: req.user._id,
      body: req.body.body,
    });

    try {
      await message.validate();
    } catch (schemaError) {
      const errors = {};
      for (const field of Object.keys(schemaError.errors || {})) {
        errors[field] = schemaError.errors[field].message;
      }
      const err = new Error("validation failed");
      err.status = 400;
      err.errors = errors;
      return next(err);
    }

    await message.save();
    await message.populate("sender", "companyName name role");

    res.json({ message });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMessages, postMessage };
