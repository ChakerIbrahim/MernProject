const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const { signToken } = require("../config/jwt.config");
const { discardUploadedFile } = require("../config/multer.config");

// FR-5.4 / NFR-S6: `admin` is deliberately absent. The first admin is created
// by config/seed.js and can never be produced through public registration.
const REGISTERABLE_ROLES = ["organization", "individual"];

// FR-3.2: one message for both "no such email" and "wrong password", so the
// response never reveals whether an address is registered.
const CREDENTIALS_MESSAGE = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

const normaliseEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const validationError = (errors) => {
  const err = new Error("validation failed");
  err.status = 400;
  err.errors = errors;
  return err;
};

/**
 * POST /api/auth/register — one endpoint, branching on role (FR-1, FR-2).
 * Responds 200 { user } per SRS §4.2.
 */
const register = async (req, res, next) => {
  try {
    const errors = {};
    const email = normaliseEmail(req.body.email);

    // Whitelisted explicitly. Never spread req.body into the model: that is
    // how a caller would smuggle in role: "admin" or status: "approved".
    const role = REGISTERABLE_ROLES.includes(req.body.role) ? req.body.role : null;
    if (!role) {
      errors.role = "نوع الحساب غير صالح. اختر حساب مؤسسة أو حساب فرد.";
    }

    if (email) {
      const existing = await User.findOne({ email });
      if (existing) errors.email = "البريد الإلكتروني مسجّل مسبقاً.";
    }

    const payload = {
      name: req.body.name,
      email,
      password: req.body.password,
      role,
      // FR-1.5 / FR-2.2: derived from the role, never read from the body.
      status: role === "organization" ? "pending" : "approved",
    };

    if (role === "organization") {
      payload.companyName = req.body.companyName;
      payload.commercialRegisterNo = req.body.commercialRegisterNo;
      // FR-1.3 / C-9: the URL comes from the file multer just wrote, never from
      // the request body — otherwise a caller could point it at anything.
      payload.proofDocumentUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    }

    if (role === "individual") {
      payload.nationalId = req.body.nationalId;
    }

    const user = new User(payload);

    // DATA-3: collect every failing field in one pass rather than stopping at
    // the first. DATA-2: validate before save, so a failure writes nothing.
    try {
      await user.validate();
    } catch (schemaError) {
      for (const field of Object.keys(schemaError.errors || {})) {
        // Never overwrite a message the controller already set. Rejecting
        // role: "admin" must say "not a valid account type", not the schema's
        // generic "account type is required".
        if (!errors[field]) errors[field] = schemaError.errors[field].message;
      }
    }

    // The client's file input is named proofDocument; the schema field it feeds
    // is proofDocumentUrl. Report the error under the name the form knows, so
    // the message lands on the input the user can actually fix.
    if (errors.proofDocumentUrl) {
      errors.proofDocument = errors.proofDocumentUrl;
      delete errors.proofDocumentUrl;
    }

    if (Object.keys(errors).length) {
      // Nothing was written, so the file multer already saved is now orphaned.
      discardUploadedFile(req.file);
      return next(validationError(errors));
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    discardUploadedFile(req.file);
    next(err);
  }
};

/**
 * POST /api/auth/login (FR-3.1 … FR-3.4).
 * Responds 200 { user, token } on success, 400 { error } on bad credentials,
 * both per SRS §4.2. The token travels in the body — this project uses no
 * cookies (SPRINT_PLAN.md §6).
 */
const login = async (req, res, next) => {
  try {
    const email = normaliseEmail(req.body.email);
    const password = typeof req.body.password === "string" ? req.body.password : "";

    const user = await User.findOne({ email }).select("+password");

    // The await is mandatory. bcrypt.compare returns a Promise, and a Promise
    // is always truthy — without it every password on earth would succeed.
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !isMatch) {
      const err = new Error(CREDENTIALS_MESSAGE);
      err.status = 400;
      err.error = CREDENTIALS_MESSAGE;
      return next(err);
    }

    // FR-3.4: a pending organization logs in successfully; user.status tells
    // the client to show the awaiting-review notice and hide tender actions.
    res.json({ user: user.toJSON(), token: signToken(user) });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
