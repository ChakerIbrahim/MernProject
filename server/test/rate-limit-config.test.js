const test = require('node:test');
const assert = require('node:assert/strict');
const { number } = require('../config/rateLimit.config');

test('accepts positive numeric rate-limit values', () => {
  assert.equal(number('25', 10), 25);
  assert.equal(number(1.5, 10), 1.5);
});

test('uses the fallback for invalid rate-limit values', () => {
  assert.equal(number('', 10), 10);
  assert.equal(number('not-a-number', 10), 10);
  assert.equal(number(0, 10), 10);
  assert.equal(number(-1, 10), 10);
});
