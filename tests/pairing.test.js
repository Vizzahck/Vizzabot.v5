import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePairingNumber, formatPairingCode } from '../src/core/pairing.js';
test('normaliza telefone para pareamento', () => {
  assert.equal(normalizePairingNumber('+55 (98) 99999-9999'), '5598999999999');
});
test('rejeita telefone inválido', () => {
  assert.throws(() => normalizePairingNumber('123'));
});
test('formata código de pareamento', () => {
  assert.equal(formatPairingCode('ABCD1234'), 'ABCD-1234');
});
