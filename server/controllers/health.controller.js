const mongoose = require("mongoose");

/**
 * Liveness probe. The first thing to check in every later sprint before
 * debugging anything else (sprint-00 §Backend task 5).
 *
 * Reports actual MongoDB connection state rather than a hardcoded "healthy" —
 * a server that is up but has lost its database connection is not actually
 * healthy, and this endpoint should say so.
 */
const CONNECTION_STATES = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = CONNECTION_STATES[dbState] || "unknown";
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    message: isHealthy ? "backend is healthy" : "backend is degraded",
    database: dbStatus,
  });
};

/**
 * Development-only route that throws, so the global error middleware in
 * server.js can be verified end to end (sprint-00 acceptance criteria).
 */
const throwTestError = (req, res, next) => {
  next(new Error("intentional test error from /api/dev/error"));
};

module.exports = { getHealth, throwTestError };