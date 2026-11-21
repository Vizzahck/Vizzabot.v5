import { groupRoles } from '../../core/group.js';
export default {
  name: 'boasvindas', category: 'Administração', description: 'Ativa/desativa boas-vindas (!boasvindas on/off)',
  async execute(ctx) {
    if (!ctx.chat.endsWith('@g.us')) return ctx.reply('Somente grupos.');
    const roles = await groupRoles(ctx.sock, ctx.chat, ctx.sender, ctx.isOwner);
    if (!roles.admin) return ctx.reply('⛔ Somente administradores.');
    const value = ctx.args[0]?.toLowerCase();
    if (!['on','off'].includes(value)) return ctx.reply('Uso: !boasvindas on/off');
    ctx.store.setGroup(ctx.chat, 'welcome', value === 'on');
    await ctx.reply(`👋 Boas-vindas ${value === 'on' ? 'ativadas' : 'desativadas'}.`);
  }
};
