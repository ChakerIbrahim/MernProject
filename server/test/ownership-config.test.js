const test = require('node:test');
const assert = require('node:assert/strict');
const { isOwnerOrAdmin } = require('../config/ownership.config');

const runMiddleware = async ({ document, user, options } = {}) => {
  const Model = { findById: async () => document };
  const req = { params: { id: 'resource-id' }, user };
  const responses = [];
  let nextError;
  await isOwnerOrAdmin(Model, options)(req, {
    status: (status) => ({ json: (body) => responses.push({ status, body }) }),
  }, (error) => {
    nextError = error;
  });
  return { req, responses, nextError };
};

test('allows the owner and attaches the loaded resource', async () => {
  const document = { createdBy: 'owner-1', title: 'Tender' };
  const result = await runMiddleware({ document, user: { _id: 'owner-1', role: 'organization' } });
  assert.equal(result.nextError, undefined);
  assert.deepEqual(result.req.resource, document);
});

test('allows an admin by default', async () => {
  const result = await runMiddleware({
    document: { createdBy: 'owner-1' },
    user: { _id: 'admin-1', role: 'admin' },
  });
  assert.equal(result.nextError, undefined);
});

test('rejects another user with status 403', async () => {
  const result = await runMiddleware({
    document: { createdBy: 'owner-1' },
    user: { _id: 'user-2', role: 'organization' },
  });
  assert.equal(result.nextError.status, 403);
});

test('can disable admin access for owner-only operations', async () => {
  const result = await runMiddleware({
    document: { createdBy: 'owner-1' },
    user: { _id: 'admin-1', role: 'admin' },
    options: { allowAdmin: false },
  });
  assert.equal(result.nextError.status, 403);
});

test('returns a 404 error when the resource is missing', async () => {
  const result = await runMiddleware({
    document: null,
    user: { _id: 'user-1', role: 'organization' },
  });
  assert.equal(result.nextError.status, 404);
  assert.equal(result.nextError.expose, true);
});
