import { randomInt } from 'node:crypto';
const define=(name,category,description,execute,aliases=[])=>({name,category,description,execute,aliases});
const text=ctx=>ctx.args.join(' ').trim();
const help=(ctx,name,args)=>'Uso: '+ctx.config.prefix+name+' '+args;
const replyText=(ctx,name,fn,max=1200)=>{const value=text(ctx);return ctx.reply(value&&value.length<=max?fn(value):help(ctx,name,'texto (até '+max+' caracteres)'));};
const words=s=>s.trim().split(/\s+/u).filter(Boolean);
export const utilityBatch3=[
 define('semacento','Ferramentas','Remove acentos de um texto',ctx=>replyText(ctx,'semacento',s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,''))),
 define('limpartexto','Ferramentas','Remove espaços repetidos',ctx=>replyText(ctx,'limpartexto',s=>words(s).join(' '))),
 define('alternar','Ferramentas','Alterna letras maiúsculas e minúsculas',ctx=>replyText(ctx,'alternar',s=>[...s].map((c,i)=>i%2?c.toLowerCase():c.toUpperCase()).join(''))),
 define('iniciais','Ferramentas','Extrai iniciais das palavras',ctx=>replyText(ctx,'iniciais',s=>words(s).map(w=>[...w][0]?.toLocaleUpperCase('pt-BR')).join('. '))),
 define('primeirapalavra','Ferramentas','Mostra primeira palavra do texto',ctx=>replyText(ctx,'primeirapalavra',s=>words(s)[0])),
 define('ultimapalavra','Ferramentas','Mostra última palavra do texto',ctx=>replyText(ctx,'ultimapalavra',s=>words(s).at(-1))),
 define('substituir','Ferramentas','Substitui trecho literal no texto: antigo | novo | frase',async ctx=>{const p=text(ctx).split('|').map(s=>s.trim());if(p.length!==3||!p[0]||p[0].length>100||p[1].length>100||!p[2]||p[2].length>1000)return ctx.reply(help(ctx,'substituir','antigo | novo | frase'));await ctx.reply(p[2].split(p[0]).join(p[1]).slice(0,1600));}),
 define('removerespacos','Ferramentas','Remove todos os espaços',ctx=>replyText(ctx,'removerespacos',s=>s.replace(/\s+/gu,''))),
 define('slug','Ferramentas','Converte texto em slug para URL',ctx=>replyText(ctx,'slug',s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))),
 define('letras','Ferramentas','Conta letras ignorando números e símbolos',ctx=>replyText(ctx,'letras',s=>'🔤 Letras: '+(s.match(/\p{L}/gu)||[]).length)),
 define('digitos','Ferramentas','Conta algarismos do texto',ctx=>replyText(ctx,'digitos',s=>'🔢 Dígitos: '+(s.match(/\p{N}/gu)||[]).length)),
 define('removernumeros','Ferramentas','Remove números de um texto',ctx=>replyText(ctx,'removernumeros',s=>s.replace(/\p{N}/gu,''))),
 define('removerletras','Ferramentas','Remove letras de um texto',ctx=>replyText(ctx,'removerletras',s=>s.replace(/\p{L}/gu,''))),
 define('decimalbin','Ferramentas','Converte inteiro decimal em binário',async ctx=>{const s=text(ctx),n=Number(s);await ctx.reply(/^\d+$/.test(s)&&Number.isSafeInteger(n)?'🔢 '+n.toString(2):help(ctx,'decimalbin','42'));}),
 define('bindecimal','Ferramentas','Converte binário em inteiro decimal',async ctx=>{const s=text(ctx);const n=parseInt(s,2);await ctx.reply(/^[01]{1,52}$/.test(s)&&Number.isSafeInteger(n)?'🔢 '+n:help(ctx,'bindecimal','101010'));}),
 define('decimalhex','Ferramentas','Converte inteiro decimal em hexadecimal',async ctx=>{const s=text(ctx),n=Number(s);await ctx.reply(/^\d+$/.test(s)&&Number.isSafeInteger(n)?'🔢 '+n.toString(16).toUpperCase():help(ctx,'decimalhex','255'));}),
 define('hexdecimal','Ferramentas','Converte hexadecimal em decimal',async ctx=>{const s=text(ctx),n=parseInt(s,16);await ctx.reply(/^[0-9a-f]{1,12}$/i.test(s)&&Number.isSafeInteger(n)?'🔢 '+n:help(ctx,'hexdecimal','FF'));}),
 define('md5','Ferramentas','Gera hash MD5 (não indicado para senhas)',async ctx=>{const s=text(ctx);if(!s||s.length>2000)return ctx.reply(help(ctx,'md5','texto'));const {createHash}=await import('node:crypto');await ctx.reply('🔎 MD5 (apenas verificação de compatibilidade):\n'+createHash('md5').update(s).digest('hex'));}),
 define('simounao','Brincadeiras','Responde sim ou não aleatoriamente',ctx=>ctx.reply(randomInt(2)===0?'🎱 Sim!':'🎱 Não!')),
 define('sortearemoji','Brincadeiras','Sorteia um emoji',ctx=>ctx.reply('🎁 '+['🐱','🐉','🦊','🦋','🌟','🎮','💎','🔥','🌙','🍀'][randomInt(10)]))
];
