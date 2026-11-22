import { readFile, writeFile } from 'node:fs/promises';
const path='config.local.json';
const specs={
 'nick-dono':{field:'owner.name',max:80,usage:'!nick-dono 𝖛𝖍𝖘'},
 'numero-dono':{field:'owner.numbers',max:15,usage:'!numero-dono 5598987037044'},
 'nome-bot':{field:'bot.name',max:80,usage:'!nome-bot Vizzabot V5'},
 'prefix':{field:'bot.prefix',max:5,usage:'!prefix #'}
};
export const ownerSettings=Object.entries(specs).map(([name,spec])=>({
 name,aliases:name==='nick-dono'?['nickdono']:name==='numero-dono'?['numerodono']:name==='nome-bot'?['nomebot']:[],
 category:'Proprietário',ownerOnly:true,description:'Altera '+spec.field+' na configuração local',
 async execute(ctx){
  const value=ctx.args.join(' ').trim();
  if(!value)return ctx.reply('Uso: '+spec.usage);
  if(value.length>spec.max||/[\r\n\x00-\x1f]/.test(value))return ctx.reply('⚠️ Valor inválido ou longo demais.');
  if(name==='numero-dono'&&!/^\d{10,15}$/.test(value))return ctx.reply('Use DDI + DDD + número, somente dígitos.');
  if(name==='prefix'&&/\s/.test(value))return ctx.reply('O prefixo não pode conter espaços.');
  const data=JSON.parse(await readFile(path,'utf8'));
  data.owner??={};data.bot??={};
  if(name==='nick-dono')data.owner.name=value;
  if(name==='numero-dono')data.owner.numbers=[value];
  if(name==='nome-bot')data.bot.name=value;
  if(name==='prefix')data.bot.prefix=value;
  await writeFile(path,JSON.stringify(data,null,2)+'\n',{mode:0o600});
  await ctx.reply('✅ Configuração salva! Reinicie o bot para aplicar: '+spec.field+'.');
 }
}));
