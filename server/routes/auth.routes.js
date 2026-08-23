const express = require("express");
const { register, login } = require("../controllers/auth.controller");
const { upload, verifyUploadedFile } = require("../config/multer.config");
const { authLimiter } = require("../config/rateLimit.config");

const router = express.Router();

// The organization branch posts multipart/form-data carrying the proof document
// (FR-1.3); the individual branch posts plain JSON. multer passes a non-
// multipart request straight through, and verifyUploadedFile is a no-op when
// no file arrived, so one route serves both.
router.post(
  "/auth/register",
  authLimiter,
  upload.single("proofDocument"),
  verifyUploadedFile,
  register
);

router.post("/auth/login", authLimiter, login);

module.exports = router;
