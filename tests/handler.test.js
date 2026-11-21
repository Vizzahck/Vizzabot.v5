import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMessage } from '../src/core/handler.js';
import { createRegistry } from '../src/core/registry.js';
test('ignora mensagens sem prefixo', async () => {
  const replies = [];
  const sock = { sendMessage: async (_, msg) => replies.push(msg.text) };
  const msg = { key: { remoteJid: '123@s.whatsapp.net' }, message: { conversation: 'oi' } };
  const registry = createRegistry([{ name: 'ping', async execute({ reply }) { await reply('pong'); } }]);
  const config = { prefix: '!', owners: [], allowGroups: true, allowPrivate: true };
  const store = { group: () => ({ antilink: 0 }) };
  const logger = { error() {}, warn() {} };
  await handleMessage(sock, msg, registry, config, logger, store);
  assert.deepEqual(replies, []);
  msg.message.conversation = '!ping';
  await handleMessage(sock, msg, registry, config, logger, store);
  assert.deepEqual(replies, ['pong']);
});
