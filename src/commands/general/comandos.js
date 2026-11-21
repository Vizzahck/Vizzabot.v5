export default {
  name: 'comandos', category: 'Geral',
  description: 'Lista comandos agrupados por categoria',
  async execute(ctx) {
    const grouped = new Map();
    for (const command of ctx.registry.list()) {
      if (command.ownerOnly && !ctx.isOwner) continue;
      const key = command.category || 'Outros';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(ctx.config.prefix + command.name);
    }
    await ctx.reply('📚 *Comandos do Vizzabot*\n\n' + [...grouped].map(([k, v]) => `*${k}*\n${v.join(' • ')}`).join('\n\n'));
  }
};
