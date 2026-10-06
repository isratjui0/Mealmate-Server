import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { startTestServer, stopTestServer, apiRequest, clearCollections } from './testHelper.js';

let authToken = '';

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

  const regRes = await apiRequest('/auth/register', {
    method: 'POST',
    body: {
      name: 'Exporter Eric',
      email: 'eric@example.com',
      password: 'password123',
      timezone: 'UTC'
    }
  });

  authToken = regRes.body.data.token;
});

test('CSV Data Export Module', async (t) => {
  await t.test('GET /api/export/food-tracking returns formatted CSV data', async () => {
    const res = await apiRequest('/export/food-tracking', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('food_tracking_export.csv'));
    assert.ok(typeof res.body === 'string');
    assert.ok(res.body.includes('Tracking Date,Food Item,Category,Status,Notes'));
  });

  await t.test('GET /api/export/meal-history returns formatted CSV data', async () => {
    const res = await apiRequest('/export/meal-history', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('meal_history_export.csv'));
    assert.ok(res.body.includes('Scheduled Date,Scheduled Time,Meal Name,Category,Outcome Status'));
  });

  await t.test('GET /api/export/dose-history returns formatted CSV data', async () => {
    const res = await apiRequest('/export/dose-history', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/csv'));
    assert.ok(res.headers.get('content-disposition').includes('dose_history_export.csv'));
    assert.ok(res.body.includes('Scheduled Date,Scheduled Time,Medication / Item,Dosage Description,Outcome Status'));
  });
});
