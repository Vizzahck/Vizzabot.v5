import { groupRoles } from '../../core/group.js';
export default {
  name: 'avisos', category: 'Administração',
  description: 'Consulta avisos de um participante mencionado',
  async execute(ctx) {
    if (!ctx.chat.endsWith('@g.us')) return ctx.reply('Somente grupos.');
    const roles = await groupRoles(ctx.sock, ctx.chat, ctx.sender, ctx.isOwner);
    if (!roles.admin) return ctx.reply('⛔ Somente administradores.');
    const target = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.sender;
    await ctx.reply(`⚠️ Avisos registrados: ${ctx.store.warnings(ctx.chat, target)}`);
  }
};
