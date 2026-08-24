const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ALLOWED_MIME_TYPES,
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedMimeType,
  isAllowedImageMimeType,
} = require('../config/upload-types');

test('accepts the supported image and PDF MIME types', () => {
  assert.deepEqual(ALLOWED_IMAGE_MIME_TYPES, ['image/jpeg', 'image/jpg', 'image/png']);
  assert.deepEqual(ALLOWED_MIME_TYPES, ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']);
  for (const mimeType of ALLOWED_MIME_TYPES) {
    assert.equal(isAllowedMimeType(mimeType), true);
  }
});

test('accepts only images in the image-specific policy', () => {
  assert.equal(isAllowedImageMimeType('image/jpeg'), true);
  assert.equal(isAllowedImageMimeType('image/png'), true);
  assert.equal(isAllowedImageMimeType('application/pdf'), false);
});

test('rejects unsupported, empty, or missing MIME values', () => {
  assert.equal(isAllowedMimeType('application/x-msdownload'), false);
  assert.equal(isAllowedMimeType('text/plain'), false);
  assert.equal(isAllowedMimeType(''), false);
  assert.equal(isAllowedMimeType(undefined), false);
});
