/**
 * negotiationMessage.model.js
 * Mongoose schema and model for individual chat messages.
 * Messages can be linked to either a BidProposal or a ChatRequest.
 */
const mongoose = require('mongoose');

const NegotiationMessageSchema = new mongoose.Schema({
    proposal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BidProposal'
        // No longer strictly required, as chatRequest might be used instead
    },
    chatRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatRequest'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "المرسل مطلوب"]
    },
    body: {
        type: String,
        required: [true, "نص الرسالة مطلوب"],
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: { createdAt: true, updatedAt: false } });

NegotiationMessageSchema.index({ proposal: 1, createdAt: 1 });
NegotiationMessageSchema.index({ chatRequest: 1, createdAt: 1 });

module.exports = mongoose.model('NegotiationMessage', NegotiationMessageSchema);
