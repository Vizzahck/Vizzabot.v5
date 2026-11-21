export function parseCommand(text, prefix = '!') {
  if (typeof text !== 'string' || !text.startsWith(prefix)) return null;
  const parts = text.slice(prefix.length).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  return { name: parts[0].toLowerCase(), args: parts.slice(1) };
}
export function extractText(message = {}) {
  const m = message.ephemeralMessage?.message || message.viewOnceMessage?.message || message;
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || m.videoMessage?.caption || '';
}
