const express = require("express");
const { getMe } = require("../controllers/user.controller");
const { isAuth } = require("../config/jwt.config");

const router = express.Router();

// Middleware order is always isAuth -> isRole([...]) -> controller (FR-5.2, FR-5.3).
router.get("/users/me", isAuth, getMe);

module.exports = router;
