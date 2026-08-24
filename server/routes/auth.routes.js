const AuthController = require('../controllers/auth.controller');
const upload = require('../config/multer.config');
const { isAuth } = require('../config/jwt.config');
const rateLimit = require('express-rate-limit');

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'تم تجاوز عدد محاولات التسجيل. حاول مرة أخرى لاحقاً.' }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'تم تجاوز عدد محاولات تسجيل الدخول. حاول مرة أخرى لاحقاً.' }
});

const verificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'تم تجاوز عدد محاولات التحقق. حاول مرة أخرى لاحقاً.' }
});

/**
 * Registers all authentication-related API routes.
 * Includes registration, login, and email verification with specific rate limiters.
 */
module.exports = (app) => {
    app.post('/api/auth/register', registerLimiter, upload.single('proofDocument'), AuthController.register);
    app.post('/api/auth/verify', verificationLimiter, AuthController.verifyEmail);
    app.post('/api/auth/resend-verification', verificationLimiter, AuthController.resendVerification);
    app.post('/api/auth/login', loginLimiter, AuthController.login);
    app.get('/api/users/me', isAuth, AuthController.getMe);
};
