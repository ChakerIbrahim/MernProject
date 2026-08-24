const User = require('../models/user.model');
const TemporaryUser = require('../models/temporaryUser.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/email.service');

/**
 * Handles initial registration for both organizations and individuals.
 * Validates inputs, processes file uploads, creates a TemporaryUser, and sends an email verification code.
 * Returns a success message on completion.
 */
module.exports.register = async (req, res, next) => {
    try {
        const { role, email } = req.body;

        if (role !== 'organization' && role !== 'individual') {
            return res.status(400).json({ errors: { role: "الدور غير صالح للتسجيل العام" } });
        }

        const { name, password, phoneNumber } = req.body;
        const validationErrors = {};
        const nameRegex = /^[\p{L}\s]{3,}$/u;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[0-9\s-]{7,15}$/;

        if (!name || !nameRegex.test(String(name).trim())) {
            validationErrors.name = "يجب أن يتكون الاسم من 3 أحرف على الأقل ولا يحتوي على أرقام أو رموز";
        }
        if (!email || !emailRegex.test(String(email).trim())) {
            validationErrors.email = "أدخل بريداً إلكترونياً صالحاً";
        }
        if (!password || password.length < 8) {
            validationErrors.password = "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل";
        }
        if (!phoneNumber || !phoneRegex.test(String(phoneNumber).trim())) {
            validationErrors.phoneNumber = "رقم الهاتف غير صالح أو مفقود";
        }
        if (role === 'individual' && !req.file) {
            validationErrors.file = "مستند الهوية الوطنية مطلوب";
        }
        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({ errors: validationErrors });
        }

        // Note: confirmPassword validation is intentionally client-side only.
        // The client excludes it from FormData to prevent it from reaching the database.

        let proofDocumentUrl = req.body.proofDocumentUrl;
        if ((role === 'organization' || role === 'individual') && req.file) {
            try {
                // Dynamically import file-type since it's ESM
                const { fileTypeFromFile } = await import('file-type');
                const type = await fileTypeFromFile(req.file.path);

                const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                if (!type || !allowedMimeTypes.includes(type.mime)) {
                    // Delete the invalid file
                    const fs = require('fs');
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({ errors: { file: 'الملف غير مدعوم، يرجى رفع صورة أو ملف PDF' } });
                }
            } catch (e) {
                console.error("File type check failed", e);
            }
            proofDocumentUrl = `/uploads/${req.file.filename}`;
        }


        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ errors: { email: "البريد الإلكتروني مسجل مسبقاً" } });
        }

        // Check if there is already a temporary registration for this email and delete it
        await TemporaryUser.deleteMany({ email: email.toLowerCase() });

        let verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        let verificationCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Extract only fields we want to save
        const { aiVerification, confirmPassword: _confirmPassword, ...userData } = req.body;
        // The server deliberately ignores confirmPassword; it is only a client-side confirmation field.
        userData.role = role;
        let parsedAiVerification = undefined;
        if (aiVerification) {
            try {
                parsedAiVerification = typeof aiVerification === 'string' ? JSON.parse(aiVerification) : aiVerification;
            } catch (e) {
                // Ignore parse error
            }
        }

        const tempUser = await TemporaryUser.create({
            ...userData,
            proofDocumentUrl,
            verificationCode,
            verificationCodeExpiresAt,
            aiVerification: parsedAiVerification
        });

        const emailSent = await sendEmail({
            templateType: 'VERIFICATION',
            to_email: tempUser.email,
            to_name: tempUser.companyName || tempUser.name,
            subject: 'رمز التحقق من البريد الإلكتروني - اعتماد',
            code: verificationCode
        });

        if (!emailSent) {
            await TemporaryUser.deleteOne({ _id: tempUser._id });
            return res.status(502).json({ error: 'تعذّر إرسال رمز التحقق. تحقّق من إعدادات البريد وحاول مرة أخرى.' });
        }

        res.status(200).json({ message: "تم إرسال رمز التحقق بنجاح" });
    } catch (err) {
        next(err);
    }
};

/**
 * Verifies the email code for a TemporaryUser and promotes them to a full User.
 * Bypasses the User pre-save hook to migrate the already-hashed password.
 * Returns the final user object and a JWT token.
 */
