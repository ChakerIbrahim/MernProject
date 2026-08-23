const express = require("express");
const { listMessages, postMessage } = require("../controllers/negotiation.controller");
const { requestContractDraft } = require("../controllers/ai.controller");
const { isAuth } = require("../config/jwt.config");

const router = express.Router();

// FR-15.1 — participation is decided per proposal inside the controller, since
// it depends on two documents (the proposal and its tender). isAuth only
// establishes who is asking.
router.get("/proposals/:id/messages", isAuth, listMessages);
router.post("/proposals/:id/messages", isAuth, postMessage);

// FR-15.2 — tender owner only. Reuses the single Gemini module (C-7).
router.post("/proposals/:id/contract-draft", isAuth, requestContractDraft);

module.exports = router;
