export default {
  name: 'ranking', aliases: ['top'], category: 'Economia',
  description: 'Exibe os 10 maiores saldos globais',
  async execute(ctx) {
    const rows = ctx.store.topUsers(10);
    if (!rows.length) return ctx.reply('Ainda não há participantes.');
    await ctx.reply('🏆 *Ranking de moedas*\n\n' + rows.map((u, i) => `${i + 1}. ${u.jid.split('@')[0]} — ${u.coins} 🪙`).join('\n'));
  }
};
