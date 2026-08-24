const test = require('node:test');
const assert = require('node:assert/strict');
const { missingKeys, reportEnvironment } = require('../config/env.config');

test('finds missing required environment keys', () => {
  assert.deepEqual(
    missingKeys({ MONGOOSE_URI: '', SECRET: 'present' }),
    ['MONGOOSE_URI'],
  );
});

test('reports missing required and optional integration configuration', () => {
  const messages = [];
  const result = reportEnvironment({
    env: { MONGOOSE_URI: '', SECRET: '', GEMINI_API_KEY: '' },
    logger: (message) => messages.push(message),
  });

  assert.deepEqual(result.required, ['MONGOOSE_URI', 'SECRET']);
  assert.equal(result.integrations.includes('GEMINI_API_KEY'), true);
  assert.equal(messages.length, 2);
  assert.equal(messages.some((message) => message.includes('MONGOOSE_URI')), true);
  assert.equal(messages.some((message) => message.includes('GEMINI_API_KEY')), true);
});

test('does not warn when all configured keys are present', () => {
  const messages = [];
  const result = reportEnvironment({
    env: {
      MONGOOSE_URI: 'mongodb://example',
      SECRET: 'secret',
      GEMINI_API_KEY: 'key',
      EMAILJS_SERVICE_ID: 'service',
      EMAILJS_PUBLIC_KEY: 'public',
      EMAILJS_PRIVATE_KEY: 'private',
    },
    logger: (message) => messages.push(message),
  });

  assert.deepEqual(result, { required: [], integrations: [] });
  assert.deepEqual(messages, []);
});
