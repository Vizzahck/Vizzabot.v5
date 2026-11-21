export default {
  name: 'status', ownerOnly: true, category: 'Proprietário', description: 'Estado do processo',
  async execute(ctx) { await ctx.reply(`✅ Ativo há ${Math.floor(process.uptime())} segundos.`); }
};
