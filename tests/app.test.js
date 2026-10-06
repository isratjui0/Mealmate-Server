import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

let server = null;
let baseUrl = '';

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}/api`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('HTTP Application Layer, Security & Routing', async (t) => {
  await t.test('GET /api/health returns 200 with operational status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data.uptime !== undefined);
    assert.ok(json.data.timestamp !== undefined);
  });

  await t.test('GET /api/docs serves Swagger UI HTML documentation', async () => {
    const res = await fetch(`${baseUrl}/docs/`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Swagger UI') || text.includes('swagger'));
  });

  await t.test('GET /api/docs.json serves raw OpenAPI 3.0 specification', async () => {
    const res = await fetch(`${baseUrl}/docs.json`);
    assert.equal(res.status, 200);

    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.0');
    assert.equal(spec.info.title, 'MealMate API Documentation');
    assert.ok(spec.paths['/auth/register']);
    assert.ok(spec.paths['/meals']);
    assert.ok(spec.paths['/food-tracking']);
    assert.ok(spec.paths['/doses']);
  });

  await t.test('Non-existent endpoints return 404 with standardized error response', async () => {
    const res = await fetch(`${baseUrl}/non-existent-endpoint`);
    assert.equal(res.status, 404);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.ok(json.message.includes('Route not found'));
  });

  await t.test('Helmet security headers are properly attached', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(res.headers.get('x-frame-options') || res.headers.get('content-security-policy'));
  });
});
