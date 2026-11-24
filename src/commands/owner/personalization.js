import { ownerState, change } from './restored.js';
import { downloadImage } from '../../core/media.js';
import { mkdir, writeFile, rename, unlink } from 'node:fs/promises';
export const isPremium=(settings,jid)=>!!jid&&(settings.premium||[]).includes(jid.replace(/:\d+(?=@)/,''));
const owner=(name,description,execute)=>({name,description,execute,ownerOnly:true,category:'Proprietário'});
const setting=(name,key,max)=>owner(name,'Personaliza '+key,async c=>{
 const value=c.args.join(' ').trim();if(!value||value.length>max)return c.reply('Informe texto de até '+max+' caracteres ou reset.');
 await change(s=>{if(value==='reset')delete s[key];else s[key]=value;});await c.reply('Personalização salva.');
});
export const personalization=[
 setting('setmenutitulo','menuTitle',80),setting('setmenurodape','menuFooter',120),setting('setbemvindo','welcomeText',500),
 owner('setmenufoto','Altera imagem dos menus',async c=>{
 const img=await downloadImage(c.sock,c.msg,c.logger);if(!img)return c.reply('Responda a uma imagem.');
 const {default:sharp}=await import('sharp');const data=await sharp(img.buffer,{limitInputPixels:20000000}).rotate().resize({width:1000,withoutEnlargement:true}).jpeg({quality:80}).toBuffer();
 await mkdir('data',{recursive:true});await writeFile('data/menu-custom.jpg.tmp',data,{mode:0o600});await rename('data/menu-custom.jpg.tmp','data/menu-custom.jpg');await change(s=>{s.customMenuImage=true;});await c.reply('Imagem salva.');
 }),
 owner('resetmenufoto','Restaura imagem original',async c=>{await change(s=>{delete s.customMenuImage;});await c.reply('Imagem original restaurada.');}),
 owner('premiumbonus','Define multiplicador diário premium de 1 a 3',async c=>{const n=Number(c.args[0]);if(!Number.isInteger(n)||n<1||n>3)return c.reply('Informe 1, 2 ou 3.');await change(s=>{s.premiumBonus=n;});await c.reply('Bônus atualizado.');}),
 {name:'serpremium',category:'Premium',description:'Consulta seu premium e benefícios',async execute(c){const s=await ownerState();await c.reply(isPremium(s,c.sender)?'⭐ Premium ativo. Recompensa diária: '+(s.premiumBonus||2)+'x.':'Premium inativo. Consulte o proprietário.');}}
];
