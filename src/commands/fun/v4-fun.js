const labels = [
 ['gado',['gadometro'],'🐂','gado'],['corno',[],'🐂','corno'],['gay',[],'🌈','gay'],
 ['lindo',['linda'],'✨','bonito'],['feio',[],'🪞','feio'],['bebado',[],'🍺','bêbado'],
 ['gostoso',['gostosa'],'🔥','gostoso'],['vesgo',[],'👀','vesgo'],['calvo',[],'🧑‍🦲','calvo'],
 ['chance',[],'🎯','de chance'],['sorte',[],'🍀','de sorte']
];
export const v4Fun = labels.map(([name,aliases,icon,label])=>({
 name,aliases,category:'Brincadeiras',description:'Medidor divertido de '+label,
 async execute(ctx){const who=ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split('@')[0]||ctx.args.join(' ')||'Você';const score=Math.floor(Math.random()*101);await ctx.reply(icon+' *'+who+'* tem *'+score+'%* '+label+'!\n🎲 Apenas brincadeira, resultado aleatório.');}
}));
export const sorteio = {
 name:'sorteio',category:'Brincadeiras',description:'Sorteia uma opção separada por vírgula',
 async execute(ctx){const options=ctx.args.join(' ').split(',').map(x=>x.trim()).filter(Boolean);if(options.length<2||options.length>30)return ctx.reply('Uso: !sorteio pizza, hambúrguer, sushi (2 a 30 opções)');await ctx.reply('🎉 Sorteado: *'+options[Math.floor(Math.random()*options.length)]+'*');}
};
