import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readLocalConfig, normalizePhone } from '../src/core/local-config.js';
test('configuração local define dono e admins', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vizzabot-config-'));
  try {
    const file = join(dir, 'config.local.json');
    writeFileSync(file, JSON.stringify({ owner: { name: 'Vizza', numbers: ['+55 (98) 99999-9999'] }, botAdmins: ['5598888888888'], bot: { name: 'Meu Bot', prefix: '.' } }));
    const c = readLocalConfig(file);
    assert.equal(c.ownerName, 'Vizza');
    assert.deepEqual(c.ownerNumbers, ['5598999999999']);
    assert.deepEqual(c.botAdmins, ['5598888888888']);
    assert.equal(c.prefix, '.');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('rejeita números inválidos', () => assert.throws(() => normalizePhone('123')));
