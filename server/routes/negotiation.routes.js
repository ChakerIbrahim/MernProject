const express = require("express");
const { listMessages, postMessage } = require("../controllers/negotiation.controller");
const { requestContractDraft } = require("../controllers/ai.controller");
const { isAuth } = require("../config/jwt.config");
const { messageLimiter } = require("../config/rateLimit.config");

const router = express.Router();

router.get("/proposals/:id/messages", isAuth, listMessages);
router.post("/proposals/:id/messages", messageLimiter, isAuth, postMessage);

router.post("/proposals/:id/contract-draft", isAuth, requestContractDraft);

module.exports = router;