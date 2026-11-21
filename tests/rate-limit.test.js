import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../src/core/rate-limit.js';
test('limita comandos por usuário e libera após janela', () => {
  let time = 100;
  const limit = createRateLimiter({ windowMs: 1000, max: 2, now: () => time });
  assert.equal(limit.allow('u'), true);
  assert.equal(limit.allow('u'), true);
  assert.equal(limit.allow('u'), false);
  assert.equal(limit.allow('outro'), true);
  time += 1000;
  assert.equal(limit.allow('u'), true);
});
