require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectToDatabase = require("./config/mongoose.config");
const { UPLOAD_DIR, SIZE_MESSAGE } = require("./config/multer.config");
const { globalLimiter } = require("./config/rateLimit.config");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const adminRoutes = require("./routes/admin.routes");
const tenderRoutes = require("./routes/tender.routes");
const proposalRoutes = require("./routes/proposal.routes");
const auctionRoutes = require("./routes/auction.routes");
const negotiationRoutes = require("./routes/negotiation.routes");

const app = express();
const PORT = process.env.PORT || 8000;

// --- middleware -----------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(
  cors({
    credentials: true,
    // NFR-S5 / C-6 — exactly one origin, from configuration. Never a wildcard.
    origin: process.env.CLIENT_ORIGIN,
  })
);

// NFR-S / L-3 — a basic global policy. Tighter limits sit on the sensitive
// endpoints in their own routers.
app.use("/api", globalLimiter);

// --- routes ---------------------------------------------------------------
// Uploaded proof documents, served so the admin can open one (L-4: local disk
// for the MVP). helmet's default Cross-Origin-Resource-Policy is same-origin,
// which would stop the client on :5173 embedding these; relaxed here only, and
// only for this directory.
app.use(
  "/uploads",
  helmet.crossOriginResourcePolicy({ policy: "cross-origin" }),
  express.static(UPLOAD_DIR, { index: false, dotfiles: "deny" })
);

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", adminRoutes);
app.use("/api", tenderRoutes);
app.use("/api", proposalRoutes);
app.use("/api", auctionRoutes);
app.use("/api", negotiationRoutes);

// Unknown path -> 404 JSON, never Express's default HTML page (API-5).
app.use((req, res) => {
  res.status(404).json({ message: "المسار المطلوب غير موجود." });
});

// --- global error middleware (NFR-M5) -------------------------------------
// Registered LAST: anything after this never runs. Controllers call next(err);
// this is the only place an error response is shaped.
const GENERIC_MESSAGES = {
  400: "البيانات المُرسلة غير صالحة.",
  401: "يجب تسجيل الدخول للمتابعة.",
  403: "لا تملك صلاحية تنفيذ هذا الإجراء.",
  404: "العنصر المطلوب غير موجود.",
  500: "حدث خطأ غير متوقع في الخادم. حاول مرة أخرى لاحقاً.",
};

// eslint-disable-next-line no-unused-vars -- Express needs the 4th arg to
// recognise this as an error handler.
app.use((err, req, res, next) => {
  // Expected client-side failures (401, 403, validation) are one line —
  // otherwise every unauthenticated request buries the real faults in stack
  // traces. Genuine server faults still log the full error object. Neither
  // logs a request body, which would contain passwords (AGENTS.md §5).
  const isExpected =
    (Number(err.status || err.statusCode) || 500) < 500 ||
    err.name === "ValidationError" ||
    err.name === "CastError" ||
    err.code === 11000;

  if (isExpected) {
    console.warn(`[warn] ${req.method} ${req.originalUrl} — ${err.message}`);
  } else {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  // multer rejects oversized or unexpected files before the controller runs.
  // These are validation failures, not server faults — 400, never 500.
  if (err.name === "MulterError") {
    const field = err.field || "file";
    const message =
      err.code === "LIMIT_FILE_SIZE" ? SIZE_MESSAGE : "تعذّر رفع الملف المرفق.";
    return res.status(400).json({ errors: { [field]: message } });
  }

  // Mongoose validation -> 400 with a per-field map (API-3, DATA-3).
  if (err.name === "ValidationError" && err.errors) {
    const errors = {};
    for (const field of Object.keys(err.errors)) {
      errors[field] = err.errors[field].message;
    }
    return res.status(400).json({ errors });
  }

  // Duplicate key (e.g. an already-registered email, FR-1.1) -> 400.
  if (err.code === 11000) {
    const errors = {};
    for (const field of Object.keys(err.keyPattern || {})) {
      errors[field] = "هذه القيمة مستخدمة مسبقاً.";
    }
    return res.status(400).json({ errors });
  }

  // A malformed ObjectId is a missing resource, not a server fault (API-5).
  if (err.name === "CastError") {
    return res.status(404).json({ message: GENERIC_MESSAGES[404] });
  }

  // A controller-built per-field map, e.g. a duplicate email caught before
  // the write (API-3, DATA-3).
  if (err.errors && typeof err.errors === "object") {
    return res.status(Number(err.status) || 400).json({ errors: err.errors });
  }

  // A single user-facing message for an endpoint the SRS specifies with an
  // { error } body — login is the one case (SRS §4.2).
  if (typeof err.error === "string") {
    return res.status(Number(err.status) || 400).json({ error: err.error });
  }

  const status = Number(err.status || err.statusCode) || 500;
  const message =
    err.expose && err.message
      ? err.message
      : GENERIC_MESSAGES[status] || GENERIC_MESSAGES[500];

  return res.status(status).json({ message });
});

// --- start ----------------------------------------------------------------
const start = async () => {
  try {
    await connectToDatabase();
  } catch {
    // connectToDatabase already logged the full error object.
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
};

// Self-start only when run directly (`npm start`). Importing server.js from a
// script or a test gets the fully configured app without opening a database
// connection or binding a port.
if (require.main === module) {
  start();
}

module.exports = app;
