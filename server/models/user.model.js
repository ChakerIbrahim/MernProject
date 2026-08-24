/**
 * user.model.js
 * Mongoose schema and model for the core user account.
 * Supports Admin, Organization, and Individual roles with dynamic validation rules.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "الاسم مطلوب"],
        trim: true,
        minlength: [3, "يجب أن يتكون الاسم من 3 أحرف على الأقل"],
        match: [/^[\p{L}\s]{3,}$/u, "يجب أن يتكون الاسم من أحرف ومسافات فقط"]
    },
    email: {
        type: String,
        required: [true, "البريد الإلكتروني مطلوب"],
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "كلمة المرور مطلوبة"],
        minlength: [8, "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"],
        select: false
    },
    role: {
        type: String,
        required: [true, "الدور مطلوب"],
        enum: {
            values: ['admin', 'organization', 'individual'],
            message: "الدور غير صالح"
        }
    },
    companyName: {
        type: String,
        trim: true,
        minlength: [3, "يجب أن يتكون اسم الشركة من 3 أحرف على الأقل"],
        required: [function () { return this.role === "organization"; }, "اسم الشركة مطلوب"]
    },
    phoneNumber: {
        type: String,
        trim: true,
        match: [/^\+?[0-9\s-]{7,15}$/, "رقم الهاتف غير صالح"],
        required: [function () { return this.role === "organization" || this.role === "individual"; }, "رقم الهاتف مطلوب"]
    },
    proofDocumentUrl: {
        type: String,
        required: [function () { return this.role === "organization" || this.role === "individual"; }, "مستند الإثبات مطلوب"]
    },
    nationalId: {
        type: String,
        trim: true
    },
    aiVerification: {
        type: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['pending_verification', 'pending', 'approved', 'rejected', 'deactivated'],
        default: 'approved'
    },
    rejectionReason: {
        type: String
    },
    verificationCode: {
        type: String
    },
    verificationCodeExpiresAt: {
        type: Date
    }
}, { timestamps: true });

UserSchema.pre('save', async function() {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

module.exports = mongoose.model('User', UserSchema);
