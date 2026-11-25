import { groupRoles } from '../../core/group.js';

function mentioned(ctx) {
 const message=ctx.msg.message;
 return message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
  || message?.imageMessage?.contextInfo?.mentionedJid?.[0]
  || message?.videoMessage?.contextInfo?.mentionedJid?.[0];
}
async function adminCheck(ctx) {
 if (!ctx.chat.endsWith('@g.us')) { await ctx.reply('Este comando funciona somente em grupos.'); return false; }
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if (!roles.admin) { await ctx.reply('⛔ Somente administradores do grupo ou do bot.'); return false; }
 return true;
}
export const warningCommands=[
 {name:'advertir',aliases:['adv','warn'],category:'Administração',description:'Registra uma advertência a um membro marcado',async execute(ctx){
  if(!await adminCheck(ctx))return;
  const target=mentioned(ctx);
  if(!target)return ctx.reply('Uso: '+ctx.config.prefix+'advertir @membro');
  if(target===ctx.sender)return ctx.reply('Você não pode advertir a si mesmo.');
  const count=ctx.store.warn(ctx.chat,target);
  await ctx.reply('⚠️ Advertência registrada. Total: *'+count+'*.\nUsuário: @'+target.split('@')[0]);
 }},
 {name:'avisosusuario',aliases:['warns','veradv'],category:'Administração',description:'Consulta advertências registradas de um membro',async execute(ctx){
  if(!await adminCheck(ctx))return;
  const target=mentioned(ctx)||ctx.sender;
  const count=ctx.store.warnings(ctx.chat,target);
  await ctx.reply('📋 Advertências registradas: *'+count+'*.\nUsuário: @'+target.split('@')[0]);
 }}
];

warningCommands.push(...[
 ['tiraradv','Remove uma advertência do membro marcado'],
 ['resetadv','Zera advertências do membro marcado'],
 ['listadv','Lista advertências do grupo']
].map(([name,description])=>({name,description,category:'Administração',async execute(ctx){
 if(!await adminCheck(ctx))return;
 const db=ctx.store.db;
 if(name==='listadv'){
 const rows=db.prepare('SELECT user_jid,count FROM warnings WHERE group_jid=? AND count>0 ORDER BY count DESC,user_jid LIMIT 50').all(ctx.chat);
 return ctx.reply(rows.length?rows.map((r,i)=>(i+1)+'. '+r.user_jid.split('@')[0]+' — '+r.count).join('\n'):'Nenhuma advertência.');
 }
 const target=mentioned(ctx);if(!target)return ctx.reply('Marque um membro.');
 if(name==='resetadv'&&!ctx.args.includes('confirmar'))return ctx.reply('Marque o membro e inclua confirmar.');
 if(name==='resetadv')db.prepare('DELETE FROM warnings WHERE group_jid=? AND user_jid=?').run(ctx.chat,target);
 else db.prepare('UPDATE warnings SET count=MAX(0,count-1) WHERE group_jid=? AND user_jid=?').run(ctx.chat,target);
 await ctx.reply('Advertências restantes: '+ctx.store.warnings(ctx.chat,target));
}})));
