import { ownerState } from '../owner/restored.js';
import { isPremium } from '../owner/personalization.js';
export const DAILY_REWARD = 100;
export const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export default {
  name: 'diario', aliases: ['daily'], category: 'Economia',
  description: 'Resgata 100 moedas uma vez a cada 24 horas',
  async execute(ctx) {
    const settings=await ownerState();
    const reward=DAILY_REWARD*(isPremium(settings,ctx.sender)?(settings.premiumBonus||2):1);
    const result = ctx.store.claimDaily(ctx.sender, Date.now(), reward, DAILY_COOLDOWN_MS);
    if (!result.ok) {
      const hours = Math.ceil(result.remainingMs / 3600000);
      return ctx.reply(`⏳ Você já resgatou. Volte em aproximadamente ${hours} hora(s).`);
    }
    await ctx.reply(`🎁 Recompensa diária: +${reward} moedas!\n🪙 Saldo: ${result.coins}`);
  }
};
