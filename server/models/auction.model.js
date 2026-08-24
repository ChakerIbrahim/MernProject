/**
 * auction.model.js
 * Mongoose schema and model for public auctions.
 * Includes dynamic item fields, multi-image support, and bid tracking.
 */
const mongoose = require('mongoose');

const AuctionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "عنوان المزاد مطلوب"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "وصف المزاد مطلوب"],
        trim: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    images: {
        type: [String],
        default: []
    },
    officialDocumentUrl: {
        type: String,
        default: ''
    },
    officialDocumentName: {
        type: String,
        default: ''
    },
    itemFields: {
        type: [{
            key: { type: String, required: true, trim: true },
            label: { type: String, required: true, trim: true },
            value: { type: String, default: '', trim: true },
            type: { type: String, enum: ['text', 'number', 'date'], default: 'text' },
            required: { type: Boolean, default: false },
            source: { type: String, enum: ['manual', 'document'], default: 'manual' }
        }],
        default: []
    },
    startingPrice: {
        type: Number,
        required: [true, "السعر الافتتاحي مطلوب"],
        min: [0.01, "السعر الافتتاحي يجب أن يكون أكبر من صفر"]
    },
    currentPrice: {
        type: Number,
        required: [true, "السعر الحالي مطلوب"],
        default: function() { return this.startingPrice; },
        min: [0, "السعر الحالي لا يمكن أن يكون سالباً"]
    },
    currentHighestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "منشئ المزاد مطلوب"]
    },
    endsAt: {
        type: Date,
        required: [true, "موعد انتهاء المزاد مطلوب"],
        validate: {
            validator: function(value) {
                if (!this.isModified || !this.isModified('endsAt')) return true;
                return value > new Date();
            },
            message: "يجب أن يكون موعد انتهاء المزاد في المستقبل"
        }
    },
    status: {
        type: String,
        enum: ['pending_approval', 'active', 'ended', 'cancelled'],
        default: 'pending_approval'
    }
}, { timestamps: true });

AuctionSchema.pre('save', function() {
    if (this.isNew) this.currentPrice = this.startingPrice;
});

module.exports = mongoose.model('Auction', AuctionSchema);
