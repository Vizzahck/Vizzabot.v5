// Invisible prefix identifies messages sent by the bot, even if WhatsApp echoes
// them before sendMessage resolves and returns an ID.
export const BOT_MARKER = '\u2063';
export function isBotGenerated(msg, sentIds) {
  if (!msg?.key?.fromMe) return false;
  if (msg.key.id && sentIds.has(msg.key.id)) return true;
  const message = msg.message || {};
  const text = message.conversation || message.extendedTextMessage?.text || message.imageMessage?.caption || '';
  return text.startsWith(BOT_MARKER);
}
export function trackOutgoingMessages(sock) {
  const sentIds = new Set();
  const send = sock.sendMessage.bind(sock);
  sock.sendMessage = async (jid, content, options) => {
    const tagged = content && typeof content.text === 'string'
      ? { ...content, text: BOT_MARKER + content.text } : content;
    const result = await send(jid, tagged, options);
    if (result?.key?.id) {
      sentIds.add(result.key.id);
      if (sentIds.size > 2000) sentIds.delete(sentIds.values().next().value);
    }
    return result;
  };
  return sentIds;
}
