import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/database/index.js';
test('SQLite salva configurações e usuários', () => {
  const store = openDatabase(':memory:');
  assert.equal(store.group('grupo@g.us').antilink, 0);
  store.setGroup('grupo@g.us', 'antilink', true);
  assert.equal(store.group('grupo@g.us').antilink, 1);
  assert.equal(store.user('pessoa@s.whatsapp.net').coins, 0);
  assert.equal(store.warn('grupo@g.us','pessoa@s.whatsapp.net'), 1);
  assert.equal(store.warn('grupo@g.us','pessoa@s.whatsapp.net'), 2);
  store.close();
});
