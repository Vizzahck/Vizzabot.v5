export default {
  name: 'menu', aliases: ['ajuda', 'help'], category: 'Geral', description: 'Mostra os comandos disponíveis',
  async execute(ctx) {
    const lines = ctx.registry.list().filter(c => !c.ownerOnly || ctx.isOwner)
      .map(c => `${ctx.config.prefix}${c.name} — ${c.description}`);
    await ctx.reply(`🤖 *${ctx.config.name}*\n\n${lines.join('\n')}\n\nBase V5 • modular`);
  }
};
