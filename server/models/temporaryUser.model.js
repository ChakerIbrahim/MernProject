/**
 * temporaryUser.model.js
 * Mongoose schema and model for users pending email verification.
 * Automatically deletes unverified accounts via a TTL index.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const TemporaryUserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    companyName: { type: String },
    phoneNumber: { type: String, required: true },
    proofDocumentUrl: { type: String, required: true },
    nationalId: { type: String },
    aiVerification: { type: mongoose.Schema.Types.Mixed },
    verificationCode: { type: String, required: true },
    verificationCodeExpiresAt: { type: Date, required: true }
}, { timestamps: true });

// Hash password before saving to temp collection
TemporaryUserSchema.pre('save', async function() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// TTL index to automatically delete unverified temporary registrations after 2 hours
TemporaryUserSchema.index({ "createdAt": 1 }, { expireAfterSeconds: 7200 });

module.exports = mongoose.model('TemporaryUser', TemporaryUserSchema);
