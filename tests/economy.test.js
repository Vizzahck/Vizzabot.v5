import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/database/index.js';
test('resgate diário é atômico e tem cooldown', () => {
  const store = openDatabase(':memory:');
  const first = store.claimDaily('u@s.whatsapp.net', 1000000, 100, 86400000);
  assert.equal(first.ok, true);
  assert.equal(first.coins, 100);
  const second = store.claimDaily('u@s.whatsapp.net', 1000001, 100, 86400000);
  assert.equal(second.ok, false);
  assert.equal(store.user('u@s.whatsapp.net').coins, 100);
  assert.equal(store.claimDaily('u@s.whatsapp.net', 1000000 + 86400000, 100, 86400000).coins, 200);
  store.close();
});
test('ranking ordena por moedas', () => {
  const store = openDatabase(':memory:');
  store.claimDaily('a@s.whatsapp.net', 100, 100, 1);
  store.claimDaily('b@s.whatsapp.net', 100, 200, 1);
  assert.equal(store.topUsers(2)[0].jid, 'b@s.whatsapp.net');
  store.close();
});
