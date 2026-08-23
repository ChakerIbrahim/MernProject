const mongoose = require("mongoose");

const AUCTION_STATUSES = ["pending_approval", "active", "ended", "cancelled"];

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "عنوان المزاد مطلوب."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "وصف المزاد مطلوب."],
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    startingPrice: {
      type: Number,
      required: [true, "السعر الافتتاحي مطلوب."],
      min: [0.01, "السعر الافتتاحي يجب أن يكون أكبر من صفر."],
    },
    currentPrice: {
      type: Number,
      required: [true, "السعر الحالي مطلوب."],
      min: [0, "السعر الحالي لا يمكن أن يكون سالباً."],
    },
    currentHighestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    endsAt: {
      type: Date,
      required: [true, "موعد انتهاء المزاد مطلوب."],
      validate: {
        // Enforced on creation and whenever the date itself is edited. Once an
        // auction is running, closing it (FR-14.1) must not be blocked by a
        // rule about when it was created — its endsAt is in the past by then.
        validator: function (value) {
          if (!this.isNew && typeof this.isModified === "function" && !this.isModified("endsAt")) {
            return true;
          }
          return value > new Date();
        },
        message: "يجب أن يكون موعد الانتهاء في المستقبل.",
      },
    },
    status: {
      type: String,
      enum: {
        values: AUCTION_STATUSES,
        message: "حالة المزاد غير صالحة.",
      },
      default: "pending_approval",
    },
  },
  { timestamps: true }
);

// The opening price becomes the current price, set with the data rather than in
// a controller so Sprint 07 can rely on currentPrice never being null.
//
// This runs on "validate", not "save": Mongoose validates before save hooks, so
// a pre("save") assignment would arrive after `required` had already failed.
auctionSchema.pre("validate", function () {
  if (this.isNew) this.currentPrice = this.startingPrice;
});

const Auction = mongoose.model("Auction", auctionSchema);

module.exports = Auction;
module.exports.AUCTION_STATUSES = AUCTION_STATUSES;
