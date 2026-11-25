import { ownerState } from '../owner/restored.js';
import sharp from 'sharp';
export const premiumSigns = ['plaq','plaq2','plaq3','plaq4','plaq5'].map((name,i)=>({
 name,category:'Premium',description:'Cria placa de texto local',
 async execute(ctx){
 const s=await ownerState();
 if(!ctx.isOwner&&!(s.premium||[]).includes(ctx.sender))return ctx.reply('Exclusivo para Premium.');
 const t=ctx.args.join(' ').trim();
 if(!t||Array.from(t).length>15)return ctx.reply('Informe até 15 caracteres.');
 const safe=t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const bg=['#172554','#14532d','#581c87','#7c2d12','#334155'][i];
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="'+bg+'"/><text x="400" y="220" text-anchor="middle" font-family="sans-serif" font-size="48" fill="white">'+safe+'</text></svg>';
 await ctx.sock.sendMessage(ctx.chat,{image:await sharp(Buffer.from(svg)).png().toBuffer()});
 }
}));
