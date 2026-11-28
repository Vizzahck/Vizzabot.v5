import { rpgProfileText } from './restored-v4.js';
export default {
  name: 'saldo', aliases: ['carteira'], category: 'Economia',
  description: 'Mostra suas moedas e experiência',
  async execute(ctx) {
    await ctx.reply(rpgProfileText(ctx));
  }
};
