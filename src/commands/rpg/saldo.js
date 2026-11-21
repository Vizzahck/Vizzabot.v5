export default {
  name: 'saldo', aliases: ['carteira'], category: 'Economia',
  description: 'Mostra suas moedas e experiência',
  async execute(ctx) {
    const user = ctx.store.user(ctx.sender);
    await ctx.reply(`💰 Carteira\n🪙 Moedas: ${user.coins}\n⭐ Experiência: ${user.xp}`);
  }
};
