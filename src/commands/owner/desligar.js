export default {
  name: 'desligar', aliases: ['offbot', 'stopbot'], ownerOnly: true,
  category: 'Proprietário', description: 'Desliga o bot remotamente pelo WhatsApp',
  async execute(ctx) {
    await ctx.reply('🛑 Desligando Vizzabot V5 neste aparelho. Para ligar novamente, abra o Termux e execute bash termux/start.sh.');
    setTimeout(() => process.kill(process.pid, 'SIGTERM'), 1200);
  }
};
