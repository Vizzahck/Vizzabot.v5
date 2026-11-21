import { extractText, parseCommand } from './parser.js';
import { isOwner, isBotAdmin } from './permissions.js';
import { moderateMessage } from './moderation.js';
import { createRateLimiter } from './rate-limit.js';
import { isBotGenerated } from './outgoing.js';
import { simiReply } from './simi.js';
const limiter = createRateLimiter({ windowMs: 5000, max: 4 });
export async function handleMessage(sock, msg, registry, config, logger, store, sentIds = new Set()) {
  if (!msg?.message || msg.key?.remoteJid === 'status@broadcast' || isBotGenerated(msg, sentIds)) return;
  const chat = msg.key.remoteJid;
  if (!chat || chat.endsWith('@newsletter')) return;
  const group = chat.endsWith('@g.us');
  if ((group && !config.allowGroups) || (!group && !config.allowPrivate)) return;
  if (await moderateMessage(sock, msg, store, logger, config)) return;
  const parsed = parseCommand(extractText(msg.message), config.prefix);
  if (!parsed) {
    if (config.simiEnabled && !msg.key.fromMe && !group) {
      const answer = simiReply(extractText(msg.message), config.name);
      if (answer) await sock.sendMessage(chat, { text: answer }, { quoted: msg });
    }
    return;
  }
  const command = registry.get(parsed.name);
  if (!command) return;
  // WhatsApp sets remoteJid to the chat for self-sent messages. Use the
  // authenticated account ID to determine permissions, not the chat target.
  const sender = msg.key.fromMe ? sock.user?.id : (group ? msg.key.participant : chat);
  if (!sender) return;
  const owner = isOwner(sender, config.owners);
  const admin = isBotAdmin(sender, config.botAdmins, config.owners);
  if (!owner && !limiter.allow(sender)) return;
  const reply = async text => sock.sendMessage(chat, { text }, { quoted: msg });
  if (command.ownerOnly && !owner) return reply('⛔ Comando exclusivo do proprietário.');
  try {
    await command.execute({ sock, msg, chat, sender, args: parsed.args, reply, isOwner: owner, isBotAdmin: admin, config, registry, store, logger });
  } catch (error) {
    logger.error({ err: error, command: command.name }, 'Falha no comando');
    await reply('⚠️ Não consegui executar este comando.');
  }
}
