export default {
  name: 'perfil', category: 'Geral', description: 'Consulta seu perfil no banco de dados',
  async execute(ctx) {
    const user = ctx.store.user(ctx.sender);
    await ctx.reply(`👤 Seu perfil\n🪙 Moedas: ${user.coins}\n⭐ XP: ${user.xp}\n🏅 Nível: ${1+Math.floor(user.xp/100)}`);
  }
};
