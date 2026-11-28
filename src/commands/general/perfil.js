import { rpgProfileText } from '../rpg/restored-v4.js';
export default {
  name: 'perfil', category: 'Geral', description: 'Consulta seu perfil no banco de dados',
  async execute(ctx) {
    await ctx.reply(rpgProfileText(ctx));
  }
};
