import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const LIMIT=8*1024*1024;
let busy=false;
const specs=[
 ['toimg',[],['sticker'],'png',['-frames:v','1']],
 ['togif',[],['sticker','video'],'mp4',['-an','-vf','scale=480:-2:force_original_aspect_ratio=decrease','-c:v','libx264','-pix_fmt','yuv420p']],
 ['tomp3',['extrairaudio','videopraaudio'],['video','audio'],'mp3',['-vn','-c:a','libmp3lame']],
 ['grave',['grave2'],['audio'],'mp3',['-af','asetrate=44100*0.85,aresample=44100']],
 ['audiolento',['slow'],['audio'],'mp3',['-af','atempo=0.75']],
 ['audiorapido',['fast'],['audio'],'mp3',['-af','atempo=1.5']],
 ['bass',['bass2','bass3'],['audio'],'mp3',['-af','bass=g=6,alimiter=limit=0.8']],
 ['videocontrario',['reversevid'],['video'],'mp4',['-vf','scale=480:-2,reverse','-an']],
 ['videolento',['slowvid'],['video'],'mp4',['-vf','setpts=1.5*PTS','-an']],
 ['videorapido',['fastvid'],['video'],'mp4',['-vf','setpts=0.67*PTS','-an']],
 ['figvideo',[],['video'],'webp',['-an','-vf','fps=12,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2','-loop','0','-c:v','libwebp','-q:v','55']]
];
function source(ctx,kinds){
 const m=ctx.msg.message?.ephemeralMessage?.message||ctx.msg.message||{};
 const q=m.extendedTextMessage?.contextInfo?.quotedMessage||m.videoMessage?.contextInfo?.quotedMessage||{};
 for(const candidate of [m,q])for(const kind of kinds){
  const media=candidate[kind+'Message'];if(media)return {media,kind};
 }
}
async function run(args){
 await new Promise((resolve,reject)=>{
  const p=spawn('ffmpeg',args,{stdio:['ignore','ignore','pipe']});
  let err='';p.stderr.on('data',c=>{err=(err+c).slice(-500);});
  const timer=setTimeout(()=>p.kill('SIGKILL'),90000);
  p.once('error',e=>{clearTimeout(timer);reject(e);});
  p.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error('FFmpeg falhou: '+err));});
 });
}
export const restoredMedia=specs.map(([name,aliases,kinds,ext,filters])=>({
 name,aliases,category:name==='tomp3'?'Pesquisa e Downloads':ext==='webp'||ext==='png'||name==='togif'?'Figurinhas':'Ferramentas',description:name==='tomp3'?'Extrai áudio de vídeo ou converte áudio para MP3':'Conversão local de mídia: '+name,
 async execute(ctx){
  const s=source(ctx,kinds);
  const limit=name==='tomp3'?45*1024*1024:LIMIT;
  const seconds=name==='tomp3'?300:30;
  if(!s)return ctx.reply('Responda a uma mídia compatível com '+ctx.config.prefix+name);
  if(Number(s.media.fileLength)>limit||Number(s.media.seconds)>seconds)return ctx.reply('Limite: '+(limit/1024/1024)+' MB e '+seconds+' segundos.');
  if(busy)return ctx.reply('Conversão em andamento. Tente novamente depois.');
  busy=true;let dir;
  try{
   dir=await mkdtemp(join(tmpdir(),'vizzabot-convert-'));
   const input=join(dir,'input'),output=join(dir,'output.'+ext);
   const stream=await downloadContentFromMessage(s.media,s.kind);
   const chunks=[];let size=0;
   for await(const chunk of stream){size+=chunk.length;if(size>limit){stream.destroy?.();throw Error('Mídia grande');}chunks.push(chunk);}
   await writeFile(input,Buffer.concat(chunks));
   await run(['-nostdin','-hide_banner','-loglevel','error','-threads','1','-protocol_whitelist','file,pipe','-t',name==='figvideo'?'6':String(seconds),'-i',input,...filters,'-t',String(seconds),'-fs',String(LIMIT),'-y',output]);
   const n=(await stat(output)).size;if(!n||n>=LIMIT)throw Error('Saída inválida');
   const buffer=await readFile(output);
   const payload=ext==='png'?{image:buffer}:ext==='webp'?{sticker:buffer}:ext==='mp3'?{audio:buffer,mimetype:'audio/mpeg'}:{video:buffer,mimetype:'video/mp4',gifPlayback:name==='togif'};
   await ctx.sock.sendMessage(ctx.chat,payload);
  }catch(e){ctx.logger?.warn?.({command:name,message:e.message},'Conversão falhou');await ctx.reply('Não consegui converter. Verifique o FFmpeg e o formato da mídia.');}
  finally{try{if(dir)await rm(dir,{recursive:true,force:true});}finally{busy=false;}}
 }
}));
