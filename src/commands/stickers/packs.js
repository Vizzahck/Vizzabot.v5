import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { randomInt } from 'node:crypto';
import { renderSvg } from '../../core/svg.js';
// Local packs use files reviewed and authorized by the bot operator.
// If no files are installed, generate an original themed text sticker.
const packs=['anime','naruto','satoru','zinitsu','tonko','figurinhas'];
const themes={
 anime:['#4338ca','#f9a8d4',['BORA!','QUE EPISÓDIO!','MODO ANIME','PARTIU AVENTURA']],
 naruto:['#ea580c','#fde68a',['MISSÃO!','NUNCA DESISTA','MODO NINJA','TREINO!']],
 satoru:['#1d4ed8','#c4b5fd',['INFINITO','CALMA','MODO MÁGICO','TUDO CERTO']],
 zinitsu:['#a16207','#fef08a',['TROVÃO!','CORAGEM!','QUE SUSTO!','VAMO NESSA']],
 tonko:['#be185d','#fbcfe8',['OI!','QUE FOFO','OBRIGADO!','BOM DIA']],
 figurinhas:['#0f766e','#99f6e4',['KKKK','CHEGUEI','BOA!','TÁ CERTO','VALEU','BOM DIA','PARTIU!','OI!']]
};
async function fallback(name){
 const [bg,fg,words]=themes[name],text=words[randomInt(words.length)];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect x="25" y="100" width="462" height="312" rx="52" fill="'+bg+'"/><circle cx="256" cy="145" r="26" fill="'+fg+'"/><path d="M238 145 L250 157 L275 131" stroke="'+bg+'" stroke-width="7" fill="none"/><text x="256" y="255" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="'+Math.min(58,Math.floor(600/text.length))+'" font-weight="bold" fill="'+fg+'">'+text+'</text><text x="256" y="340" text-anchor="middle" font-family="sans-serif" font-size="24" fill="white">VIZZABOT</text></svg>';
 return renderSvg(svg,'webp');
}
let busy=false;
export const stickerPacks=packs.map(name=>({
 name,aliases:name==='figurinhas'?[]:[...(name==='zinitsu'?['zenitsu']:[]),'fig-'+name,'fig'+name,'fig-'+name+'s','fig'+name+'s',...(name==='anime'?['figuanime']:[])],
 category:'Figurinhas',description:'Envia figurinha do pack '+name+' ou arte temática original',
 async execute(ctx){
  const count=Number(ctx.args[0]||1);
  if(!Number.isInteger(count)||count<1||count>5)return ctx.reply('Escolha de 1 a 5 figurinhas.');
  if(busy)return ctx.reply('Um pack está sendo enviado. Tente novamente depois.');
  busy=true;
  try{
   const dir=join(process.cwd(),'assets','sticker-packs',name);
   const files=await readdir(dir,{withFileTypes:true}).catch(()=>[]);
   const choices=files.filter(f=>f.isFile()&&/^[a-zA-Z0-9_.-]+\.webp$/i.test(f.name));
   if(!choices.length)await ctx.reply('Pack original não instalado. Enviando figurinhas temáticas geradas localmente.');
   for(let i=0;i<count;i++){
    let sticker;
    if(choices.length){
     const p=join(dir,choices.splice(randomInt(choices.length),1)[0].name);
     if((await stat(p)).size<=1024*1024){const b=await readFile(p);if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')sticker=b;}
    }
    sticker??=await fallback(name);
    await ctx.sock.sendMessage(ctx.chat,{sticker},{quoted:ctx.msg});
   }
  }finally{busy=false;}
 }
}));
