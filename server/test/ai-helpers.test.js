const test = require('node:test');
const assert = require('node:assert/strict');

process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'test-key';

const {
  parseGeminiJson,
  getAiFailureCode,
  normalizeConfidenceScore,
} = require('../controllers/ai.controller');

test('parses plain Gemini JSON', () => {
  assert.deepEqual(parseGeminiJson('{"score": 90}'), { score: 90 });
});

test('parses JSON wrapped in a markdown code fence', () => {
  assert.deepEqual(parseGeminiJson('```json\n{"score": 80}\n```'), { score: 80 });
});

test('extracts a JSON object surrounded by provider text', () => {
  assert.deepEqual(parseGeminiJson('Here is the result: {"score": 70}'), { score: 70 });
});

test('classifies invalid JSON explicitly', () => {
  assert.throws(() => parseGeminiJson('not json'), /AI_INVALID_JSON/);
});

test('classifies timeout, authentication, unavailable-model, and rate-limit errors', () => {
  assert.equal(getAiFailureCode(new Error('AI_TIMEOUT')), 'AI_TIMEOUT');
  assert.equal(getAiFailureCode({ status: 401 }), 'AI_AUTH_ERROR');
  assert.equal(getAiFailureCode({ status: 404 }), 'AI_MODEL_UNAVAILABLE');
  assert.equal(getAiFailureCode({ status: 429 }), 'AI_RATE_LIMIT');
});

test('normalizes confidence values to percentages between zero and one hundred', () => {
  assert.equal(normalizeConfidenceScore(0.82), 82);
  assert.equal(normalizeConfidenceScore(75), 75);
  assert.equal(normalizeConfidenceScore(200), 100);
  assert.equal(normalizeConfidenceScore(-10), 0);
  assert.equal(normalizeConfidenceScore('unknown'), 0);
});
