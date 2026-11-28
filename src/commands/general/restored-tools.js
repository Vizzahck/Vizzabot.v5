import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomInt } from 'node:crypto';
const cmd=(name,aliases,description,execute,category='Ferramentas')=>({name,aliases,description,execute,category});
const text=c=>c.args.join(' ').trim();
async function getText(url,limit=512*1024){
 const r=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error'});
 if(!r.ok)throw Error('HTTP '+r.status);
 if(Number(r.headers.get('content-length'))>limit){await r.body?.cancel();throw Error('Resposta grande');}
 const chunks=[];let n=0;
 for await(const chunk of r.body){n+=chunk.length;if(n>limit)throw Error('Resposta grande');chunks.push(chunk);}
 return Buffer.concat(chunks).toString('utf8');
}
const getJson=async(url,limit)=>JSON.parse(await getText(url,limit));
const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
function run(bin,args,input){
 return new Promise((resolve,reject)=>{
  const p=spawn(bin,args,{stdio:['pipe','ignore','ignore']});
  const timer=setTimeout(()=>p.kill('SIGKILL'),25000);
  p.stdin.on('error',()=>{});
  p.once('error',e=>{clearTimeout(timer);reject(e);});
  p.once('close',code=>{clearTimeout(timer);code===0?resolve():reject(Error(bin+' falhou'));});
  p.stdin.end(input);
 });
}
let speechBusy=false;
const languages={pt:'pt-br','pt-br':'pt-br',en:'en-us',es:'es',fr:'fr',it:'it',de:'de',ja:'ja'};
async function speak(c){
 const candidate=String(c.args[0]||'').toLowerCase();
 const lang=Object.hasOwn(languages,candidate)?languages[candidate]:'pt-br';
 const value=(Object.hasOwn(languages,candidate)?c.args.slice(1):c.args).join(' ').trim();
 if(!value||value.length>600)return c.reply('Uso: '+c.config.prefix+'gtts PT seu texto (até 600 caracteres).');
 if(speechBusy)return c.reply('Outra conversão de voz em andamento.');
 speechBusy=true;let dir;
 try{
  dir=await mkdtemp(join(tmpdir(),'vizza-tts-'));
  const wav=join(dir,'speech.wav'),ogg=join(dir,'speech.ogg');
  await run('espeak-ng',['-v',lang,'-s','155','-w',wav,'--stdin'],value);
  await run('ffmpeg',['-nostdin','-loglevel','error','-y','-i',wav,'-ac','1','-ar','48000','-c:a','libopus','-b:a','32k','-t','90',ogg]);
  const audio=await readFile(ogg);
  if(!audio.length||audio.length>1024*1024)throw Error('Saída inválida');
  await c.sock.sendMessage(c.chat,{audio,mimetype:'audio/ogg; codecs=opus',ptt:true},{quoted:c.msg});
 }catch{await c.reply('Não consegui sintetizar a voz. No Termux, confira a instalação do espeak-ng e do FFmpeg.');}
 finally{try{if(dir)await rm(dir,{recursive:true,force:true});}finally{speechBusy=false;}}
}
const advice=[
 ['Provérbios 15:1','Responder com calma ajuda a evitar discussões.'],
 ['Tiago 1:19','Escute com atenção antes de responder.'],
 ['Eclesiastes 4:9–10','A cooperação e o apoio mútuo fazem diferença.'],
 ['Romanos 12:18','Procure viver em paz com as pessoas, quando possível.'],
 ['Gálatas 6:9','Continue praticando o bem, mesmo quando exige esforço.']
];
export const restoredTools=[
 cmd('gtts',['textvoz','txtvoz'],'Converte texto em mensagem de voz local',speak),
 cmd('traduzir',['tradutor'],'Traduz texto público via MyMemory',async c=>{
  const value=text(c);
  if(!value)return c.reply('Uso: '+c.config.prefix+'traduzir en pt | hello | confirmar\nO texto será enviado ao serviço MyMemory. Não inclua dados privados.');
  const parts=value.split('|').map(s=>s.trim());
  if(parts.at(-1)!=='confirmar')return c.reply('Para enviar texto público ao MyMemory, use '+c.config.prefix+'traduzir en pt | hello | confirmar. Não inclua informações privadas.');
  const [from,to]=parts[0].toLowerCase().split(/\s+/);
  const message=parts[1];
  if(parts.length!==3||!Object.hasOwn(languages,from)||!Object.hasOwn(languages,to)||from===to||!message||Buffer.byteLength(message)>450)return c.reply('Informe idiomas diferentes e até 450 bytes de texto. Exemplo: '+c.config.prefix+'traduzir en pt | hello | confirmar');
  try{
   const data=await getJson('https://api.mymemory.translated.net/get?'+new URLSearchParams({q:message,langpair:from+'|'+to}),128*1024);
   if(Number(data.responseStatus)!==200||typeof data.responseData?.translatedText!=='string')throw Error('Tradução indisponível');
   await c.reply('🌐 Tradução (MyMemory):\n'+decode(data.responseData.translatedText).slice(0,1500));
  }catch{await c.reply('Serviço de tradução temporariamente indisponível.');}
 }),
 cmd('livro',[],'Pesquisa livros no catálogo Open Library',async c=>{
  const q=text(c);if(!q||q.length>150)return c.reply('Uso: '+c.config.prefix+'livro título ou autor');
  try{
   const data=await getJson('https://openlibrary.org/search.json?'+new URLSearchParams({q,limit:'5',fields:'key,title,author_name,first_publish_year'}));
   const found=(data.docs||[]).filter(d=>typeof d.title==='string'&&/^\/works\/OL\d+W$/.test(d.key||'')).slice(0,5);
   await c.reply(found.length?'📚 Livros encontrados:\n\n'+found.map((d,i)=>(i+1)+'. '+d.title.slice(0,200)+'\n'+(d.author_name||[]).slice(0,2).join(', ')+' • '+(d.first_publish_year||'Ano não informado')+'\nhttps://openlibrary.org'+d.key).join('\n\n'):'Nenhum livro encontrado.');
  }catch{await c.reply('Catálogo indisponível no momento.');}
 },'Pesquisa e Downloads'),
 cmd('noticias',['getnoticias'],'Pesquisa manchetes recentes em português',async c=>{
  const q=text(c);if(!q||q.length>120)return c.reply('Uso: '+c.config.prefix+'noticias assunto');
  try{
   const xml=await getText('https://news.google.com/rss/search?'+new URLSearchParams({q,hl:'pt-BR',gl:'BR',ceid:'BR:pt-419'}));
   const items=[];
   for(const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)){
    const title=decode(m[1].match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
    const link=decode(m[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1]);
    const date=decode(m[1].match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]);
    if(title&&/^https:\/\/news\.google\.com\//.test(link))items.push(title.slice(0,220)+'\n'+date+'\n'+link);
    if(items.length===5)break;
   }
   await c.reply(items.length?'📰 Manchetes — '+q+'\n\n'+items.join('\n\n'):'Nenhuma manchete encontrada.');
  }catch{await c.reply('Não consegui consultar as notícias agora.');}
 },'Pesquisa e Downloads'),
 cmd('imgsearch',['pinterest'],'Busca referências visuais em sites públicos',async c=>{
  const q=text(c);if(!q||q.length>120)return c.reply('Uso: '+c.config.prefix+'imgsearch tema');
  await c.reply('🖼️ Pesquisa de imagens:\nhttps://www.google.com/search?tbm=isch&q='+encodeURIComponent(q)+'\nhttps://www.pinterest.com/search/pins/?q='+encodeURIComponent(q)+'\nConfira a licença antes de reutilizar imagens.');
 },'Pesquisa e Downloads'),
 cmd('conselhosbiblico',['conselhosb','conselhob'],'Sorteia reflexão bíblica com referência',async c=>{
  const [ref,reflection]=advice[randomInt(advice.length)];await c.reply('📖 '+ref+'\n'+reflection+'\n(Reflexão em palavras próprias.)');
 }),
 cmd('tabela',[],'Cria tabela de multiplicação ou lista textual',async c=>{
  const value=text(c);
  if(/^\d{1,5}$/.test(value)){const n=Number(value);return c.reply(Array.from({length:10},(_,i)=>n+' × '+(i+1)+' = '+n*(i+1)).join('\n'));}
  const rows=value.split('|').map(s=>s.trim()).filter(Boolean);
  if(rows.length<2||rows.length>20||rows.some(s=>s.length>80))return c.reply('Uso: '+c.config.prefix+'tabela 7 ou item 1 | item 2');
  await c.reply('📋 TABELA\n'+rows.map((s,i)=>String(i+1).padStart(2,'0')+' | '+s).join('\n'));
 })
];
