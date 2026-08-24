/**
 * chatRequest.model.js
 * Mongoose schema and model for general chat requests between organizations regarding a tender.
 * Prevents duplicate requests via a unique index.
 */
const mongoose = require('mongoose');

const ChatRequestSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender',
        required: [true, "العطاء مطلوب"]
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "مقدم الطلب مطلوب"]
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "مالك العطاء مطلوب"]
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Prevent duplicate chat requests between the same organization and tender
ChatRequestSchema.index({ tender: 1, requester: 1 }, { unique: true });

module.exports = mongoose.model('ChatRequest', ChatRequestSchema);
