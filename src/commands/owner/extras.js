import { ownerState, change } from './restored.js';
const cmd=(name,description,execute)=>({name,description,execute,ownerOnly:true,category:'Proprietário'});
export const ownerExtras=[
 cmd('arquivargp','Arquiva o grupo atual',async c=>{
 if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
 await c.sock.chatModify({archive:true,lastMessages:[{key:c.msg.key,messageTimestamp:c.msg.messageTimestamp}]},c.chat);await c.reply('Grupo arquivado.');
 }),
 cmd('desarquivargp','Desarquiva o grupo atual',async c=>{
 if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
 await c.sock.chatModify({archive:false,lastMessages:[{key:c.msg.key,messageTimestamp:c.msg.messageTimestamp}]},c.chat);await c.reply('Grupo desarquivado.');
 }),
 cmd('setdespedida','Define mensagem de despedida ou reset',async c=>{
 const t=c.args.join(' ').trim();if(!t||t.length>500)return c.reply('Informe até 500 caracteres ou reset.');
 await change(s=>{if(t==='reset')delete s.farewellText;else s.farewellText=t;});await c.reply('Configuração salva.');
 }),
 cmd('menutexto','Alterna menu somente texto: on/off',async c=>{
 const v=c.args[0];if(!['on','off'].includes(v))return c.reply('Use on ou off.');
 await change(s=>{s.menuTextOnly=v==='on';});await c.reply('Configuração salva.');
 })
];
