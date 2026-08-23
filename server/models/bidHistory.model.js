const mongoose = require("mongoose");

const bidHistorySchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "قيمة المزايدة مطلوبة."],
      min: [0.01, "قيمة المزايدة يجب أن تكون أكبر من صفر."],
    },
  },
  // SRS §5.5 lists createdAt only; updatedAt is harmless and consistent with
  // every other collection.
  { timestamps: true }
);

// The auction detail endpoint reads recent bids on every poll (every 4s per
// viewer). Without this index that query degrades as history grows.
bidHistorySchema.index({ auction: 1, createdAt: -1 });

module.exports = mongoose.model("BidHistory", bidHistorySchema);
