const ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
    'image/jpeg',
    'image/jpg',
    'image/png'
]);

const ALLOWED_MIME_TYPES = Object.freeze([
    ...ALLOWED_IMAGE_MIME_TYPES,
    'application/pdf'
]);

const isAllowedMimeType = (mimeType) => ALLOWED_MIME_TYPES.includes(mimeType);
const isAllowedImageMimeType = (mimeType) => ALLOWED_IMAGE_MIME_TYPES.includes(mimeType);

module.exports = {
    ALLOWED_IMAGE_MIME_TYPES,
    ALLOWED_MIME_TYPES,
    isAllowedMimeType,
    isAllowedImageMimeType
};
