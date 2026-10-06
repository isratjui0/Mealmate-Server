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
      name: 'Nutritionist Nina',
      email: 'nina@example.com',
      password: 'password123',
      timezone: 'UTC'
    }
  });

  authToken = regRes.body.data.token;
  userId = regRes.body.data.user.id;
});

test('Food List & Spreadsheet Food Tracking Engine', async (t) => {
  let food1Id = '';
  let food2Id = '';

  await t.test('POST /api/foods creates food items with column ordering', async () => {
    const f1 = await apiRequest('/foods', {
      method: 'POST',
      token: authToken,
      body: { name: 'Quinoa', category: 'Grains', columnOrder: 0 }
    });
    assert.equal(f1.status, 201);
    food1Id = f1.body.data.food.id;

    const f2 = await apiRequest('/foods', {
      method: 'POST',
      token: authToken,
      body: { name: 'Salmon', category: 'Protein', columnOrder: 1 }
    });
    assert.equal(f2.status, 201);
    food2Id = f2.body.data.food.id;
  });

  await t.test('GET /api/food-tracking returns spreadsheet matrix for specified month', async () => {
    const res = await apiRequest('/food-tracking?month=2026-10', {
      method: 'GET',
      token: authToken
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.month, '2026-10');
    assert.equal(res.body.data.foods.length, 2);
    assert.equal(res.body.data.days.length, 31); // October has 31 days

    // Initial state: unrecorded cells are null
    const day1 = res.body.data.days[0];
    assert.equal(day1.entries[food1Id], null);
    assert.equal(day1.entries[food2Id], null);
  });

  await t.test('PUT /api/food-tracking/:date/:foodId updates cell to consumed and not_consumed', async () => {
    // 1. Mark Quinoa as consumed on 2026-10-04
    const putRes1 = await apiRequest(`/food-tracking/2026-10-04/${food1Id}`, {
      method: 'PUT',
      token: authToken,
      body: { status: 'consumed', notes: 'Had with dinner' }
    });

    assert.equal(putRes1.status, 200);
    assert.equal(putRes1.body.data.status, 'consumed');

    // 2. Mark Salmon as not_consumed on 2026-10-04
    const putRes2 = await apiRequest(`/food-tracking/2026-10-04/${food2Id}`, {
      method: 'PUT',
      token: authToken,
      body: { status: 'not_consumed', notes: 'Did not cook' }
    });

    assert.equal(putRes2.status, 200);
    assert.equal(putRes2.body.data.status, 'not_consumed');

    // Verify in monthly sheet
    const sheetRes = await apiRequest('/food-tracking?month=2026-10', {
      method: 'GET',
      token: authToken
    });

    const day4 = sheetRes.body.data.days.find((d) => d.date === '2026-10-04');
    assert.equal(day4.entries[food1Id], 'consumed');
    assert.equal(day4.entries[food2Id], 'not_consumed');
  });

  await t.test('DELETE /api/food-tracking/:date/:foodId safely clears cell back to unrecorded', async () => {
    const delRes = await apiRequest(`/food-tracking/2026-10-04/${food1Id}`, {
      method: 'DELETE',
      token: authToken
    });

    assert.equal(delRes.status, 200);

    const sheetRes = await apiRequest('/food-tracking?month=2026-10', {
      method: 'GET',
      token: authToken
    });

    const day4 = sheetRes.body.data.days.find((d) => d.date === '2026-10-04');
    assert.equal(day4.entries[food1Id], null, 'Cleared cell must be null');
  });

  await t.test('DELETE /api/foods/:id soft-archives food if tracking records exist to preserve history', async () => {
    // food2Id has a tracking record from previous test
    const delFoodRes = await apiRequest(`/foods/${food2Id}`, {
      method: 'DELETE',
      token: authToken
    });

    assert.equal(delFoodRes.status, 200);
    assert.equal(delFoodRes.body.data.archived, true);

    // Food list without archived does not include it
    const activeList = await apiRequest('/foods', { method: 'GET', token: authToken });
    assert.ok(!activeList.body.data.foods.some((f) => f.id === food2Id));

    // Food list with archived includes it
    const allList = await apiRequest('/foods?includeArchived=true', { method: 'GET', token: authToken });
    assert.ok(allList.body.data.foods.some((f) => f.id === food2Id));
  });

  await t.test('Cross-user isolation: User B cannot modify User A tracking cells', async () => {
    // Register User B
    const userBRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: { name: 'Hacker Bob', email: 'bob_the_hacker@example.com', password: 'password123' }
    });
    const tokenB = userBRes.body.data.token;

    // Attempt to modify User A's food
    const unauthorizedRes = await apiRequest(`/food-tracking/2026-10-04/${food1Id}`, {
      method: 'PUT',
      token: tokenB,
      body: { status: 'consumed' }
    });

    assert.equal(unauthorizedRes.status, 404);
    assert.equal(unauthorizedRes.body.success, false);
  });
});
