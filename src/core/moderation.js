import { groupRoles } from './group.js';
import { isBotAdmin } from './permissions.js';
import { extractText } from './parser.js';
import { blockedWords, matchesBlockedWord } from '../commands/admin/word-filter.js';

const linkPattern=/(?:https?:\/\/|www\.|chat\.whatsapp\.com\/)[^\s]+/i;
const filterTypes={stickerMessage:'antisticker',audioMessage:'antiaudio',videoMessage:'antivideo',imageMessage:'antiimagem'};
export function activeMediaFilter(message,settings){
 let m=message;
 for(let i=0;i<4&&m;i++){
  if(m.ephemeralMessage){m=m.ephemeralMessage.message;continue;}
  if(m.viewOnceMessageV2){m=m.viewOnceMessageV2.message;continue;}
  if(m.viewOnceMessage){m=m.viewOnceMessage.message;continue;}
  if(m.documentWithCaptionMessage){m=m.documentWithCaptionMessage.message;continue;}
  break;
 }
 return Object.entries(filterTypes).find(([kind,flag])=>m?.[kind]&&settings?.[flag])?.[1]||null;
}
export async function moderateMessage(sock,msg,store,logger,config={}){
 const chat=msg.key?.remoteJid;
 if(!chat?.endsWith('@g.us')||msg.key.fromMe)return false;
 const settings=store.group(chat);
 const flag=activeMediaFilter(msg.message,settings);
 const messageText=extractText(msg.message);
 store.db.exec('CREATE TABLE IF NOT EXISTS group_modes (jid TEXT NOT NULL,mode TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(jid,mode))');
 const modes=new Set(store.db.prepare('SELECT mode FROM group_modes WHERE jid=? AND enabled=1').all(chat).map(r=>r.mode));
 const link=(settings.antilink||modes.has('antilinkhard')||modes.has('antilink_adv'))&&linkPattern.test(messageText);
 const blocked=settings.antipalavra?matchesBlockedWord(messageText,blockedWords(store.db,chat)):null;
 store.db.exec('CREATE TABLE IF NOT EXISTS group_mutes (jid TEXT NOT NULL, member TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY(jid,member))');
 const muted=!!store.db.prepare('SELECT 1 FROM group_mutes WHERE jid=? AND member=? AND expires>?').get(chat,msg.key.participant||'',Date.now());
 if(!flag&&!link&&!blocked&&!muted)return false;
 const sender=msg.key.participant;
 if(!sender)return false;
 try{
  const roles=await groupRoles(sock,chat,sender,false,isBotAdmin(sender,config.botAdmins,config.owners));
  if(roles.admin||!roles.botAdmin)return false;
  await sock.sendMessage(chat,{delete:msg.key});
  if(muted)return true;
  if(link&&modes.has('antilinkhard')){
   await sock.sendMessage(chat,{text:'Link bloqueado. Consulte as regras do grupo.'});
   return true;
  }
  const count=store.warn(chat,sender);
  await sock.sendMessage(chat,{text:'⚠️ '+(flag?'Mídia bloqueada ('+flag+').':blocked?'Palavra bloqueada.':'Link removido.')+' Avisos registrados: '+count+'.'});
  return true;
 }catch(err){logger.warn({err},'Não foi possível moderar mensagem');return false;}
}
