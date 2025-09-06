import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('POST /api/patients -> 422 on invalid body', async () => {
  const res = await request(app)
    .post('/api/patients')
    .send({ name: 'A', contact: {}, dob: 'not-a-date' })
    .set('Content-Type', 'application/json');
  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Validation Error');
});

test('GET /api/patients -> 200 stub list with SKIP_DB=true', async () => {
  const OLD = process.env.SKIP_DB;
  process.env.SKIP_DB = 'true';
  const res = await request(app).get('/api/patients');
  process.env.SKIP_DB = OLD;
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});

test('POST /api/users -> 422 on invalid email', async () => {
  const res = await request(app)
    .post('/api/users')
    .send({ email: 'bad', name: 'Test', role: 'therapist' })
    .set('Content-Type', 'application/json');
  assert.equal(res.status, 422);
  assert.equal(res.body.success, false);
});

test('PATCH /api/users/:id -> 422 on invalid email format (short-circuits before DB)', async () => {
  const res = await request(app)
    .patch('/api/users/64b8aa4f3f4d2f0012345678')
    .send({ email: 'not-an-email' })
    .set('Content-Type', 'application/json');
  assert.equal(res.status, 422);
});
