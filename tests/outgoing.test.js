import test from 'node:test';
import assert from 'node:assert/strict';
import { BOT_MARKER, isBotGenerated, trackOutgoingMessages } from '../src/core/outgoing.js';
test('bot replies are tagged and ignored when echoed', async () => {
  const socket = { sendMessage: async (_jid, content) => ({ key: { id: 'bot-1' }, message: content }) };
  const ids = trackOutgoingMessages(socket);
  const reply = await socket.sendMessage('self@s.whatsapp.net', { text: '!ping' });
  assert.equal(reply.message.text, BOT_MARKER + '!ping');
  assert.equal(isBotGenerated({ key: { fromMe: true, id: 'bot-1' }, message: { conversation: '!ping' } }, ids), true);
  assert.equal(isBotGenerated({ key: { fromMe: true, id: 'manual-1' }, message: { conversation: '!ping' } }, ids), false);
  assert.equal(isBotGenerated({ key: { fromMe: true, id: 'early' }, message: { conversation: BOT_MARKER + '!ping' } }, ids), true);
});
