/**
 * Liveness probe. The first thing to check in every later sprint before
 * debugging anything else (sprint-00 §Backend task 5).
 */
const getHealth = (req, res) => {
  res.json({ message: "backend is healthy" });
};

/**
 * Development-only route that throws, so the global error middleware in
 * server.js can be verified end to end (sprint-00 acceptance criteria).
 */
const throwTestError = (req, res, next) => {
  next(new Error("intentional test error from /api/dev/error"));
};

module.exports = { getHealth, throwTestError };
