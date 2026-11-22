import { randomInt } from 'node:crypto';
const pick=items=>items[randomInt(items.length)];
const specs=[
 ['cor','🎨 A cor que combina com você hoje é ',['Azul','Verde','Vermelho','Amarelo','Roxo']],
 ['animal','🐾 O animal de estimação perfeito para você é ',['Cachorro','Gato','Coelho','Pássaro','Peixe']],
 ['bebida','🥤 A bebida ideal para agora é ',['Água','Refrigerante','Suco','Café','Chá']],
 ['futuro','🔮 Seu futuro parece ',['Promissor','Incerto','Brilhante','Desafiador','Empolgante']],
 ['viagem','✈️ Seu próximo destino de viagem poderia ser ',['Paris','Nova York','Tóquio','Londres','Rio de Janeiro']],
 ['planeta','🪐 O próximo planeta a ser explorado é ',['Marte','Júpiter','Vênus','Saturno','Urano']],
 ['profissao','💼 Uma profissão para conhecer é ',['Médico','Professor','Engenheiro','Artista','Programador']],
 ['fatos_interessantes','🧠 Curiosidade: ',['Polvos têm três corações.','O olho de uma avestruz é maior do que seu cérebro.','A luz do Sol demora cerca de oito minutos para chegar à Terra.']],
 ['rima','🎤 Pense em uma palavra que rima com ',['amor','flor','dor','calor','cor']]
];
export const v4QuickCommands=specs.map(([name,prefix,values])=>({name,aliases:name==='fatos_interessantes'?['fatosinteressantes']:[],category:'Brincadeiras',description:'Sorteia '+name.replaceAll('_',' '),async execute(ctx){await ctx.reply(prefix+pick(values)+(name==='rima'?'!':'')+'\n🎲 Apenas brincadeira.');}}));
v4QuickCommands.push(
 {name:'numero',category:'Brincadeiras',description:'Número da sorte de 0 a 100',async execute(ctx){await ctx.reply('🍀 Seu número da sorte é '+randomInt(101));}},
 {name:'piadas',category:'Brincadeiras',description:'Conta uma piada offline',async execute(ctx){await ctx.reply('😄 '+pick(['Por que o livro de matemática ficou triste? Porque tinha muitos problemas.','Qual é o animal mais antigo? A zebra, porque é em preto e branco.','O que o tomate foi fazer no banco? Tirar extrato.','Por que o computador foi ao médico? Porque pegou um vírus.']));}},
 {name:'cantadas',category:'Brincadeiras',description:'Cantadas leves, sem API',async execute(ctx){await ctx.reply('💌 '+pick(['Você é Wi-Fi? Porque senti uma conexão.','Você é um livro? Porque não consigo parar de pensar na próxima página.','Você é uma estrela? Porque iluminou minha noite.']));}},
 {name:'info',aliases:['infocmd'],category:'Geral',description:'Mostra a descrição de qualquer comando',async execute(ctx){const q=(ctx.args[0]||'').toLowerCase().replace(/^[!#./]/,'');if(!q)return ctx.reply('Uso: '+ctx.config.prefix+'info ping');const command=ctx.registry.get(q);if(!command||command.ownerOnly&&!ctx.isOwner)return ctx.reply('Comando não encontrado ou indisponível.');await ctx.reply('📖 *'+ctx.config.prefix+command.name+'*\n📁 Categoria: '+(command.category||'Geral')+'\n📝 '+command.description+(command.aliases?.length?'\n🔗 Atalhos: '+command.aliases.map(a=>ctx.config.prefix+a).join(', '):''));}}
);
