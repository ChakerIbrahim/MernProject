const formatErrorResponse = (err = {}) => {
    if (err.type === 'entity.parse.failed' || err.status === 400) {
        return {
            status: 400,
            body: { errors: { body: 'صيغة البيانات المرسلة غير صحيحة' } },
            shouldLog: false
        };
    }

    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return {
            status: 404,
            body: { error: 'العنصر غير موجود' },
            shouldLog: false
        };
    }

    if (err.name === 'ValidationError') {
        const errors = {};
        for (const field of Object.keys(err.errors || {})) {
            errors[field] = err.errors[field].message;
        }
        return { status: 400, body: { errors }, shouldLog: false };
    }

    if (err.name === 'MulterError') {
        let message = err.message;
        if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large') {
            message = 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)';
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE' && err.field !== 'proofDocument') {
            message = 'الملف غير مدعوم، يرجى رفع صورة أو ملف PDF';
        }
        return { status: 400, body: { errors: { file: message } }, shouldLog: false };
    }

    return {
        status: 500,
        body: { error: 'حدث خطأ غير متوقع في الخادم' },
        shouldLog: true
    };
};

module.exports = { formatErrorResponse };
