const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldEndAuction } = require('../functions/auction-state');

const NOW = new Date('2026-08-24T12:00:00.000Z');

test('ends an active auction at its exact end time', () => {
  assert.equal(
    shouldEndAuction({ status: 'active', endsAt: '2026-08-24T12:00:00.000Z' }, NOW),
    true,
  );
});

test('ends an active auction after its end time', () => {
  assert.equal(
    shouldEndAuction({ status: 'active', endsAt: '2026-08-24T11:59:59.000Z' }, NOW),
    true,
  );
});

test('does not end an active auction before its end time', () => {
  assert.equal(
    shouldEndAuction({ status: 'active', endsAt: '2026-08-24T12:00:01.000Z' }, NOW),
    false,
  );
});

test('does not transition an already ended auction', () => {
  assert.equal(
    shouldEndAuction({ status: 'ended', endsAt: '2026-08-24T11:00:00.000Z' }, NOW),
    false,
  );
});

test('returns false when an auction is missing', () => {
  assert.equal(shouldEndAuction(null, NOW), false);
});
