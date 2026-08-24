/**
 * bidProposal.model.js
 * Mongoose schema and model for proposals submitted by organizations against tenders.
 * Enforces one proposal per organization per tender via a unique index.
 */
const mongoose = require('mongoose');

const BidProposalSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender',
        required: [true, "العطاء مطلوب"]
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "مقدم العرض مطلوب"]
    },
    documentUrl: {
        type: String,
        required: [true, "مستند العرض مطلوب"]
    },
    aiExtractedData: {
        type: mongoose.Schema.Types.Mixed
    },
    finalPrice: {
        type: Number,
        required: [true, "السعر النهائي مطلوب"],
        min: [0, "السعر يجب أن يكون رقماً موجباً"]
    },
    status: {
        type: String,
        enum: ['submitted', 'under_review', 'accepted', 'rejected'],
        default: 'submitted'
    },
    contractDraft: {
        type: String
    }
}, { timestamps: true });

// Enforce duplicate rule at database level
BidProposalSchema.index({ tender: 1, submittedBy: 1 }, { unique: true });

module.exports = mongoose.model('BidProposal', BidProposalSchema);
