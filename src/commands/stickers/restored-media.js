import { downloadContentFromMessage, prepareWAMessageMedia, proto, generateMessageIDV2 } from '@whiskeysockets/baileys';
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const LIMIT=8*1024*1024;
let busy=false;
const specs=[
 ['grave2',[],['audio'],'mp3',['-af','aresample=44100,asetrate=33075,aresample=44100,atempo=1.3,alimiter=limit=0.7:level=0']],
 ['bass2',[],['audio'],'mp3',['-af','equalizer=f=94:width_type=o:width=2:g=9,alimiter=limit=0.7:level=0']],
 ['bass3',[],['audio'],'mp3',['-af','equalizer=f=40:width_type=o:width=2:g=9,alimiter=limit=0.7:level=0']],
 ['estourar',[],['audio'],'mp3',['-af','volume=2,asoftclip=type=tanh,alimiter=limit=0.6:level=0']],
 ['esquilo',[],['audio'],'mp3',['-af','aresample=44100,asetrate=65100,aresample=44100,atempo=0.8,alimiter=limit=0.7:level=0']],
 ['vozmenino',[],['audio'],'mp3',['-af','aresample=44100,asetrate=55125,aresample=44100,atempo=0.85,alimiter=limit=0.7:level=0']],

 ['figcinza',[],['sticker','image'],'webp',['-frames:v','1','-vf','hue=s=0','-c:v','libwebp']],
 ['figespelho',[],['sticker','image'],'webp',['-frames:v','1','-vf','hflip','-c:v','libwebp']],
 ['toimg',['sticker2img'],['sticker'],'png',['-frames:v','1']],
 ['togif',[],['sticker','video'],'mp4',['-an','-vf','scale=480:-2:force_original_aspect_ratio=decrease','-c:v','libx264','-pix_fmt','yuv420p']],
 ['tomp3',['extrairaudio','videopraaudio'],['video','audio'],'mp3',['-vn','-c:a','libmp3lame']],
 ['grave',[],['audio'],'mp3',['-af','asetrate=44100*0.85,aresample=44100']],
 ['audiolento',['slow'],['audio'],'mp3',['-af','atempo=0.75']],
 ['audiorapido',['fast'],['audio'],'mp3',['-af','atempo=1.5']],
 ['bass',[],['audio'],'mp3',['-af','bass=g=6,alimiter=limit=0.8']],
 ['videocontrario',['reversevid'],['video'],'mp4',['-vf','scale=480:-2,reverse','-an']],
 ['videolento',['slowvid'],['video'],'mp4',['-vf','setpts=1.5*PTS','-an']],
 ['videorapido',['fastvid'],['video'],'mp4',['-vf','setpts=0.67*PTS','-an']],
 ['figvideo',['stickeranimado','sgif'],['video'],'webp',['-an','-vf','fps=12,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000','-loop','0','-c:v','libwebp_anim','-q:v','55']]
];
function source(ctx,kinds){
 const m=ctx.msg.message?.ephemeralMessage?.message||ctx.msg.message||{};
 const q=Object.values(m).find(v=>v?.contextInfo?.quotedMessage)?.contextInfo?.quotedMessage||{};
 for(const candidate of [m,q.ephemeralMessage?.message||q])for(const kind of kinds){
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


// Sound stickers are experimental on rc14: the embedded AudioMessage is field 26.
// Key by the unique encrypted upload hash, not by the image content, so identical
// animations with different sounds cannot inherit each other's audio.
const soundAttachments=new Map();
let soundEncoderInstalled=false;
function soundKey(message){
 return message?.fileEncSha256?.length?Buffer.from(message.fileEncSha256).toString('base64'):null;
}
function installSoundEncoder(){
 if(soundEncoderInstalled)return;
 const codec=proto.Message.StickerMessage;
 const original=codec.encode;
 // If a future schema already supports audio, leave its encoder unchanged.
 const probe=codec.fromObject({audioMessage:{seconds:1}});
 if(codec.decode(codec.encode(probe).finish()).audioMessage){
  soundEncoderInstalled=true;return;
 }
 codec.encode=function(message,writer){
  const result=original.call(this,message,writer);
  const audio=soundAttachments.get(soundKey(message));
  if(audio)result.uint32(210).bytes(audio);
  return result;
 };
 soundEncoderInstalled=true;
}
async function sendSoundSticker(ctx,sticker,audio){
 if(typeof ctx.sock.waUploadToServer!=='function'||typeof ctx.sock.relayMessage!=='function')throw Error('Upload indisponível');
 const options={upload:ctx.sock.waUploadToServer,logger:ctx.logger,mediaUploadTimeoutMs:30000};
 const sound=await prepareWAMessageMedia({audio,mimetype:'audio/ogg; codecs=opus',ptt:false},options);
 const visual=await prepareWAMessageMedia({sticker,mimetype:'image/webp',isAnimated:true,width:512,height:512},options);
 const sm=visual.stickerMessage,am=sound.audioMessage;
 if(!sm||!am||!soundKey(sm))throw Error('Mídia preparada inválida');
 installSoundEncoder();
 const key=soundKey(sm);
 sm.audioMessage=am;
 // Keep this attachment only while the message is being encrypted and relayed.
 soundAttachments.set(key,proto.Message.AudioMessage.encode(am).finish());
 try{await ctx.sock.relayMessage(ctx.chat,visual,{messageId:generateMessageIDV2(ctx.sock.user?.id)});}
 finally{soundAttachments.delete(key);}
}
restoredMedia.push({
 name:'ssom',aliases:['stickersom','figsom'],category:'Figurinhas',
 description:'Cria figurinha animada com o som original do vídeo (experimental)',
 async execute(ctx){
  const s=source(ctx,['video']);
  if(!s)return ctx.reply('Envie um vídeo com a legenda '+ctx.config.prefix+'ssom ou responda a um vídeo com esse comando.');
  if(Number(s.media.fileLength)>LIMIT)return ctx.reply('Limite de vídeo: 8 MB.');
  if(busy)return ctx.reply('Conversão em andamento. Tente novamente depois.');
  busy=true;let dir;
  try{
   dir=await mkdtemp(join(tmpdir(),'vizzabot-ssom-'));
   const input=join(dir,'input'),output=join(dir,'sound.webp'),audioPath=join(dir,'sound.ogg');
   const stream=await downloadContentFromMessage(s.media,'video');
   const chunks=[];let size=0;
   for await(const chunk of stream){size+=chunk.length;if(size>LIMIT){stream.destroy?.();throw Error('Mídia grande');}chunks.push(chunk);}
   await writeFile(input,Buffer.concat(chunks));
   const base=['-nostdin','-hide_banner','-loglevel','error','-threads','1','-protocol_whitelist','file,pipe','-i',input,'-t','5'];
   try{
    await run([...base,'-map','0:a:0','-vn','-ac','1','-ar','48000','-c:a','libopus','-b:a','48k','-y',audioPath]);
   }catch(e){return ctx.reply('Não consegui extrair o som. Use um vídeo com áudio e FFmpeg com suporte a Opus.');}
   const sound=await readFile(audioPath);
   if(sound.length<100||sound.length>128*1024)throw Error('Áudio inválido');
   let visual;
   // Reduce frame rate and quality until the animated sticker fits 500 KB.
   for(const [fps,quality] of [[12,65],[10,45],[8,30],[6,18]]){
    await run([...base,'-map','0:v:0','-an','-vf','fps='+fps+',scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000','-c:v','libwebp_anim','-lossless','0','-q:v',String(quality),'-loop','0','-y',output]);
    const n=(await stat(output)).size;
    if(n>0&&n<=500*1024){visual=await readFile(output);break;}
   }
   if(!visual)return ctx.reply('O vídeo ficou grande demais para uma figurinha. Tente um trecho mais simples.');
   await sendSoundSticker(ctx,visual,sound);
  }catch(e){
   ctx.logger?.warn?.({command:'ssom',errorType:e.name},'Falha ao criar figurinha sonora');
   await ctx.reply('Não consegui criar a figurinha com som. Verifique a versão do WhatsApp e os codecs WebP/Opus do FFmpeg.');
  }finally{try{if(dir)await rm(dir,{recursive:true,force:true});}finally{busy=false;}}
 }
});
