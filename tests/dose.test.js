import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { startTestServer, stopTestServer, apiRequest, clearCollections } from './testHelper.js';

let authToken = '';
let userId = '';

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
      name: 'Dr. Watson',
      email: 'watson@example.com',
      password: 'password123',
      timezone: 'UTC'
    }
  });

  authToken = regRes.body.data.token;
  userId = regRes.body.data.user.id;
});

test('Dose Schedule & Occurrence Management', async (t) => {
  let doseId = '';

  await t.test('POST /api/doses creates schedule with multiple times and generates occurrences', async () => {
    const res = await apiRequest('/doses', {
      method: 'POST',
      token: authToken,
      body: {
        itemName: 'Vitamin C Complex',
        dosageDescription: '500mg effervescent tablet',
        times: ['08:00', '20:00'],
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        reminderEnabled: true
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.dose.itemName, 'Vitamin C Complex');
    assert.equal(res.body.data.dose.times.length, 2);
    doseId = res.body.data.dose.id;
  });

  await t.test('GET /api/dose-occurrences returns generated occurrences for each scheduled time slot', async () => {
    const res = await apiRequest('/dose-occurrences', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.occurrences.length > 0);
  });

  await t.test('PATCH /api/dose-occurrences/:id/taken records taken outcome with timestamp', async () => {
    const occsRes = await apiRequest('/dose-occurrences', {
      method: 'GET',
      token: authToken
    });

    const targetOcc = occsRes.body.data.occurrences[0];

    const takenRes = await apiRequest(`/dose-occurrences/${targetOcc.id}/taken`, {
      method: 'PATCH',
      token: authToken,
      body: { notes: 'Taken with water after breakfast' }
    });

    assert.equal(takenRes.status, 200);
    assert.equal(takenRes.body.data.occurrence.status, 'taken');
    assert.ok(takenRes.body.data.occurrence.recordedAt);
    assert.equal(takenRes.body.data.occurrence.notes, 'Taken with water after breakfast');

    // Reject transition from taken to skipped
    const invalidRes = await apiRequest(`/dose-occurrences/${targetOcc.id}/skip`, {
      method: 'PATCH',
      token: authToken
    });
    assert.equal(invalidRes.status, 400);
  });

  await t.test('GET /api/dose-occurrences/history retrieves recorded outcomes', async () => {
    const res = await apiRequest('/dose-occurrences/history', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.history.length > 0);
    assert.equal(res.body.data.history[0].status, 'taken');
  });
});
