import { extractText, parseCommand } from './parser.js';
import { isOwner } from './permissions.js';
import { moderateMessage } from './moderation.js';
export async function handleMessage(sock, msg, registry, config, logger, store) {
  if (!msg?.message || msg.key?.fromMe || msg.key?.remoteJid === 'status@broadcast') return;
  const chat = msg.key.remoteJid;
  if (!chat || chat.endsWith('@newsletter')) return;
  const group = chat.endsWith('@g.us');
  if ((group && !config.allowGroups) || (!group && !config.allowPrivate)) return;
  if (await moderateMessage(sock, msg, store, logger)) return;
  const parsed = parseCommand(extractText(msg.message), config.prefix);
  if (!parsed) return;
  const command = registry.get(parsed.name);
  if (!command) return;
  const sender = group ? msg.key.participant : chat;
  if (!sender) return;
  const owner = isOwner(sender, config.owners);
  const reply = async text => sock.sendMessage(chat, { text }, { quoted: msg });
  if (command.ownerOnly && !owner) return reply('⛔ Comando exclusivo do proprietário.');
  try {
    await command.execute({ sock, msg, chat, sender, args: parsed.args, reply, isOwner: owner, config, registry, store, logger });
  } catch (error) {
    logger.error({ err: error, command: command.name }, 'Falha no comando');
    await reply('⚠️ Não consegui executar este comando.');
  }
}
