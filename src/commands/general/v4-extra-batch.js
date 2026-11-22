import { randomInt } from 'node:crypto';
const command=(name,description,execute,category='Ferramentas',aliases=[])=>({name,description,execute,category,aliases});
const text=ctx=>ctx.args.join(' ').trim();
const how=(ctx,name,args)=>ctx.reply('Uso: '+ctx.config.prefix+name+' '+args);
const afkUsers=new Map();
const key=ctx=>ctx.sender||ctx.msg?.key?.participant||ctx.chat;
export const v4ExtraCommands=[
 command('afk','Marca você como ausente até reiniciar o bot',async ctx=>{const reason=text(ctx).slice(0,160)||'Sem motivo informado';afkUsers.set(key(ctx),{reason,since:Date.now()});await ctx.reply('💤 Modo ausente ativado.\nMotivo: '+reason);},'Geral',['ausente']),
 command('voltei','Remove seu estado de ausente',async ctx=>{const value=afkUsers.get(key(ctx));afkUsers.delete(key(ctx));await ctx.reply(value?'👋 Bem-vindo de volta! Você ficou ausente por '+Math.floor((Date.now()-value.since)/60000)+' minuto(s).':'👋 Você não estava marcado como ausente.');},'Geral'),
 command('verafk','Consulta seu estado de ausência',async ctx=>{const value=afkUsers.get(key(ctx));await ctx.reply(value?'💤 Ausente desde '+new Date(value.since).toLocaleString('pt-BR')+'\nMotivo: '+value.reason:'✅ Você está disponível.');},'Geral'),
 command('tagme','Mostra seu identificador com menção no grupo',async ctx=>{if(!ctx.chat?.endsWith('@g.us'))return ctx.reply('Este comando funciona em grupos.');const jid=key(ctx);await ctx.sock.sendMessage(ctx.chat,{text:'📣 @'+jid.split('@')[0],mentions:[jid]},{quoted:ctx.msg});},'Administração'),
 command('criartabela','Cria tabela textual com itens separados por |',async ctx=>{const items=text(ctx).split('|').map(x=>x.trim()).filter(Boolean);if(items.length<2||items.length>20||items.some(x=>x.length>65))return how(ctx,'criartabela','Produto | Preço | Quantidade');await ctx.reply('📋 *TABELA*\n'+items.map((x,i)=>String(i+1).padStart(2,'0')+'. '+x).join('\n'));},'Ferramentas',['criartbl']),
 command('texto','Repete texto com formatação simples',async ctx=>{const s=text(ctx);await ctx.reply(s&&s.length<=1500?'📝 *TEXTO*\n'+s:'Uso: '+ctx.config.prefix+'texto mensagem');},'Ferramentas'),
 command('avaliar','Avalia algo de 0 a 10 por brincadeira',async ctx=>{const s=text(ctx);if(!s||s.length>120)return how(ctx,'avaliar','pizza');await ctx.reply('⭐ *'+s+'*: '+randomInt(11)+'/10 (avaliação aleatória)');},'Brincadeiras'),
 command('nivelamor','Sorteia compatibilidade romântica fictícia',async ctx=>{const s=text(ctx);if(!s||s.length>120)return how(ctx,'nivelamor','Ana e João');await ctx.reply('💘 '+s+': '+randomInt(101)+'% (só brincadeira!)');},'Brincadeiras'),
 command('nivelamizade','Sorteia nível fictício de amizade',async ctx=>{const s=text(ctx);if(!s||s.length>120)return how(ctx,'nivelamizade','Ana e João');await ctx.reply('🤝 '+s+': '+randomInt(101)+'% (só brincadeira!)');},'Brincadeiras'),
 command('sortehoje','Sorteia nível de sorte do dia',async ctx=>ctx.reply('🍀 Sorte de hoje: '+randomInt(101)+'/100 (apenas brincadeira).'),'Brincadeiras'),
 command('pergunta','Sorteia pergunta para conversar no grupo',async ctx=>ctx.reply('❓ '+['Qual filme você assistiria novamente?','Qual superpoder escolheria?','Qual seu jogo favorito?','Qual foi sua viagem mais marcante?','Qual música você não enjoa de ouvir?'][randomInt(5)]),'Brincadeiras'),
 command('desafio','Sorteia um desafio leve e seguro',async ctx=>ctx.reply('🎯 '+['Conte uma piada.','Mande três emojis que descrevam seu dia.','Diga uma qualidade de alguém do grupo.','Escreva uma frase sem usar a letra A.','Recomende uma música.'][randomInt(5)]),'Brincadeiras')
];
