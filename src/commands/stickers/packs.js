import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomInt } from 'node:crypto';
const packs=['anime','naruto','satoru','zinitsu','tonko','figurinhas'];
export const stickerPacks=packs.map(name=>({
 name,aliases:name==='zinitsu'?['zenitsu']:[],category:'Figurinhas',description:'Envia figurinha aleatória do pack '+name,
 async execute(ctx){
 const dir=join(process.cwd(),'assets','sticker-packs',name);
 const files=await readdir(dir,{withFileTypes:true}).catch(()=>[]);
 const choices=files.filter(f=>f.isFile()&&/^[a-zA-Z0-9_.-]+\.webp$/i.test(f.name));
 if(!choices.length)return ctx.reply('Pack ainda não instalado.');
 const sticker=await readFile(join(dir,choices[randomInt(choices.length)].name));
 if(sticker.length>1024*1024)return ctx.reply('Figurinha acima do limite.');
 await ctx.sock.sendMessage(ctx.chat,{sticker},{quoted:ctx.msg});
 }
}));
