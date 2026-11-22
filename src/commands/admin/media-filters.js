import { groupRoles } from '../../core/group.js';
export const filterKinds=Object.freeze({antisticker:'stickerMessage',antiaudio:'audioMessage',antivideo:'videoMessage',antiimagem:'imageMessage'});
export const mediaFilterCommands=Object.keys(filterKinds).map(name=>({
 name,aliases:name==='antiimagem'?['antifoto']:[],category:'Administração',
 description:'Liga ou desliga filtro de '+name.replace('anti','')+' no grupo',
 async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(!roles.admin)return ctx.reply('⛔ Somente administradores.');
  const value=ctx.args[0]?.toLowerCase();
  if(!['on','off','1','0'].includes(value))return ctx.reply('Uso: '+ctx.config.prefix+name+' on/off (ou 1/0)');
  if(!roles.botAdmin)return ctx.reply('⛔ O bot precisa ser administrador para apagar mensagens.');
  const enabled=value==='on'||value==='1';
  ctx.store.setGroup(ctx.chat,name,enabled);
  await ctx.reply('🛡️ '+name+' '+(enabled?'ativado':'desativado')+'.');
 }
}));
