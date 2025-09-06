import request from 'supertest';
import app from '../src/app.js';
import test from 'node:test';
import assert from 'node:assert/strict';

test('GET /api/analytics/dashboard returns stubbed data when SKIP_DB=true', async () => {
  const OLD = process.env.SKIP_DB;
  process.env.SKIP_DB = 'true';
  const res = await request(app).get('/api/analytics/dashboard');
  process.env.SKIP_DB = OLD;
  assert.equal(res.status, 200);
  assert.equal(res.body?.success, true);
  assert.ok(res.body?.data);
  assert.ok(Object.prototype.hasOwnProperty.call(res.body.data, 'activeCases'));
});
