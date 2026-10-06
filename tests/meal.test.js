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
      name: 'Chef Gordon',
      email: 'gordon@example.com',
      password: 'password123',
      timezone: 'UTC'
    }
  });

  authToken = regRes.body.data.token;
  userId = regRes.body.data.user.id;
});

test('Meal Schedule & Occurrence Management', async (t) => {
  let createdMealId = '';

  await t.test('POST /api/meals creates recurring schedule and generates occurrences', async () => {
    const res = await apiRequest('/meals', {
      method: 'POST',
      token: authToken,
      body: {
        name: 'Breakfast Bowl',
        category: 'breakfast',
        time: '08:00',
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        reminderEnabled: true
      }
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.meal.name, 'Breakfast Bowl');
    createdMealId = res.body.data.meal.id;
  });

  await t.test('GET /api/meals returns user meal schedules', async () => {
    const res = await apiRequest('/meals', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.meals.length, 1);
    assert.equal(res.body.data.meals[0].name, 'Breakfast Bowl');
  });

  await t.test('PATCH /api/meals/:id/pause toggles active state', async () => {
    const pauseRes = await apiRequest(`/meals/${createdMealId}/pause`, {
      method: 'PATCH',
      token: authToken
    });

    assert.equal(pauseRes.status, 200);
    assert.equal(pauseRes.body.data.meal.active, false);

    const resumeRes = await apiRequest(`/meals/${createdMealId}/pause`, {
      method: 'PATCH',
      token: authToken
    });

    assert.equal(resumeRes.status, 200);
    assert.equal(resumeRes.body.data.meal.active, true);
  });

  await t.test('GET /api/meal-occurrences returns generated occurrences', async () => {
    const res = await apiRequest('/meal-occurrences', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.occurrences.length > 0);
  });

  await t.test('PATCH /api/meal-occurrences/:id/complete marks occurrence as completed', async () => {
    const occsRes = await apiRequest('/meal-occurrences', {
      method: 'GET',
      token: authToken
    });

    const targetOcc = occsRes.body.data.occurrences[0];

    const completeRes = await apiRequest(`/meal-occurrences/${targetOcc.id}/complete`, {
      method: 'PATCH',
      token: authToken,
      body: { notes: 'Ate oatmeal with berries' }
    });

    assert.equal(completeRes.status, 200);
    assert.equal(completeRes.body.data.occurrence.status, 'completed');
    assert.ok(completeRes.body.data.occurrence.completedAt);
    assert.equal(completeRes.body.data.occurrence.notes, 'Ate oatmeal with berries');

    // Reject transition from completed to skipped
    const invalidRes = await apiRequest(`/meal-occurrences/${targetOcc.id}/skip`, {
      method: 'PATCH',
      token: authToken
    });

    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.body.success, false);
  });

  await t.test('PATCH /api/meal-occurrences/:id/postpone and snooze updates postponedUntil', async () => {
    const occsRes = await apiRequest('/meal-occurrences', {
      method: 'GET',
      token: authToken
    });

    // Find pending occurrence
    const targetOcc = occsRes.body.data.occurrences.find((o) => o.status === 'pending');
    if (!targetOcc) return;

    const postponeRes = await apiRequest(`/meal-occurrences/${targetOcc.id}/postpone`, {
      method: 'PATCH',
      token: authToken,
      body: { minutes: 45 }
    });

    assert.equal(postponeRes.status, 200);
    assert.equal(postponeRes.body.data.occurrence.status, 'postponed');
    assert.ok(postponeRes.body.data.occurrence.postponedUntil);

    const snoozeRes = await apiRequest(`/meal-occurrences/${targetOcc.id}/snooze`, {
      method: 'PATCH',
      token: authToken,
      body: { durationMinutes: 10 }
    });

    assert.equal(snoozeRes.status, 200);
    assert.equal(snoozeRes.body.data.occurrence.status, 'postponed');
    assert.equal(snoozeRes.body.data.occurrence.snoozeCount, 1);
  });
});
