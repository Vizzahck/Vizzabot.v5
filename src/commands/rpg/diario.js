export const DAILY_REWARD = 100;
export const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export default {
  name: 'diario', aliases: ['daily'], category: 'Economia',
  description: 'Resgata 100 moedas uma vez a cada 24 horas',
  async execute(ctx) {
    const result = ctx.store.claimDaily(ctx.sender, Date.now(), DAILY_REWARD, DAILY_COOLDOWN_MS);
    if (!result.ok) {
      const hours = Math.ceil(result.remainingMs / 3600000);
      return ctx.reply(`⏳ Você já resgatou. Volte em aproximadamente ${hours} hora(s).`);
    }
    await ctx.reply(`🎁 Recompensa diária: +${DAILY_REWARD} moedas!\n🪙 Saldo: ${result.coins}`);
  }
};
