/**
 * bidHistory.model.js
 * Mongoose schema and model for logging individual bids on auctions.
 * Records the bidder, auction, and amount at a specific point in time.
 */
const mongoose = require('mongoose');

const BidHistorySchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: [true, "المزاد مطلوب"]
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "صاحب المزايدة مطلوب"]
    },
    amount: {
        type: Number,
        required: [true, "قيمة المزايدة مطلوبة"],
        min: [0.01, "قيمة المزايدة يجب أن تكون أكبر من صفر"]
    }
}, { timestamps: { createdAt: true, updatedAt: false } });

BidHistorySchema.index({ auction: 1, createdAt: -1 });

module.exports = mongoose.model('BidHistory', BidHistorySchema);
