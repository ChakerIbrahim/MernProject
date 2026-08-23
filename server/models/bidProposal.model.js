const mongoose = require("mongoose");

const PROPOSAL_STATUSES = ["submitted", "under_review", "accepted", "rejected"];

const bidProposalSchema = new mongoose.Schema(
  {
    tender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tender",
      required: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documentUrl: {
      type: String,
      required: [true, "مستند العرض مطلوب."],
    },

    // Every sub-field is optional by design. FR-10.4 requires submission to
    // succeed when the Gemini call fails, so Sprint 05 must not make any of
    // these required either.
    aiExtractedData: {
      extractedPrice: { type: Number },
      summary: { type: String, trim: true },
      confidenceScore: {
        type: Number,
        min: [0, "درجة الثقة يجب أن تكون بين 0 و 100."],
        max: [100, "درجة الثقة يجب أن تكون بين 0 و 100."],
      },
    },

    finalPrice: {
      type: Number,
      required: [true, "يرجى إدخال سعر صحيح."],
      min: [0.01, "يرجى إدخال سعر صحيح."],
    },
    // FR-15.2 — the AI-generated draft contract, stored here rather than in a
    // second collection. Optional and editable; FR-15.3 makes clear it is not
    // binding without a signature outside the system.
    contractDraft: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: PROPOSAL_STATUSES,
        message: "حالة العرض غير صالحة.",
      },
      default: "submitted",
    },
  },
  { timestamps: true }
);

// FR-9.3 enforced by the database, not just the controller. A controller check
// loses to two rapid submissions; this index cannot. The controller catches the
// resulting E11000 and reports it as a validation failure.
bidProposalSchema.index({ tender: 1, submittedBy: 1 }, { unique: true });

const BidProposal = mongoose.model("BidProposal", bidProposalSchema);

module.exports = BidProposal;
module.exports.PROPOSAL_STATUSES = PROPOSAL_STATUSES;
