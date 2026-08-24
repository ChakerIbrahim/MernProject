const test = require('node:test');
const assert = require('node:assert/strict');
const { validateRegistrationInput } = require('../functions/auth-validation');

test('accepts valid organization registration details without a file', () => {
  assert.deepEqual(
    validateRegistrationInput({
      role: 'organization',
      name: 'شركة اعتماد',
      email: 'org@example.com',
      password: 'strong-password',
      phoneNumber: '+970 599 123456',
      hasFile: false,
    }),
    {},
  );
});

test('requires an identity file for individual registration', () => {
  const errors = validateRegistrationInput({
    role: 'individual',
    name: 'رامز عطالله',
    email: 'user@example.com',
    password: 'strong-password',
    phoneNumber: '0599123456',
    hasFile: false,
  });
  assert.equal(errors.file, 'مستند الهوية الوطنية مطلوب');
});

test('reports all invalid registration fields together', () => {
  const errors = validateRegistrationInput({
    role: 'organization',
    name: 'A1',
    email: 'not-an-email',
    password: 'short',
    phoneNumber: 'abc',
    hasFile: false,
  });
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'name', 'password', 'phoneNumber']);
});

test('allows an individual registration when the identity file is present', () => {
  const errors = validateRegistrationInput({
    role: 'individual',
    name: 'رامز عطالله',
    email: 'user@example.com',
    password: 'strong-password',
    phoneNumber: '0599123456',
    hasFile: true,
  });
  assert.deepEqual(errors, {});
});
