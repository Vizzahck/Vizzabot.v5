import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const MAX_BYTES=45*1024*1024;
export function isHttpUrl(value){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol);}catch{return false;}}
export function queryTarget(input){const value=input.trim();if(!value||value.length>250)throw Error('Pesquisa vazia ou muito longa');return isHttpUrl(value)?value:'ytsearch1:'+value;}
export function formatInfo(info){
 const duration=Number(info.duration);
 const time=Number.isFinite(duration)&&duration>0?Math.floor(duration/60)+':'+String(Math.floor(duration%60)).padStart(2,'0'):'Não informada';
 const published=/^\d{8}$/.test(String(info.upload_date||''))?String(info.upload_date).replace(/^(\d{4})(\d{2})(\d{2})$/,'$3/$2/$1'):'Não informada';
 const views=Number.isFinite(Number(info.view_count))?Number(info.view_count).toLocaleString('pt-BR'):'Não informadas';
 return '❗ *DOWNLOAD* ❗\n\n🎵 *Título:* '+String(info.title||'Não informado').slice(0,140)+'\n👤 *Canal:* '+String(info.uploader||info.channel||'Não informado').slice(0,100)+'\n📅 *Publicado:* '+published+'\n👁️ *Visualizações:* '+views+'\n⏱️ *Duração:* '+time+'\n🔗 '+String(info.webpage_url||'').slice(0,220);
}
export function resolvedEntry(info){
 if(info?._type==='playlist'||Array.isArray(info?.entries)){
  const entry=info.entries?.find(x=>x&&x.id);
  if(!entry)throw Error('Pesquisa sem resultados');
  return entry.webpage_url||entry.url||(entry.id?'https://www.youtube.com/watch?v='+encodeURIComponent(entry.id):null);
 }
 return null;
}
function run(bin,args,{timeoutMs=90000,maxOutput=2*1024*1024}={}){return new Promise((resolve,reject)=>{let out='',err='';const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});const timer=setTimeout(()=>child.kill('SIGKILL'),timeoutMs);child.stdout.on('data',chunk=>{out+=chunk;if(out.length>maxOutput)child.kill('SIGKILL');});child.stderr.on('data',chunk=>{err+=chunk;if(err.length>maxOutput)child.kill('SIGKILL');});child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(Error('yt-dlp falhou ('+code+'): '+err.slice(-400)));});});}
export async function inspect(target){
 const raw=await run('yt-dlp',['--no-playlist','--dump-single-json','--no-warnings',target]);
 let info=JSON.parse(raw);
 const entry=resolvedEntry(info);
 if(entry){
  const url=isHttpUrl(entry)?entry:('https://www.youtube.com/watch?v='+encodeURIComponent(entry));
  const detail=await run('yt-dlp',['--no-playlist','--dump-single-json','--no-warnings',url]);
  info=JSON.parse(detail);
 }
 if(info.is_live||info.live_status==='is_live')throw Error('Transmissões ao vivo não são suportadas');
 if(Number(info.duration)>3600)throw Error('Mídia maior que uma hora');
 if(!info.webpage_url||!isHttpUrl(info.webpage_url))throw Error('URL de mídia não resolvida');
 return info;
}
export async function download(target,kind,dir){const template=join(dir,'media.%(ext)s');const args=['--no-playlist','--no-warnings','--max-filesize','45M','--output',template];if(kind==='audio')args.push('-x','--audio-format','mp3','--audio-quality','5');else args.push('-f','bv*[height<=720]+ba/b[height<=720]/b','--merge-output-format','mp4','--recode-video','mp4');args.push(target);await run('yt-dlp',args,{timeoutMs:180000,maxOutput:4*1024*1024});const names=(await readdir(dir)).filter(x=>x.startsWith('media.')&&!x.endsWith('.part'));if(!names.length)throw Error('Arquivo não encontrado após download');const file=join(dir,names[0]);if((await stat(file)).size>MAX_BYTES)throw Error('Arquivo maior que 45 MB');return {buffer:await readFile(file),name:names[0]};}
export const mediaCommands=['play','video','mp4','ytdoc'].map(kind=>({
 name:kind,aliases:kind==='play'?['musica','audio','ytmp3']:kind==='video'?['ytmp4','videoyt']:[],category:'Pesquisa e Downloads',
 description:kind==='ytdoc'?'Envia áudio MP3 como documento':kind==='play'?'Baixa áudio por link ou nome':'Baixa vídeo por link ou nome',
 async execute(ctx){
  const search=ctx.args.join(' ').trim();
  if(!search)return ctx.reply('Uso: '+ctx.config.prefix+kind+' nome ou link');
  let dir;
  try{
   const target=queryTarget(search);
   const info=await inspect(target);
   const url=info.webpage_url&&isHttpUrl(info.webpage_url)?info.webpage_url:target;
   const caption=formatInfo(info)+(kind==='mp4'?'\n📝 *Descrição:* '+String(info.description||'Não informada').slice(0,650):'');
   // Self-chat replies should not quote messages from the same account.
   const sendOptions=ctx.msg.key?.fromMe && !ctx.chat.endsWith('@g.us') ? undefined : {quoted:ctx.msg};
   if(kind==='play'&&info.thumbnail&&isHttpUrl(info.thumbnail)){
    try{await ctx.sock.sendMessage(ctx.chat,{image:{url:info.thumbnail},caption},sendOptions);}catch{await ctx.reply(caption);}
   }else if(kind==='play')await ctx.reply(caption);
   dir=await mkdtemp(join(tmpdir(),'vizzabot-media-'));
   const file=await download(url,['play','ytdoc'].includes(kind)?'audio':'video',dir);
   if(kind==='play')await ctx.sock.sendMessage(ctx.chat,{audio:file.buffer,mimetype:'audio/mpeg',fileName:(String(info.title||'audio').replace(/[\\\\/:*?\"<>|]/g,'').slice(0,80)||'audio')+'.mp3'},sendOptions);
   else if(kind==='ytdoc')await ctx.sock.sendMessage(ctx.chat,{document:file.buffer,mimetype:'audio/mpeg',fileName:'audio.mp3',caption},sendOptions);
   else await ctx.sock.sendMessage(ctx.chat,{video:file.buffer,mimetype:'video/mp4',caption},sendOptions);
  }catch(error){ctx.logger.warn({message:error.message,command:kind},'Falha no download');await ctx.reply('⚠️ Não consegui baixar essa mídia. Confira o link, o suporte da plataforma e se yt-dlp/ffmpeg estão instalados.');}
  finally{if(dir)await rm(dir,{recursive:true,force:true}).catch(()=>{});}
 }
}));
mediaCommands.push({name:'buscarletra',aliases:[],category:'Pesquisa e Downloads',description:'Busca fontes de letras por música e artista',async execute(ctx){
 const q=ctx.args.join(' ').trim();
 if(!q||q.length>200)return ctx.reply('Uso: '+ctx.config.prefix+'buscarletra música artista');
 const query=encodeURIComponent(q+' letra');
 await ctx.reply('🎵 Busca de letra: '+q+'\nhttps://www.google.com/search?q='+query+'%20site%3Aletras.mus.br\nhttps://www.google.com/search?q='+query+'%20site%3Agenius.com');
}});
mediaCommands.push({name:'ytsearch',aliases:[],category:'Pesquisa e Downloads',description:'Pesquisa cinco vídeos no YouTube sem baixar',async execute(ctx){
 const q=ctx.args.join(' ').trim();
 if(q.length<2||q.length>200)return ctx.reply('Uso: '+ctx.config.prefix+'ytsearch nome');
 try{
 const raw=await run('yt-dlp',['--flat-playlist','--dump-single-json','--no-warnings','--','ytsearch5:'+q],{timeoutMs:30000});
 const entries=JSON.parse(raw).entries||[];
 const results=entries.filter(e=>e&&/^[A-Za-z0-9_-]{11}$/.test(e.id||'')).slice(0,5);
 await ctx.reply(results.length?results.map((e,i)=>(i+1)+'. '+String(e.title||'Sem título').slice(0,150)+'\nCanal: '+String(e.channel||e.uploader||'Não informado').slice(0,100)+'\nhttps://www.youtube.com/watch?v='+e.id).join('\n\n'):'Nenhum resultado.');
 }catch{await ctx.reply('Pesquisa indisponível. Verifique o yt-dlp e a conexão.');}
}});

export const musicCatalogCommands=['deezer','album','topmusicas'].map(name=>({
 name,aliases:[],category:'Pesquisa e Downloads',
 description:name==='album'?'Pesquisa álbuns':name==='topmusicas'?'Consulta músicas populares no Brasil':'Pesquisa músicas no catálogo',
 async execute(ctx){
  const q=ctx.args.join(' ').trim();
  if(name!=='topmusicas'&&(!q||q.length>150))return ctx.reply('Uso: '+ctx.config.prefix+name+' nome');
  const params=new URLSearchParams({country:'BR',limit:'5',media:'music',explicit:'No'});
  params.set('entity',name==='album'?'album':'song');
  params.set('term',name==='topmusicas'?'':q);
  try{
   const url=name==='topmusicas'?'https://rss.applemarketingtools.com/api/v2/br/music/most-played/10/songs.json':'https://itunes.apple.com/search?'+params;
   const res=await fetch(url,{signal:AbortSignal.timeout(10000),redirect:'error'});
   if(!res.ok)throw Error('Catálogo indisponível');
   const json=await res.json();
   const items=(name==='topmusicas'?json.feed?.results:json.results)||[];
   const rows=items.slice(0,5).map((x,i)=>{
    const title=String(x.trackName||x.collectionName||x.name||'Sem título').slice(0,120);
    const artist=String(x.artistName||'Não informado').slice(0,100);
    const link=name==='deezer'?'https://www.deezer.com/search/'+encodeURIComponent(title+' '+artist):String(x.trackViewUrl||x.collectionViewUrl||x.url||'');
    const date=typeof x.releaseDate==='string'?x.releaseDate.slice(0,10).split('-').reverse().join('/'):'Não informada';
    const genre=x.primaryGenreName||'Não informado';
    const details=name==='album'?'\nGênero: '+genre+'\nLançamento: '+date+'\nFaixas: '+(x.trackCount??'Não informado')+'\nDescrição: Álbum de '+artist+(x.primaryGenreName?' no gênero '+genre:'')+'. '+(x.trackCount?'Contém '+x.trackCount+' faixas.':'') : name==='deezer'?'\nÁlbum: '+(x.collectionName||'Não informado')+'\nGênero: '+genre+'\nLançamento: '+date:'';
    return (i+1)+'. *'+title+'*\nArtista: '+artist+details+'\n'+(isHttpUrl(link)?link:'');
   });
   if(name==='album'&&items[0]?.artworkUrl100&&isHttpUrl(items[0].artworkUrl100)){
    try{await ctx.sock.sendMessage(ctx.chat,{image:{url:items[0].artworkUrl100},caption:rows.join('\n\n')});return;}catch{}
   }
   await ctx.reply(rows.length?rows.join('\n\n'):'Nenhum resultado encontrado.');
  }catch{await ctx.reply('Catálogo temporariamente indisponível.');}
 }
}));

export const repositoryCommands=[{
 name:'gitclone',aliases:[],category:'Pesquisa e Downloads',description:'Envia o ZIP de um repositório público do GitHub',
 async execute(ctx){
 const match=ctx.args.join(' ').trim().match(/^(?:https:\/\/(?:www\.)?github\.com\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9_.-]+)\/?$/);
 if(!match)return ctx.reply('Uso: '+ctx.config.prefix+'gitclone https://github.com/dono/repositorio');
 const [,owner,raw]=match;const repo=raw.replace(/\.git$/,'');
 if(!repo||repo==='.'||repo==='..')return ctx.reply('Repositório inválido.');
 try{
 const res=await fetch('https://api.github.com/repos/'+owner+'/'+repo,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json','User-Agent':'Vizzabot-V5'}});
 if(!res.ok)throw Error('GitHub HTTP '+res.status);
 const data=await res.json();
 if(data.private||!data.default_branch)throw Error('Repositório não público');
 const url='https://codeload.github.com/'+owner+'/'+repo+'/zip/refs/heads/'+encodeURIComponent(data.default_branch);
 const zip=await fetch(url,{signal:AbortSignal.timeout(60000),redirect:'error'});
 if(!zip.ok||!zip.body)throw Error('ZIP HTTP '+zip.status);
 const reader=zip.body.getReader();let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw Error('ZIP maior que 45 MB');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}
 await ctx.sock.sendMessage(ctx.chat,{document:Buffer.concat(chunks),mimetype:'application/zip',fileName:repo+'.zip'});
 }catch(e){ctx.logger?.warn?.({message:e.message},'Falha gitclone');await ctx.reply('Não consegui obter o ZIP público: '+(/^(GitHub HTTP|ZIP HTTP|ZIP maior)/.test(e.message)?e.message:'falha de conexão ou envio')+'.');}
 }
}];

export const instagramImageCommands=['ig-img','ig-image','insta-imagem'].map(name=>({
 name,aliases:[],category:'Pesquisa e Downloads',description:'Obtém imagens de publicação pública do Instagram via gallery-dl',
 async execute(ctx){
 const input=ctx.args.join(' ').trim();
 const match=input.match(/^https:\/\/(?:www\.)?instagram\.com\/p\/([A-Za-z0-9_-]{3,40})\/?(?:\?[^#\s]*)?$/);
 if(!match)return ctx.reply('Informe o link de uma publicação pública do Instagram.');
 let dir;
 try{
 dir=await mkdtemp(join(tmpdir(),'vizzabot-ig-'));
 await run('gallery-dl',['--ignore-config','--no-input','--range','1-5','-D',dir,'https://www.instagram.com/p/'+match[1]+'/'],{timeoutMs:60000});
 const files=(await readdir(dir)).filter(n=>/\.(jpg|jpeg|png)$/i.test(n)).slice(0,5);
 if(!files.length)return ctx.reply('Nenhuma imagem disponível nessa publicação.');
 for(const name of files){
 const file=join(dir,name);
 if((await stat(file)).size>8*1024*1024)continue;
 await ctx.sock.sendMessage(ctx.chat,{image:await readFile(file)});
 }
 }catch{await ctx.reply('Não foi possível obter imagens públicas. Confira se gallery-dl está instalado e se a publicação está acessível sem login.');}
 finally{if(dir)await rm(dir,{recursive:true,force:true}).catch(()=>{});}
 }
}));

export const finalDownloadCommands=[{
 name:'videopralink',aliases:[],category:'Pesquisa e Downloads',description:'Hospeda vídeo próprio com confirmação explícita',
 async execute(ctx){
 if(!ctx.config.imageLinksEnabled)return ctx.reply('Hospedagem pública desativada na configuração local.');
 const m=ctx.msg.message?.ephemeralMessage?.message||ctx.msg.message||{};
 const video=m.videoMessage;
 if(!video||ctx.args.join(' ').trim()!=='confirmar')return ctx.reply('Envie seu próprio vídeo com a legenda !videopralink confirmar. O arquivo ficará público; não envie conteúdo privado ou de terceiros.');
 const limit=8*1024*1024;
 if(Number(video.fileLength)>limit||video.mimetype!=='video/mp4')return ctx.reply('Somente MP4 de até 8 MB.');
 try{
 const {downloadContentFromMessage}=await import('@whiskeysockets/baileys');
 const stream=await downloadContentFromMessage(video,'video');
 let size=0;const chunks=[];
 for await(const chunk of stream){size+=chunk.length;if(size>limit){stream.destroy?.();throw Error('Limite excedido');}chunks.push(chunk);}
 const form=new FormData();form.append('reqtype','fileupload');form.append('fileToUpload',new Blob(chunks,{type:'video/mp4'}),'video.mp4');
 const res=await fetch('https://catbox.moe/user/api.php',{method:'POST',body:form,signal:AbortSignal.timeout(30000),redirect:'error'});
 const url=(await res.text()).trim();
 if(!res.ok||!/^https:\/\/files\.catbox\.moe\/[A-Za-z0-9._-]+$/.test(url))throw Error('Upload recusado');
 await ctx.reply('Link público: '+url);
 }catch{await ctx.reply('Não foi possível hospedar o vídeo.');}
 }
}];

