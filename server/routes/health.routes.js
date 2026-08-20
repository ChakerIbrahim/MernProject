const express = require("express");
const { getHealth, throwTestError } = require("../controllers/health.controller");

const router = express.Router();

router.get("/health", getHealth);

// Never mounted in production — it exists only to prove the global error
// middleware formats thrown errors correctly.
if (process.env.NODE_ENV !== "production") {
  router.get("/dev/error", throwTestError);
}

module.exports = router;
