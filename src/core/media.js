import { downloadMediaMessage } from '@whiskeysockets/baileys';
export function imageSource(msg) {
  const message = msg.message?.ephemeralMessage?.message || msg.message || {};
  if (message.imageMessage) return { ...msg, message };
  const context = message.extendedTextMessage?.contextInfo;
  const quoted = context?.quotedMessage;
  if (!quoted?.imageMessage) return null;
  return { key: { remoteJid: msg.key.remoteJid, id: context.stanzaId, participant: context.participant }, message: quoted };
}
export async function downloadImage(sock, msg, logger, maxBytes = 8 * 1024 * 1024) {
  const source = imageSource(msg);
  if (!source) return null;
  const declared = source.message.imageMessage?.fileLength;
  if (declared && Number(declared) > maxBytes) throw new Error('Imagem excede 8 MB');
  const buffer = await downloadMediaMessage(source, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage });
  if (buffer.length > maxBytes) throw new Error('Imagem excede 8 MB');
  return { buffer, mimetype: source.message.imageMessage?.mimetype || 'image/jpeg' };
}
