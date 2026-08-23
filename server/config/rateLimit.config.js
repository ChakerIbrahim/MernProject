const rateLimit = require("express-rate-limit");

/**
 * Basic rate limiting (NFR-S, L-3). L-3 acknowledges this is deliberately
 * simple: an in-memory per-IP counter, not a distributed policy. It resets on
 * restart and does not survive multiple instances.
 *
 * Limits come from the environment (NFR-M2) so a development machine running
 * the regression suites is not locked out by production-shaped numbers. The
 * defaults below are the production intent.
 */
const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const WINDOW_MS = number(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000);

const arabicLimitResponse = (message) => (req, res) => {
  res.status(429).json({ message });
};

/** Everything, as a backstop against runaway automation. */
const globalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: number(process.env.RATE_LIMIT_MAX, 300),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: arabicLimitResponse(
    "تم تجاوز عدد الطلبات المسموح به. يرجى المحاولة بعد قليل."
  ),
});

/** Login and registration — the credential-guessing surface. */
const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: number(process.env.AUTH_RATE_LIMIT_MAX, 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Counting failures only would let an attacker reset the window with one
  // correct guess, so every attempt counts.
  handler: arabicLimitResponse(
    "تم تجاوز عدد محاولات تسجيل الدخول المسموح بها. يرجى المحاولة بعد قليل."
  ),
});

/** Bidding — cheap to automate and directly manipulable. */
const bidLimiter = rateLimit({
  windowMs: number(process.env.BID_RATE_LIMIT_WINDOW_MS, 60 * 1000),
  limit: number(process.env.BID_RATE_LIMIT_MAX, 30),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: arabicLimitResponse(
    "تم تجاوز عدد المزايدات المسموح بها خلال هذه الفترة. يرجى المحاولة بعد قليل."
  ),
});

module.exports = { globalLimiter, authLimiter, bidLimiter };
