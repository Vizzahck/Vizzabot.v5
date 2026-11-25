import { ownerState } from '../owner/restored.js';
import { isPremium } from '../owner/personalization.js';
import { randomInt } from 'node:crypto';
import sharp from 'sharp';

function premium(name,description,execute,aliases=[]){
 return {name,aliases,category:'Premium',description,async execute(ctx){
  const settings=await ownerState();
  if(!ctx.isOwner&&!isPremium(settings,ctx.sender))return ctx.reply('Comando exclusivo para Premium.');
  try{await execute(ctx);}catch(e){ctx.logger?.warn?.({command:name,message:e.message},'Falha no comando Premium');await ctx.reply('Não consegui concluir o comando agora.');}
 }};
}
async function readPublic(url,max=512*1024){
 const response=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!response.ok)throw Error('HTTP '+response.status);
 if(Number(response.headers.get('content-length'))>max)throw Error('Resposta grande');
 const chunks=[];let size=0;
 for await(const chunk of response.body){size+=chunk.length;if(size>max)throw Error('Resposta grande');chunks.push(chunk);}
 return Buffer.concat(chunks).toString('utf8');
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]);
const decode=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
async function picture(ctx,svg,caption){
 await ctx.sock.sendMessage(ctx.chat,{image:await sharp(Buffer.from(svg)).png().toBuffer(),caption});
}
const wallpaperNames=[['walpaperanime',['wallpaperanime'],'Paisagem ilustrada'],['walpapertecnológico',['walpapertecnologico','wallpapertecnologico'],'Arte tecnológica'],['walpapergaming',['wallpapergaming'],'Arte pixel gaming']];
export const premiumUtilities=[
 premium('bot','Estatísticas do bot',async c=>{
  const u=Math.floor(process.uptime()),m=process.memoryUsage();
  await c.reply('🤖 Bot online\nAtividade: '+Math.floor(u/3600)+'h '+Math.floor(u%3600/60)+'min '+u%60+'s\nHeap usado: '+(m.heapUsed/1048576).toFixed(1)+' MB\nHeap total: '+(m.heapTotal/1048576).toFixed(1)+' MB');
 }),
 premium('encurtalink','Encurta um link público via TinyURL',async c=>{
  let url;try{url=new URL(c.args[0]);}catch{return c.reply('Informe uma URL HTTP ou HTTPS.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.href.length>1500)return c.reply('URL inválida.');
  const result=(await readPublic('https://tinyurl.com/api-create.php?'+new URLSearchParams({url:url.href}),2048)).trim();
  if(!/^https:\/\/tinyurl\.com\/[A-Za-z0-9_-]+$/.test(result))throw Error('Resposta inválida');
  await c.reply('Link curto: '+result+'\nDestino: '+url.href);
 }),
 premium('globo','Manchetes recentes do G1',async c=>{
  const xml=await readPublic('https://g1.globo.com/rss/g1/');
  const items=[];
  for(const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)){
   const title=decode(match[1].match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
   const link=decode(match[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1]||'');
   if(title&&/^https:\/\/g1\.globo\.com\//.test(link))items.push(title.slice(0,250)+'\n'+link);
   if(items.length===5)break;
  }
  await c.reply(items.length?'📰 G1\n\n'+items.join('\n\n'):'Nenhuma manchete disponível. https://g1.globo.com/');
 }),
 {name:'info_id',category:'Premium',ownerOnly:true,description:'Consulta informações públicas de um convite de grupo',async execute(c){
  const raw=c.args[0]||'',match=raw.match(/^(?:https:\/\/chat\.whatsapp\.com\/)?([A-Za-z0-9_-]{15,40})$/);
  if(!match)return c.reply('Informe um código ou link de convite válido.');
  try{const g=await c.sock.groupGetInviteInfo(match[1]);await c.reply('Grupo: '+(g.subject||'Sem nome')+'\nID: '+g.id+'\nMembros: '+(g.size??'Indisponível'));}catch{await c.reply('Convite inválido ou inacessível.');}
 }},
 premium('meme','Cria meme de texto com frases locais',async c=>{
  const captions=['Quando o bot finalmente funciona','Eu depois de corrigir um bug e ganhar outros três','Só mais um comando, disseram','O código funciona. Ninguém sabe por quê.'];
  const value=c.args.join(' ').trim()||captions[randomInt(captions.length)];
  if(Array.from(value).length>90)return c.reply('Use até 90 caracteres.');
  const chars=Array.from(value),lines=[];while(chars.length)lines.push(chars.splice(0,24).join(''));
  await picture(c,'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#111827"/><rect x="50" y="50" width="700" height="300" rx="24" fill="#38bdf8"/><circle cx="400" cy="200" r="100" fill="#fbbf24"/><circle cx="365" cy="175" r="9"/><circle cx="435" cy="175" r="9"/><path d="M350 225 Q400 260 450 225" stroke="#111827" stroke-width="9" fill="none"/>'+lines.map((v,i)=>'<text x="400" y="'+(400+i*42)+'" text-anchor="middle" font-family="sans-serif" font-size="34" fill="white">'+esc(v)+'</text>').join('')+'</svg>','Meme gerado localmente');
 }),
 ...wallpaperNames.map(([name,aliases,label],index)=>premium(name,label+' gerada localmente',async c=>{
  const palettes=[['#1e1b4b','#fb7185','#818cf8'],['#052e16','#34d399','#22d3ee'],['#172554','#a78bfa','#facc15'],['#431407','#fb923c','#fef08a']];
  const [bg,a,b]=palettes[randomInt(palettes.length)];
  let art='';
  if(index===0){art='<circle cx="540" cy="510" r="250" fill="'+a+'"/><path d="M0 1350 L330 740 L590 1250 L810 850 L1080 1320 V1920 H0Z" fill="'+b+'"/><path d="M0 1500 L420 1100 L810 1580 L1080 1280 V1920 H0Z" fill="'+bg+'"/>';}
  else if(index===1){for(let i=0;i<16;i++){const x=randomInt(1080),y=randomInt(1920);art+='<path d="M'+x+' 0 V'+y+' H'+(1080-x)+'" stroke="'+a+'" stroke-width="4" fill="none" opacity=".65"/><circle cx="'+x+'" cy="'+y+'" r="12" fill="'+b+'"/>';}}
  else {for(let i=0;i<100;i++){art+='<rect x="'+randomInt(27)*40+'" y="'+randomInt(48)*40+'" width="40" height="40" fill="'+(i%2?a:b)+'" opacity=".7"/>';}}
  await picture(c,'<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="'+bg+'"/>'+art+'</svg>',label+' • 1080 × 1920');
 },aliases))
];
