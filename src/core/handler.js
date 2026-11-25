import { groupRoles } from './group.js';
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
    if (!msg.key.fromMe && !group) {
      const settings=await ownerState();
      if(settings.away && !settings.privateNotice && settings.enabled!==false && settings.receive!==false){
        if(limiter.allow(chat))await sock.sendMessage(chat,{text:settings.awayText||'O proprietário está ausente.'},{quoted:msg});
        return;
      }
    }
    if (config.simiEnabled && !msg.key.fromMe && !group) {
      const answer = simiReply(extractText(msg.message), config.name);
      if (answer) await sock.sendMessage(chat, { text: answer }, { quoted: msg });
    }
    return;
  }
  if(group){
    store.db.exec('CREATE TABLE IF NOT EXISTS group_modes (jid TEXT NOT NULL,mode TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(jid,mode))');
    if(store.db.prepare("SELECT enabled FROM group_modes WHERE jid=? AND mode='so_adm'").get(chat)?.enabled){
      const actor=msg.key.fromMe?sock.user?.id:msg.key.participant;
      const roles=await groupRoles(sock,chat,actor,isOwner(actor,config.owners),isBotAdmin(actor,config.botAdmins,config.owners));
      if(!roles.admin)return;
    }
  }
  const command = registry.get(parsed.name);
  if (!command) {
    const settings=await ownerState();
    if(settings.enabled!==false&&settings.receive!==false&&(group||!settings.privateNotice)&&!settings.bannedGroups?.includes(chat)&&!(settings.rentals?.[chat]<=Date.now())&&!settings.blockedUsers?.includes(msg.key.participant||chat)&&!settings.blockedCommands?.includes(parsed.name)&&Object.hasOwn(settings.customImages||{},parsed.name)&&limiter.allow(msg.key.participant||chat))return sock.sendMessage(chat,{image:Buffer.from(settings.customImages[parsed.name],'base64')});
    if(settings.enabled!==false&&settings.receive!==false&&!settings.bannedGroups?.includes(chat)&&!(settings.rentals?.[chat]<=Date.now())&&!settings.blockedUsers?.includes(msg.key.participant||chat)&&Object.hasOwn(settings.customReplies||{},parsed.name)&&limiter.allow(msg.key.participant||chat))return sock.sendMessage(chat,{text:settings.customReplies[parsed.name]}); if (config.activityMonitor) activity(logger, 'unknown-command', { command: parsed.name, chatType: chatKind(chat) }); return; }
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
    if(!owner && group && (settings.bannedGroups?.includes(chat)||settings.rentals?.[chat]<=Date.now()))return reply('⛔ Acesso do grupo suspenso. Consulte o proprietário.');
    if(!owner && !group && settings.privateNotice) return reply(settings.privateText || 'Atendimento privado indisponível.');
    if(group&&!owner){
      store.db.exec('CREATE TABLE IF NOT EXISTS group_blocked_commands (jid TEXT NOT NULL,command TEXT NOT NULL,PRIMARY KEY(jid,command))');
      if(store.db.prepare('SELECT 1 FROM group_blocked_commands WHERE jid=? AND command=?').get(chat,command.name)){
        const roles=await groupRoles(sock,chat,sender,owner,admin);
        if(!roles.admin)return reply('Comando desativado neste grupo.');
      }
    }
    if(command.category==='Pesquisa e Downloads') {
      const progress={play:'🎵 Procurando áudio...',video:'🎬 Procurando vídeo...',mp4:'🎬 Procurando vídeo...',ytdoc:'🎵 Preparando documento de áudio...',tomp3:'🎧 Extraindo áudio...',gitclone:'📦 Buscando repositório...',album:'💿 Buscando informações do álbum...',videopralink:'🔗 Preparando vídeo...',topmusicas:'🎵 Consultando catálogo musical...'};
      await reply(progress[command.name]||'🔎 Buscando informações e processando seu pedido...').catch(()=>{});
    }
    await command.execute({ sock, msg, chat, sender, args: parsed.args, reply, isOwner: owner, isBotAdmin: admin, config, registry, store, logger });
    if (config.activityMonitor) activity(logger, 'command-completed', { command: command.name });
  } catch (error) {
    logger.error({ err: error, command: command.name }, 'Falha no comando');
    if (config.activityMonitor) activity(logger, 'command-failed', { command: command.name });
    await reply('⚠️ Não consegui executar este comando.').catch(()=>logger.warn('Não foi possível enviar aviso de falha; conexão indisponível.'));
  }
}
