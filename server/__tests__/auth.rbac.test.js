import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('Auth-required: /api/analytics/dashboard accessible in test via fallback auth', async () => {
  const OLD = process.env.SKIP_DB;
  process.env.SKIP_DB = 'true';
  const res = await request(app).get('/api/analytics/dashboard');
  process.env.SKIP_DB = OLD;
  assert.equal(res.status, 200);
});

test('RBAC: assignments stats 403 for therapist role; 200 for supervisor', async () => {
  const OLD = process.env.SKIP_DB;
  process.env.SKIP_DB = 'true';
  const resForbidden = await request(app).get('/api/assignments/stats').set('x-test-role', 'therapist');
  const resOk = await request(app).get('/api/assignments/stats').set('x-test-role', 'supervisor');
  process.env.SKIP_DB = OLD;
  assert.equal(resForbidden.status, 403);
  assert.equal(resOk.status, 200);
});