module.exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني ورمز التحقق" });
        }

        const tempUser = await TemporaryUser.findOne({ email: email.toLowerCase() });

        if (!tempUser) {
            return res.status(404).json({ error: "رمز التحقق غير صالح أو منتهي الصلاحية. يرجى التسجيل مرة أخرى." });
        }

        if (tempUser.verificationCode !== code) {
            return res.status(400).json({ error: "رمز التحقق غير صحيح" });
        }

        if (new Date() > tempUser.verificationCodeExpiresAt) {
            return res.status(400).json({ error: "رمز التحقق منتهي الصلاحية" });
        }

        // Verification successful, create the actual user
        const status = tempUser.role === 'organization' ? 'pending' : 'approved';

        const newUser = new User({
            name: tempUser.name,
            email: tempUser.email,
            role: tempUser.role,
            companyName: tempUser.companyName,
            phoneNumber: tempUser.phoneNumber,
            proofDocumentUrl: tempUser.proofDocumentUrl,
            nationalId: tempUser.nationalId,
            aiVerification: tempUser.aiVerification,
            status: status
        });

        // Bypass the pre-save hook double-hashing by manually marking the password path as unmodified.
        newUser.password = tempUser.password;
        newUser.unmarkModified('password');
        await newUser.save();

        // Clean up temp user
        await TemporaryUser.deleteOne({ _id: tempUser._id });

        // Return a fresh token so the client can immediately log in
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.SECRET);

        // Fetch user again to get clean object without password
        const finalUser = await User.findById(newUser._id);
        const userObj = finalUser.toObject();
        delete userObj.password;

        res.status(200).json({
            message: finalUser.role === 'organization'
                ? "تم التحقق من البريد الإلكتروني بنجاح، الحساب الآن قيد مراجعة المشرف"
                : "تم تفعيل الحساب بنجاح",
            user: userObj,
            token
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Generates a new verification code for an existing TemporaryUser and sends it via email.
 * Returns a success message on completion.
 */
module.exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
        }

        const tempUser = await TemporaryUser.findOne({ email: email.toLowerCase() });
        if (!tempUser) {
            return res.status(400).json({ error: 'لا يوجد حساب بانتظار التحقق بهذا البريد الإلكتروني' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        tempUser.verificationCode = verificationCode;
        tempUser.verificationCodeExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await tempUser.save();

        const emailSent = await sendEmail({
            templateType: 'VERIFICATION',
            to_email: tempUser.email,
            to_name: tempUser.companyName || tempUser.name,
            subject: 'رمز التحقق من البريد الإلكتروني - اعتماد',
            code: verificationCode
        });

        if (!emailSent) {
            return res.status(502).json({ error: 'تعذّر إرسال رمز التحقق. حاول مرة أخرى لاحقاً.' });
        }

        res.status(200).json({ message: 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني' });
    } catch (err) {
        next(err);
    }
};

/**
 * Authenticates a user using email and password.
 * Checks for unverified TemporaryUser status and returns a specific flag if true.
 * Returns the user object and a JWT token on success.
 */
module.exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body || {};
        const invalidMsg = "البريد الإلكتروني أو كلمة المرور غير صحيحة";

        if (!email || !password) {
            return res.status(400).json({ error: "الرجاء إدخال البريد الإلكتروني وكلمة المرور" });
        }

        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            // Check if it's a temporary user waiting for verification
            const tempUser = await TemporaryUser.findOne({ email: email.toLowerCase() });
            if (tempUser) {
                return res.status(403).json({ error: "يرجى التحقق من بريدك الإلكتروني أولاً", needsVerification: true, email: tempUser.email });
            }
            return res.status(400).json({ error: invalidMsg });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: invalidMsg });
        }



        const token = jwt.sign({ id: user._id, role: user.role }, process.env.SECRET);

        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({ user: userObj, token });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves the currently authenticated user's profile data.
 * Returns the user object or 404 if not found.
 */
module.exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: "المستخدم غير موجود" });
        }
        res.status(200).json({ user });
    } catch (err) {
        next(err);
    }
};
