import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { startTestServer, stopTestServer, apiRequest, clearCollections } from './testHelper.js';

before(async () => {
  await connectDB();
  await startTestServer();
});

after(async () => {
  await stopTestServer();
  await disconnectDB();
});

beforeEach(async () => {
  await clearCollections();
});

test('Auth Module - Registration & Login Workflow', async (t) => {
  await t.test('POST /api/auth/register creates a new user and returns JWT token', async () => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        password: 'password123',
        timezone: 'America/Chicago'
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'alice@example.com');
    assert.equal(res.body.data.user.name, 'Alice Cooper');
    assert.equal(res.body.data.user.passwordHash, undefined, 'passwordHash must never be exposed');
  });

  await t.test('POST /api/auth/register rejects duplicate email with 409', async () => {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        password: 'password123'
      }
    });

    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Alice Two',
        email: 'alice@example.com',
        password: 'password456'
      }
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/auth/login authenticates valid credentials', async () => {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Bob Marley',
        email: 'bob@example.com',
        password: 'reggae_password'
      }
    });

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'bob@example.com',
        password: 'reggae_password'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.email, 'bob@example.com');
  });

  await t.test('POST /api/auth/login rejects incorrect password with 401', async () => {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Bob Marley',
        email: 'bob@example.com',
        password: 'correct_password'
      }
    });

    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: {
        email: 'bob@example.com',
        password: 'wrong_password'
      }
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('GET /api/auth/me returns authenticated user details', async () => {
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'password123'
      }
    });

    const token = regRes.body.data.token;

    const res = await apiRequest('/auth/me', {
      method: 'GET',
      token
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'charlie@example.com');
  });

  await t.test('Protected endpoints reject unauthenticated requests with 401', async () => {
    const res = await apiRequest('/auth/me', {
      method: 'GET'
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});
