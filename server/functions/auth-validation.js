const validateRegistrationInput = ({ role, name, email, password, phoneNumber, hasFile }) => {
    const errors = {};
    const nameRegex = /^[\p{L}\s]{3,}$/u;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[0-9\s-]{7,15}$/;

    if (!name || !nameRegex.test(String(name).trim())) {
        errors.name = 'يجب أن يتكون الاسم من 3 أحرف على الأقل ولا يحتوي على أرقام أو رموز';
    }
    if (!email || !emailRegex.test(String(email).trim())) {
        errors.email = 'أدخل بريداً إلكترونياً صالحاً';
    }
    if (!password || password.length < 8) {
        errors.password = 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل';
    }
    if (!phoneNumber || !phoneRegex.test(String(phoneNumber).trim())) {
        errors.phoneNumber = 'رقم الهاتف غير صالح أو مفقود';
    }
    if (role === 'individual' && !hasFile) {
        errors.file = 'مستند الهوية الوطنية مطلوب';
    }

    return errors;
};

module.exports = { validateRegistrationInput };
