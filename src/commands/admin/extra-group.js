import { groupRoles } from '../../core/group.js';
const getMentions=ctx=>ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
export const extraGroupCommands=[
 {name:'hidetag',aliases:['totag'],category:'Administração',description:'Envia mensagem mencionando participantes sem listar nomes',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(!roles.admin)return ctx.reply('⛔ Apenas administradores.');
  const text=ctx.args.join(' ').trim();
  if(!text||text.length>1500)return ctx.reply('Uso: !hidetag mensagem (até 1500 caracteres)');
  const meta=await ctx.sock.groupMetadata(ctx.chat);
  if(meta.participants.length>1024)return ctx.reply('Grupo grande demais.');
  await ctx.sock.sendMessage(ctx.chat,{text,mentions:meta.participants.map(p=>p.id)});
 }},
 {name:'regras',aliases:['regrasgp'],category:'Administração',description:'Exibe a descrição e regras do grupo',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const meta=await ctx.sock.groupMetadata(ctx.chat);
  await ctx.reply('📜 *REGRAS — '+meta.subject+'*\n\n'+(meta.desc||'Os administradores ainda não definiram regras na descrição.'));
 }},
 {name:'sairgp',aliases:['sairgrupo'],category:'Proprietário',ownerOnly:true,description:'Faz o bot sair do grupo atual',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  if(ctx.args[0]!=='confirmar')return ctx.reply('⚠️ Para o bot sair deste grupo, digite !sairgp confirmar');
  await ctx.reply('👋 Saindo do grupo.');
  await ctx.sock.groupLeave(ctx.chat);
 }},
 {name:'mencionar',aliases:['marcarwa'],category:'Ferramentas',description:'Menciona os usuários escolhidos',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const mentions=getMentions(ctx);
  if(!mentions.length)return ctx.reply('Uso: !mencionar @pessoa');
  await ctx.sock.sendMessage(ctx.chat,{text:'📢 '+mentions.map(j=>'@'+j.split('@')[0]).join(' '),mentions});
 }}
];
