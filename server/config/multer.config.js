const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAllowedMimeType } = require('./upload-types');

/**
 * multer.config.js
 * Configures file upload handling via Multer.
 * Exports the upload middleware instance.
 */
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (isAllowedMimeType(file.mimetype)) {
        cb(null, true);
    } else {
        const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
        err.message = 'الملف غير مدعوم، يرجى رفع صورة أو ملف PDF';
        cb(err);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter
});

module.exports = upload;
