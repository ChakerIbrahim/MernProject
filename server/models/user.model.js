const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const BCRYPT_ROUNDS = 10;

// Conditional-required predicates (SRS §5.1). Declared here so the rule lives
// in exactly one place (NFR-M3) instead of being re-checked in controllers.
const isOrganization = function () {
  return this.role === "organization";
};

const isIndividual = function () {
  return this.role === "individual";
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "الاسم مطلوب."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "البريد الإلكتروني مطلوب."],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "كلمة المرور مطلوبة."],
      minlength: [8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل."],
      // NFR-S2: never comes back from a query unless explicitly asked for
      // with .select("+password") — which only the login controller does.
      select: false,
    },
    role: {
      type: String,
      required: [true, "نوع الحساب مطلوب."],
      enum: {
        values: ["admin", "organization", "individual"],
        message: "نوع الحساب غير صالح.",
      },
    },
    companyName: {
      type: String,
      required: [isOrganization, "اسم المؤسسة مطلوب."],
      trim: true,
    },
    commercialRegisterNo: {
      type: String,
      required: [isOrganization, "رقم السجل التجاري مطلوب."],
      trim: true,
    },
    proofDocumentUrl: {
      type: String,
      required: [isOrganization, "وثيقة الإثبات مطلوبة."],
    },
    nationalId: {
      type: String,
      required: [isIndividual, "رقم الهوية مطلوب."],
      trim: true,
    },
    // FR-4.3 — the optional reason an admin gives when rejecting. Not listed
    // in SRS §5.1, which has no field for it, but FR-4.3 requires the reason to
    // be stored; the data model section is silent rather than contradictory.
    rejectionReason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "حالة الحساب غير صالحة.",
      },
      default: "approved",
    },
  },
  { timestamps: true }
);

// FR-1.4 / NFR-S1. The isModified guard is essential: without it every later
// save re-hashes the existing hash and locks the account out permanently.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

// NFR-S2, second line of defence: even a document that was loaded with
// .select("+password") cannot serialise its hash into a response body.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
