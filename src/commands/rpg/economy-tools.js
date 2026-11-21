export const economyTools = [
 {name:'minerar',aliases:['mine'],description:'Minera moedas a cada 30 minutos',category:'Economia',async execute(ctx){
   const amount=20+Math.floor(Math.random()*61);
   const result=ctx.store.mine(ctx.sender,Date.now(),amount,30*60*1000);
   if(!result.ok)return ctx.reply('⛏️ Aguarde '+Math.ceil(result.remainingMs/60000)+' minuto(s) para minerar novamente.');
   await ctx.reply('⛏️ Você minerou *'+amount+' moedas*!\n💰 Saldo: '+result.coins);
 }},
 {name:'transferir',aliases:['pix','pagar'],description:'Transfere moedas a participante mencionado',category:'Economia',async execute(ctx){
   const m=ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
   const amount=Number(ctx.args.find(x=>/^\d+$/.test(x)));
   if(!m||!Number.isSafeInteger(amount)||amount<=0||amount>1000000)return ctx.reply('Uso: !transferir @pessoa 100 (máximo 1.000.000)');
   const result=ctx.store.transfer(ctx.sender,m,amount);
   if(!result.ok)return ctx.reply(result.reason==='funds'?'💸 Saldo insuficiente.':'⚠️ Transferência inválida.');
   await ctx.reply('✅ Transferidas *'+amount+' moedas*!\n💰 Seu saldo: '+result.coins);
 }}
];
