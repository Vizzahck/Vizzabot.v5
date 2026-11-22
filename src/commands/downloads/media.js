import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const MAX_BYTES=45*1024*1024;
export function isHttpUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol);}catch{return false;}}
export function queryTarget(input){const value=input.trim();if(!value||value.length>250)throw Error('Pesquisa vazia ou muito longa');return isHttpUrl(value)?value:'ytsearch1:'+value;}
export function formatInfo(info){const duration=Number(info.duration)||0;const mins=Math.floor(duration/60),secs=String(duration%60).padStart(2,'0');return '🎵 *'+String(info.title||'Sem título').slice(0,140)+'*\n👤 '+String(info.uploader||info.channel||'Não informado').slice(0,100)+'\n⏱️ '+mins+':'+secs+'\n🔗 '+String(info.webpage_url||'').slice(0,220);}
function run(bin,args,{timeoutMs=90000,maxOutput=2*1024*1024}={}){return new Promise((resolve,reject)=>{let out='',err='';const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);child.stdout.on('data',chunk=>{out+=chunk;if(out.length>maxOutput)child.kill('SIGKILL');});child.stderr.on('data',chunk=>{err+=chunk;if(err.length>maxOutput)child.kill('SIGKILL');});child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(Error('yt-dlp falhou ('+code+'): '+err.slice(-400)));});});}
export async function inspect(target){const raw=await run('yt-dlp',['--no-playlist','--dump-single-json','--no-warnings',target]);const info=JSON.parse(raw);if(info.is_live||info.live_status==='is_live')throw Error('Transmissões ao vivo não são suportadas');if(Number(info.duration)>3600)throw Error('Mídia maior que uma hora');return info;}
export async function download(target,kind,dir){const template=join(dir,'media.%(ext)s');const args=['--no-playlist','--no-warnings','--max-filesize','45M','--output',template];if(kind==='audio')args.push('-x','--audio-format','mp3','--audio-quality','5');else args.push('-f','bv*[height<=720]+ba/b[height<=720]/b','--merge-output-format','mp4','--recode-video','mp4');args.push(target);await run('yt-dlp',args,{timeoutMs:180000,maxOutput:4*1024*1024});const names=(await readdir(dir)).filter(x=>x.startsWith('media.')&&!x.endsWith('.part'));if(!names.length)throw Error('Arquivo não encontrado após download');const file=join(dir,names[0]);if((await stat(file)).size>MAX_BYTES)throw Error('Arquivo maior que 45 MB');return {buffer:await readFile(file),name:names[0]};}
export const mediaCommands=['play','video'].map(kind=>({
 name:kind,aliases:kind==='play'?['musica','audio','ytmp3']:['ytmp4','videoyt'],category:'Downloads',
 description:kind==='play'?'Baixa áudio por link ou nome':'Baixa vídeo por link ou nome',
 async execute(ctx){
  const search=ctx.args.join(' ').trim();
  if(!search)return ctx.reply('Uso: '+ctx.config.prefix+kind+' nome ou link');
  let dir;
  try{
   const target=queryTarget(search);
   await ctx.reply('🔎 Procurando mídia, aguarde...');
   const info=await inspect(target);
   const url=info.webpage_url&&isHttpUrl(info.webpage_url)?info.webpage_url:target;
   const caption=formatInfo(info);
   if(kind==='play'&&info.thumbnail&&isHttpUrl(info.thumbnail)){
    try{await ctx.sock.sendMessage(ctx.chat,{image:{url:info.thumbnail},caption},{quoted:ctx.msg});}catch{await ctx.reply(caption);}
   }else if(kind==='play')await ctx.reply(caption);
   dir=await mkdtemp(join(tmpdir(),'vizzabot-media-'));
   const file=await download(url,kind==='play'?'audio':'video',dir);
   if(kind==='play')await ctx.sock.sendMessage(ctx.chat,{audio:file.buffer,mimetype:'audio/mpeg',fileName:'vizzabot.mp3'},{quoted:ctx.msg});
   else await ctx.sock.sendMessage(ctx.chat,{video:file.buffer,mimetype:'video/mp4',caption},{quoted:ctx.msg});
  }catch(error){ctx.logger.warn({message:error.message,command:kind},'Falha no download');await ctx.reply('⚠️ Não consegui baixar essa mídia. Confira o link, o suporte da plataforma e se yt-dlp/ffmpeg estão instalados.');}
  finally{if(dir)await rm(dir,{recursive:true,force:true}).catch(()=>{});}
 }
}));
