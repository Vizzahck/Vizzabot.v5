import { groupRoles } from '../../core/group.js';
export default {
  name: 'antilink', category: 'Administração', description: 'Ativa/desativa proteção contra links (!antilink on/off)',
  async execute(ctx) {
    if (!ctx.chat.endsWith('@g.us')) return ctx.reply('Este comando é exclusivo de grupos.');
    const roles = await groupRoles(ctx.sock, ctx.chat, ctx.sender, ctx.isOwner);
    if (!roles.admin) return ctx.reply('⛔ Somente administradores do grupo.');
    const value = ctx.args[0]?.toLowerCase();
    if (!['on', 'off'].includes(value)) return ctx.reply('Uso: !antilink on ou !antilink off');
    ctx.store.setGroup(ctx.chat, 'antilink', value === 'on');
    await ctx.reply(`🔗 Antilink ${value === 'on' ? 'ativado' : 'desativado'}.`);
  }
};
