import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('POST /api/plans -> 422 on missing required fields (patient)', async () => {
  const res = await request(app)
    .post('/api/plans')
    .send({ goals: [] })
    .set('Content-Type', 'application/json');
  assert.equal(res.status, 422);
});

test('POST /api/sessions -> 422 on invalid date', async () => {
  const res = await request(app)
    .post('/api/sessions')
    .send({ patient: 'abc', date: 'invalid-date' })
    .set('Content-Type', 'application/json');
  assert.equal(res.status, 422);
});

test('POST /api/progress-reports -> 422 on missing patient', async () => {
  const res = await request(app)
    .post('/api/progress-reports')
    .send({})
    .set('Content-Type', 'application/json');
  assert.equal(res.status, 422);
});
