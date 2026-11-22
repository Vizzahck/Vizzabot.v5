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
 const link=settings.antilink&&linkPattern.test(messageText);
 const blocked=settings.antipalavra?matchesBlockedWord(messageText,blockedWords(store.db,chat)):null;
 if(!flag&&!link&&!blocked)return false;
 const sender=msg.key.participant;
 if(!sender)return false;
 try{
  const roles=await groupRoles(sock,chat,sender,false,isBotAdmin(sender,config.botAdmins,config.owners));
  if(roles.admin||!roles.botAdmin)return false;
  await sock.sendMessage(chat,{delete:msg.key});
  const count=store.warn(chat,sender);
  await sock.sendMessage(chat,{text:'⚠️ '+(flag?'Mídia bloqueada ('+flag+').':blocked?'Palavra bloqueada.':'Link removido.')+' Avisos registrados: '+count+'.'});
  return true;
 }catch(err){logger.warn({err},'Não foi possível moderar mensagem');return false;}
}
