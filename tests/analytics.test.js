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
      name: 'Data Scientist Dana',
      email: 'dana@example.com',
      password: 'password123',
      timezone: 'UTC'
    }
  });

  authToken = regRes.body.data.token;

  // Create a meal and complete it
  await apiRequest('/meals', {
    method: 'POST',
    token: authToken,
    body: {
      name: 'Breakfast',
      time: '08:00',
      weekdays: [0, 1, 2, 3, 4, 5, 6]
    }
  });

  // Create a dose
  await apiRequest('/doses', {
    method: 'POST',
    token: authToken,
    body: {
      itemName: 'Zinc 50mg',
      dosageDescription: '1 tablet',
      times: ['09:00'],
      startDate: '2026-10-01'
    }
  });
});

test('Analytics Engine', async (t) => {
  await t.test('GET /api/analytics/dashboard returns accurate metrics', async () => {
    const res = await apiRequest('/analytics/dashboard', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.date);
    assert.ok(res.body.data.meals);
    assert.ok(res.body.data.doses);
    assert.ok(res.body.data.foodTracking);

    // Completion rate default when no failures occurred is 100%
    assert.equal(res.body.data.meals.completionRate, 100);
  });

  await t.test('GET /api/analytics/calendar returns monthly day-by-day metrics', async () => {
    const res = await apiRequest('/analytics/calendar?month=2026-10', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.month, '2026-10');
    assert.equal(res.body.data.days.length, 31);
    assert.ok(res.body.data.days[0].mealStats);
    assert.ok(res.body.data.days[0].doseStats);
    assert.ok(res.body.data.days[0].foodStats);
  });
});
