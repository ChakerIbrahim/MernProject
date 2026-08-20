const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_FILE_BYTES = 5 * 1024 * 1024;

// C-9: jpg, jpeg, png, pdf only. Mapped to the extension WE choose — the
// caller's filename is never reused.
const ALLOWED_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "application/pdf": ".pdf",
};

// NFR-S8 defence in depth. `file.mimetype` is just the Content-Type the client
// declared for that part, and a browser derives it from the file extension —
// so renaming evil.txt to evil.pdf produces a declared type of application/pdf
// and would sail through a mimetype-only check. These are the real magic bytes.
const SIGNATURES = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
];

const TYPE_MESSAGE = "نوع الملف غير مدعوم. الملفات المسموح بها: JPG أو PNG أو PDF.";
const SIZE_MESSAGE = "حجم الملف يتجاوز الحد المسموح به (5 ميغابايت).";

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const fieldError = (field, message) => {
  const err = new Error("upload rejected");
  err.status = 400;
  err.errors = { [field]: message };
  return err;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never reuse the caller's name: it can carry path separators, a null
    // byte, or a second extension.
    const ext = ALLOWED_TYPES[file.mimetype] || "";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

// First gate: the declared type. Cheap, and rejects the obvious cases before a
// single byte is written to disk.
const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES[file.mimetype]) return cb(null, true);
  cb(fieldError(file.fieldname, TYPE_MESSAGE));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_BYTES },
});

/**
 * Second gate, and the one that matters: read the bytes actually written and
 * confirm they match a permitted format. Runs after upload.single(...).
 * Deletes the file before rejecting, so a probe cannot litter /uploads.
 *
 * A no-op when the request carried no file — the individual registration
 * branch sends plain JSON.
 */
const verifyUploadedFile = (req, res, next) => {
  if (!req.file) return next();

  let handle;
  try {
    const head = Buffer.alloc(8);
    handle = fs.openSync(req.file.path, "r");
    const read = fs.readSync(handle, head, 0, 8, 0);
    fs.closeSync(handle);
    handle = undefined;

    const matched = SIGNATURES.find(
      (sig) =>
        read >= sig.bytes.length &&
        sig.bytes.every((byte, i) => head[i] === byte)
    );

    if (!matched || matched.mime !== req.file.mimetype) {
      fs.unlinkSync(req.file.path);
      return next(fieldError(req.file.fieldname, TYPE_MESSAGE));
    }

    return next();
  } catch (err) {
    if (handle !== undefined) {
      try {
        fs.closeSync(handle);
      } catch {
        /* already closed */
      }
    }
    return next(err);
  }
};

/** Removes an uploaded file after a later validation failure (DATA-2 tidiness). */
const discardUploadedFile = (file) => {
  if (!file?.path) return;
  try {
    fs.unlinkSync(file.path);
  } catch {
    /* already gone; nothing to undo */
  }
};

module.exports = {
  upload,
  verifyUploadedFile,
  discardUploadedFile,
  UPLOAD_DIR,
  MAX_FILE_BYTES,
  SIZE_MESSAGE,
  TYPE_MESSAGE,
};
