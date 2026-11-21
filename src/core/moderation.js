import { groupRoles } from './group.js';
import { extractText } from './parser.js';
const linkPattern = /(?:https?:\/\/|www\.|chat\.whatsapp\.com\/)[^\s]+/i;
export async function moderateMessage(sock, msg, store, logger) {
  const chat = msg.key?.remoteJid;
  if (!chat?.endsWith('@g.us') || !store.group(chat).antilink || msg.key.fromMe) return false;
  const sender = msg.key.participant;
  if (!sender) return false;
  const text = extractText(msg.message);
  if (!linkPattern.test(text)) return false;
  try {
    const roles = await groupRoles(sock, chat, sender);
    if (roles.admin || !roles.botAdmin) return false;
    await sock.sendMessage(chat, { delete: msg.key });
    const count = store.warn(chat, sender);
    await sock.sendMessage(chat, { text: `⚠️ Link removido. Avisos registrados: ${count}.` });
    return true;
  } catch (err) {
    logger.warn({ err }, 'Não foi possível moderar mensagem');
    return false;
  }
}
