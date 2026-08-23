const mongoose = require("mongoose");

// A fixed list so the category filter has stable values to match against
// (FR-7.2). The client mirrors this list; the schema is the authority.
const TENDER_CATEGORIES = [
  "إنشاءات",
  "تكنولوجيا المعلومات",
  "توريدات",
  "خدمات استشارية",
  "نقل ومواصلات",
  "صيانة",
  "أخرى",
];

const TENDER_STATUSES = ["open", "closed", "cancelled"];

const tenderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "عنوان العطاء مطلوب."],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "وصف العطاء مطلوب."],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "فئة العطاء مطلوبة."],
      enum: {
        values: TENDER_CATEGORIES,
        message: "فئة العطاء غير صالحة.",
      },
    },
    budgetEstimate: {
      type: Number,
      min: [0, "الميزانية التقديرية لا يمكن أن تكون سالبة."],
    },
    deadline: {
      type: Date,
      required: [true, "الموعد النهائي مطلوب."],
      // Mongoose has no built-in future-date rule (SRS §5.6). This validator
      // does NOT run on findOneAndUpdate unless the update passes
      // { runValidators: true } — without that a tender can be edited into
      // the past. The update path here loads and saves the document instead,
      // so the validator always runs.
      validate: {
        validator: (value) => value > new Date(),
        message: "يجب أن يكون الموعد النهائي في المستقبل.",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: TENDER_STATUSES,
        message: "حالة العطاء غير صالحة.",
      },
      default: "open",
    },
  },
  { timestamps: true }
);

const Tender = mongoose.model("Tender", tenderSchema);

module.exports = Tender;
module.exports.TENDER_CATEGORIES = TENDER_CATEGORIES;
module.exports.TENDER_STATUSES = TENDER_STATUSES;
