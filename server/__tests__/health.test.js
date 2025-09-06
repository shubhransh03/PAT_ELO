import request from 'supertest';
import app from '../src/app.js';
import test from 'node:test';
import assert from 'node:assert/strict';

test('GET /live returns ok', async () => {
  const res = await request(app).get('/live');
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
});
