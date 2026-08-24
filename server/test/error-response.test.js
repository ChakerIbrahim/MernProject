const test = require('node:test');
const assert = require('node:assert/strict');
const { formatErrorResponse } = require('../config/error-response');

test('formats malformed JSON as a 400 field error', () => {
  assert.deepEqual(
    formatErrorResponse({ type: 'entity.parse.failed' }),
    { status: 400, body: { errors: { body: 'صيغة البيانات المرسلة غير صحيحة' } }, shouldLog: false },
  );
});

test('formats invalid ObjectIds as a 404 response', () => {
  assert.deepEqual(
    formatErrorResponse({ name: 'CastError', kind: 'ObjectId' }),
    { status: 404, body: { error: 'العنصر غير موجود' }, shouldLog: false },
  );
});

test('converts Mongoose validation errors into named field messages', () => {
  assert.deepEqual(
    formatErrorResponse({
      name: 'ValidationError',
      errors: {
        email: { message: 'البريد الإلكتروني غير صالح' },
        password: { message: 'كلمة المرور قصيرة' },
      },
    }),
    {
      status: 400,
      body: { errors: { email: 'البريد الإلكتروني غير صالح', password: 'كلمة المرور قصيرة' } },
      shouldLog: false,
    },
  );
});

test('maps Multer size failures to the Arabic upload message', () => {
  assert.deepEqual(
    formatErrorResponse({ name: 'MulterError', code: 'LIMIT_FILE_SIZE' }),
    { status: 400, body: { errors: { file: 'حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)' } }, shouldLog: false },
  );
});

test('keeps unexpected failures generic and marks them for logging', () => {
  assert.deepEqual(
    formatErrorResponse(new Error('database details must not reach the client')),
    { status: 500, body: { error: 'حدث خطأ غير متوقع في الخادم' }, shouldLog: true },
  );
});
