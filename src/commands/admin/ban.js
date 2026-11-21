import { groupRoles } from '../../core/group.js';
export default {
  name: 'ban', aliases: ['remover'], category: 'Administração', description: 'Remove participante mencionado (admin)',
  async execute(ctx) {
    if (!ctx.chat.endsWith('@g.us')) return ctx.reply('Somente grupos.');
    const roles = await groupRoles(ctx.sock, ctx.chat, ctx.sender, ctx.isOwner, ctx.isBotAdmin);
    if (!roles.admin) return ctx.reply('⛔ Somente administradores.');
    if (!roles.botAdmin) return ctx.reply('Preciso ser administrador do grupo.');
    const target = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return ctx.reply('Mencione o participante: !ban @usuario');
    if (target === ctx.sender || target === ctx.sock.user?.id) return ctx.reply('Não posso remover esse participante.');
    const metadata = await ctx.sock.groupMetadata(ctx.chat);
    const member = metadata.participants?.find(p => p.id === target);
    if (!member) return ctx.reply('Participante não encontrado no grupo.');
    if (member.admin) return ctx.reply('Não removo outros administradores.');
    await ctx.sock.groupParticipantsUpdate(ctx.chat, [target], 'remove');
    await ctx.reply('✅ Solicitação de remoção enviada.');
  }
};
