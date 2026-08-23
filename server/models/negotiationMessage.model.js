const mongoose = require("mongoose");

/**
 * FR-15.1 — a message thread between a tender owner and the organization whose
 * proposal was accepted.
 *
 * Not specified in SRS §5: Phase 5 is a stretch goal (SRS §3.6, L-10), so this
 * is kept minimal and shaped like the existing entities.
 */
const negotiationMessageSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BidProposal",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: {
      type: String,
      required: [true, "نص الرسالة مطلوب."],
      trim: true,
      maxlength: [2000, "الرسالة طويلة جداً. الحد الأقصى 2000 حرف."],
    },
  },
  { timestamps: true }
);

// The thread is read oldest-first on every open, and polled while it is on
// screen. Without this index that query degrades as the thread grows.
negotiationMessageSchema.index({ proposal: 1, createdAt: 1 });

module.exports = mongoose.model("NegotiationMessage", negotiationMessageSchema);
