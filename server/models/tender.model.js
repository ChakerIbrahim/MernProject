/**
 * tender.model.js
 * Mongoose schema and model for procurement tenders.
 * Stores AI extraction metadata and document-specific custom fields.
 */
const mongoose = require('mongoose');

const TenderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "عنوان العطاء مطلوب"]
    },
    description: {
        type: String,
        required: [true, "وصف العطاء مطلوب"]
    },
    category: {
        type: String,
        required: [true, "الفئة مطلوبة"],
        enum: {
            values: ['توريدات', 'خدمات', 'أشغال عامة', 'استشارات'],
            message: "الفئة غير صالحة"
        }
    },
    budgetEstimate: {
        type: Number,
        min: [0, "الميزانية يجب أن تكون رقماً موجباً"]
    },
    deadline: {
        type: Date,
        required: [true, "الموعد النهائي مطلوب"],
        validate: {
            validator: function(value) {
                // Ignore validation if deadline isn't modified (e.g. updating other fields)
                if (!this.isModified || !this.isModified('deadline')) return true;
                return value > new Date();
            },
            message: "يجب أن يكون الموعد النهائي في المستقبل"
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "منشئ العطاء مطلوب"]
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'cancelled'],
        default: 'open'
    },
    officialBookUrl: {
        type: String,
        trim: true
    },
    officialBookName: {
        type: String,
        trim: true
    },
    aiExtraction: {
        type: mongoose.Schema.Types.Mixed
    },
    customFields: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    priorityFields: {
        type: [String],
        enum: ['title', 'description', 'category', 'budgetEstimate', 'deadline'],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('Tender', TenderSchema);
