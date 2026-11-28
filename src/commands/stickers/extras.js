import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { stickerMetadata } from './metadata.js';
import { renderSvg } from '../../core/svg.js';
import { spawn } from 'node:child_process';
import { mkdtemp,writeFile,readFile,rm,stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function findMedia(ctx,kinds){
 const m=ctx.msg.message?.ephemeralMessage?.message||ctx.msg.message||{};
 const q=Object.values(m).find(v=>v?.contextInfo?.quotedMessage)?.contextInfo?.quotedMessage||{};
 for(const candidate of [m,q.ephemeralMessage?.message||q])for(const kind of kinds){
  if(candidate[kind+'Message'])return {kind,media:candidate[kind+'Message']};
 }
}
async function buffer(source,limit){
 if(Number(source.media.fileLength)>limit)throw Error('Mídia grande');
 const stream=await downloadContentFromMessage(source.media,source.kind);const chunks=[];let size=0;
 for await(const c of stream){size+=c.length;if(size>limit){stream.destroy?.();throw Error('Mídia grande');}chunks.push(c);}
 return Buffer.concat(chunks);
}
function run(bin,args){
 return new Promise((resolve,reject)=>{
  const p=spawn(bin,args,{stdio:'ignore'});const timer=setTimeout(()=>p.kill('SIGKILL'),30000);
  p.once('error',e=>{clearTimeout(timer);reject(e);});
  p.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error('Conversão falhou'));});
 });
}
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c]);
let busy=false;
export const stickerExtras=[
 {name:'rename',aliases:['roubar'],category:'Figurinhas',description:'Edita metadados de figurinha própria ou autorizada',async execute(c){
  const source=findMedia(c,['sticker']);
  const text=c.args.join(' ').trim();
  if(!source||!text.endsWith(' confirmar'))return c.reply('Responda a uma figurinha sua ou autorizada com '+c.config.prefix+'rename pacote/autor confirmar. Informe a autoria verdadeira.');
  const fields=text.slice(0,-10).trim().split('/').map(v=>v.trim());
  if(fields.length!==2||fields.some(v=>!v||v.length>64))return c.reply('Informe pacote e autor (até 64 caracteres cada).');
  try{const out=stickerMetadata(await buffer(source,1024*1024),fields[0],fields[1]);if(out.length>1024*1024)throw Error('Figurinha grande');await c.sock.sendMessage(c.chat,{sticker:out},{quoted:c.msg});}
  catch{await c.reply('Não consegui editar os metadados dessa figurinha.');}
 }},
 {name:'sfundo',aliases:['figusemfundo'],category:'Figurinhas',description:'Converte imagem em figurinha e remove fundo sólido conectado às bordas',async execute(c){
  const source=findMedia(c,['image']);if(!source)return c.reply('Responda a uma imagem com fundo uniforme.');
  if(busy)return c.reply('Conversão em andamento.');
  busy=true;let dir;
  try{
   dir=await mkdtemp(join(tmpdir(),'vizza-bg-'));
   const input=join(dir,'input'),output=join(dir,'output.webp');
   await writeFile(input,await buffer(source,8*1024*1024));
   await run('magick',['-limit','memory','128MiB','-limit','map','256MiB',input+'[0]','-auto-orient','-resize','512x512','-alpha','set','-fuzz','10%','-fill','none','-draw','alpha 0,0 floodfill','-background','none','-gravity','center','-extent','512x512','-quality','80',output]);
   if((await stat(output)).size>500*1024)throw Error('Figurinha grande');
   await c.sock.sendMessage(c.chat,{sticker:await readFile(output)},{quoted:c.msg});
  }catch{await c.reply('Não consegui remover o fundo. Use uma imagem de fundo sólido e confira o ImageMagick.');}
  finally{try{if(dir)await rm(dir,{recursive:true,force:true});}finally{busy=false;}}
 }},
 {name:'emoji-mix',aliases:['emojimix'],category:'Figurinhas',description:'Combina dois emojis em uma figurinha local',async execute(c){
  const p=c.args.join(' ').split('+').map(v=>v.trim());
  const segmenter=new Intl.Segmenter('pt',{granularity:'grapheme'});
  if(p.length!==2||p.some(v=>v.length>24||[...segmenter.segment(v)].length!==1||!/\p{Extended_Pictographic}/u.test(v)))return c.reply('Uso: '+c.config.prefix+'emoji-mix 😙+😗');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><circle cx="256" cy="256" r="222" fill="#ffffff" stroke="#334155" stroke-width="9"/><text x="142" y="295" text-anchor="middle" font-size="130">'+esc(p[0])+'</text><text x="370" y="295" text-anchor="middle" font-size="130">'+esc(p[1])+'</text><text x="256" y="275" text-anchor="middle" font-size="48" fill="#334155">+</text></svg>';
  await c.sock.sendMessage(c.chat,{sticker:await renderSvg(svg,'webp')},{quoted:c.msg});
 }},
 {name:'figuleg',aliases:['figlegendada'],category:'Figurinhas',description:'Cria figurinha de texto com legenda',async execute(c){
  const value=c.args.join(' ').trim();if(!value||Array.from(value).length>60)return c.reply('Uso: '+c.config.prefix+'figuleg sua legenda (até 60 caracteres)');
  const chars=Array.from(value),lines=[];while(chars.length)lines.push(chars.splice(0,15).join(''));
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect x="20" y="20" width="472" height="472" rx="36" fill="#172554" stroke="#60a5fa" stroke-width="5"/>'+lines.map((v,i)=>'<text x="256" y="'+(256+(i-(lines.length-1)/2)*58)+'" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="38" fill="white">'+esc(v)+'</text>').join('')+'</svg>';
  await c.sock.sendMessage(c.chat,{sticker:await renderSvg(svg,'webp')},{quoted:c.msg});
 }}
];
