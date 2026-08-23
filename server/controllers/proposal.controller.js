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

    // Explicit validation rather than relying solely on the schema: an
    // omitted or non-numeric finalPrice must be a clear 400, not a silent
    // no-op save (Mongoose does not clear a path when assigned undefined).
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