// Privacy-first terminal activity monitor. Does not store message bodies or phone numbers.
export function activity(logger, event, details = {}) {
  logger.info({ activity: event, ...details }, 'Vizzabot activity');
}
export function chatKind(jid = '') { return jid.endsWith('@g.us') ? 'group' : 'private'; }
export function messageKind(message = {}) {
  const m = message.ephemeralMessage?.message || message.viewOnceMessage?.message || message;
  if (m.imageMessage) return 'image';
  if (m.videoMessage) return 'video';
  if (m.audioMessage) return 'audio';
  if (m.stickerMessage) return 'sticker';
  if (m.documentMessage) return 'document';
  if (m.conversation || m.extendedTextMessage) return 'text';
  return 'other';
}
