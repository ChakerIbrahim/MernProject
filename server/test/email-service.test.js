const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEmailPayload, hasEmailCredentials, sendEmail } = require('../services/email.service');

const env = {
  EMAILJS_SERVICE_ID: 'service-test',
  EMAILJS_PUBLIC_KEY: 'public-test',
  EMAILJS_PRIVATE_KEY: 'private-test',
  EMAILJS_GENERAL_TEMPLATE: 'template-general-test',
  EMAILJS_VERIFICATION_TEMPLATE: 'template-verification-test',
};

test('builds a General notification payload with matching template variables', () => {
  const payload = buildEmailPayload({
    templateType: 'GENERAL',
    to_email: 'org@example.com',
    to_name: 'شركة اعتماد',
    subject: 'تم اعتماد الحساب',
    details: 'يمكنكم الآن تسجيل الدخول.',
  }, env);

  assert.equal(payload.template_id, 'template-general-test');
  assert.equal(payload.template_params.to_email, 'org@example.com');
  assert.equal(payload.template_params.email_subject, 'تم اعتماد الحساب');
  assert.equal(payload.template_params.email_title, 'تم اعتماد الحساب');
  assert.equal(payload.template_params.intro_text, 'يمكنكم الآن تسجيل الدخول.');
  assert.equal(payload.template_params.details, 'يمكنكم الآن تسجيل الدخول.');
});

test('builds verification defaults and selects the verification template', () => {
  const payload = buildEmailPayload({
    templateType: 'VERIFICATION',
    to_email: 'user@example.com',
    to_name: 'رامز',
    code: '123456',
  }, env);

  assert.equal(payload.template_id, 'template-verification-test');
  assert.equal(payload.template_params.reset_code, '123456');
  assert.equal(payload.template_params.code_label, 'رمز التحقق');
  assert.equal(payload.template_params.expiry_text, 'رمز التحقق صالح لمدة ساعة واحدة.');
});

test('detects incomplete EmailJS credentials', () => {
  assert.equal(hasEmailCredentials({ service_id: 'service', user_id: 'public', accessToken: '' }), false);
  assert.equal(hasEmailCredentials({ service_id: 'service', user_id: 'public', accessToken: 'private' }), true);
});

test('returns true after a successful provider response', async () => {
  let captured;
  const result = await sendEmail({
    templateType: 'GENERAL',
    to_email: 'org@example.com',
    to_name: 'شركة اعتماد',
    subject: 'اختبار',
    details: 'رسالة اختبار',
  }, {
    env,
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return { ok: true, text: async () => 'OK' };
    },
  });

  assert.equal(result, true);
  assert.equal(captured.url, 'https://api.emailjs.com/api/v1.0/email/send');
  assert.equal(JSON.parse(captured.options.body).template_id, 'template-general-test');
});

test('returns false after a provider failure', async () => {
  const result = await sendEmail({
    templateType: 'GENERAL',
    to_email: 'org@example.com',
    to_name: 'شركة اعتماد',
  }, {
    env,
    fetchImpl: async () => ({ ok: false, status: 400, text: async () => 'bad template' }),
  });

  assert.equal(result, false);
});
