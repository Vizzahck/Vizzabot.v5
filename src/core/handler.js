import { ownerState } from '../commands/owner/restored.js';
import { extractText, parseCommand } from './parser.js';
import { isOwner, isBotAdmin } from './permissions.js';
import { moderateMessage } from './moderation.js';
import { createRateLimiter } from './rate-limit.js';
import { isBotGenerated } from './outgoing.js';
import { simiReply } from './simi.js';
import { activity, chatKind, messageKind } from './activity.js';
const limiter = createRateLimiter({ windowMs: 5000, max: 4 });
export async function handleMessage(sock, msg, registry, config, logger, store, sentIds = new Set()) {
  if (!msg?.message || msg.key?.remoteJid === 'status@broadcast' || isBotGenerated(msg, sentIds)) return;
  const chat = msg.key.remoteJid;
  if (!chat || chat.endsWith('@newsletter')) return;
  const group = chat.endsWith('@g.us');
  if ((group && !config.allowGroups) || (!group && !config.allowPrivate)) return;
  if (config.activityMonitor) activity(logger, 'received', { chatType: chatKind(chat), messageType: messageKind(msg.message), own: !!msg.key.fromMe });
  if (await moderateMessage(sock, msg, store, logger, config)) { if (config.activityMonitor) activity(logger, 'moderated', { chatType: chatKind(chat) }); return; }
  const parsed = parseCommand(extractText(msg.message), config.prefix);
  if (!parsed) {
    if (config.simiEnabled && !msg.key.fromMe && !group) {
      const answer = simiReply(extractText(msg.message), config.name);
      if (answer) await sock.sendMessage(chat, { text: answer }, { quoted: msg });
    }
    return;
  }
  const command = registry.get(parsed.name);
  if (!command) { if (config.activityMonitor) activity(logger, 'unknown-command', { command: parsed.name, chatType: chatKind(chat) }); return; }
  // WhatsApp sets remoteJid to the chat for self-sent messages. Use the
  // authenticated account ID to determine permissions, not the chat target.
  const sender = msg.key.fromMe ? sock.user?.id : (group ? msg.key.participant : chat);
  if (!sender) return;
  const candidates = msg.key.fromMe ? [sock.user?.id, sock.user?.phoneNumber] : [sender, group ? msg.key.participantAlt : msg.key.remoteJidAlt];
  const phones = candidates.filter(j => typeof j === 'string' && /@s\.whatsapp\.net$/.test(j));
  for (const jid of candidates) {
    if (typeof jid !== 'string' || !/@lid$/.test(jid)) continue;
    try {
      const pn = await sock.signalRepository?.lidMapping?.getPNForLID?.(jid);
      if (typeof pn === 'string' && pn.endsWith('@s.whatsapp.net')) phones.push(pn);
    } catch { /* Fail closed if mapping is unavailable. */ }
  }
  const owner = phones.some(j => isOwner(j, config.owners));
  const admin = owner || phones.some(j => isBotAdmin(j, config.botAdmins, config.owners));
  if (command.ownerOnly && !owner) {
    logger.warn({ fromMe: !!msg.key.fromMe, senderDomain: sender.split('@')[1], accountDomain: sock.user?.id?.split('@')[1], alternatePresent: !!(group ? msg.key.participantAlt : msg.key.remoteJidAlt), phoneCandidates: phones.length, configuredOwners: config.owners.length, mappingAvailable: typeof sock.signalRepository?.lidMapping?.getPNForLID === 'function' }, 'Diagnostico de proprietario');
  }
  if (!owner && !limiter.allow(sender)) { if (config.activityMonitor) activity(logger, 'rate-limited', { command: command.name }); return; }
  if (config.activityMonitor) activity(logger, 'command', { command: command.name, chatType: chatKind(chat), own: !!msg.key.fromMe });
  // Self-chat messages can be echoed with different LID/PN identifiers.
  // Avoid attaching a quoted context to messages sent to the same account.
  const selfChat = !group && !!msg.key.fromMe;
  const reply = async text => sock.sendMessage(chat, { text }, selfChat ? undefined : { quoted: msg });
  if (command.ownerOnly && !owner) { if (config.activityMonitor) activity(logger, 'denied', { command: command.name }); return reply('⛔ Comando exclusivo do proprietário.'); }
  try {
    const settings=await ownerState();
    if(!owner && (settings.enabled===false || settings.receive===false || settings.blockedCommands?.includes(command.name) || settings.blockedUsers?.includes(sender))) return;
    if(!owner && !group && settings.privateNotice) return reply(settings.privateText || 'Atendimento privado indisponível.');
    if(command.category==='Pesquisa e Downloads') {
      const progress={play:'🎵 Procurando áudio...',video:'🎬 Procurando vídeo...',mp4:'🎬 Procurando vídeo...',ytdoc:'🎵 Preparando documento de áudio...',tomp3:'🎧 Extraindo áudio...',gitclone:'📦 Buscando repositório...',album:'💿 Buscando informações do álbum...',videopralink:'🔗 Preparando vídeo...',topmusicas:'🎵 Consultando catálogo musical...'};
      await reply(progress[command.name]||'🔎 Buscando informações e processando seu pedido...').catch(()=>{});
    }
    await command.execute({ sock, msg, chat, sender, args: parsed.args, reply, isOwner: owner, isBotAdmin: admin, config, registry, store, logger });
    if (config.activityMonitor) activity(logger, 'command-completed', { command: command.name });
  } catch (error) {
    logger.error({ err: error, command: command.name }, 'Falha no comando');
    if (config.activityMonitor) activity(logger, 'command-failed', { command: command.name });
    await reply('⚠️ Não consegui executar este comando.');
  }
}
