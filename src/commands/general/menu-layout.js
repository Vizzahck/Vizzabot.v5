import { ownerState } from '../owner/restored.js';
import { readFile } from 'node:fs/promises';
export const MENU_IMAGE = 'https://telegra.ph/file/cc8a2fd436377132c9b96.jpg';
export const CATEGORY_ICONS={Geral:'🌐',Administração:'🛡️',Figurinhas:'🎨',Economia:'💎',Proprietário:'👑',Brincadeiras:'🎲',Menus:'📚',Ferramentas:'🧰',Jogos:'🎮',Downloads:'📥','Pesquisa e Downloads':'🔎',Logos:'🖼️',Premium:'⭐'};
export function menuText(ctx,{category=null,title='CENTRAL DE COMANDOS'}={}){
 const cmds=ctx.registry.list().filter(c=>(!c.ownerOnly||ctx.isOwner)&&(!category||c.category===category));
 const groups=new Map();
 for(const cmd of cmds){const key=cmd.category||'Geral';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(cmd);}
 const p=ctx.config.prefix;
 const lines=['╭━━━〔 ✦ V I Z Z A B O T ✦ 〕━━━╮','┃ '+(CATEGORY_ICONS[category]||'⚡')+' *'+title+'*','┣━━━━━━━━━━━━━━━━━━━━━━','┃ 🤖 '+ctx.config.name,'┃ 👑 '+(ctx.config.ownerName||'Proprietário'),'┃ ⌨️ Prefixo: '+p,'┃ 📚 Comandos: '+cmds.length,'╰━━━━━━━━━━━━━━━━━━━━━━╯'];
 if(!cmds.length)lines.push('⏳ Nenhuma função disponível nesta categoria.');
 for(const [name,list] of groups){lines.push('','╭━━〔 '+(CATEGORY_ICONS[name]||'📁')+' *'+name.toUpperCase()+'* 〕━━╮');for(const cmd of list)lines.push('┃ ✧ '+p+cmd.name+((category==='Pesquisa e Downloads'||category==='Proprietário')&&cmd.aliases?.length?' ('+cmd.aliases.map(a=>p+a).join(', ')+')':''));lines.push('╰━━━━━━━━━━━━━━━━━━━━━━╯');}
 lines.push('','🔎 Detalhes: *'+p+'infocmd nome_do_comando*','','✦ *VIZZABOT V5* ✦');
 return lines.join('\n');
}
export async function sendMenu(ctx,options={}){
 const settings=await ownerState();
 const caption=menuText(ctx,options).replace('✦ V I Z Z A B O T ✦',()=>settings.menuTitle||'✦ V I Z Z A B O T ✦').replace('✦ *VIZZABOT V5* ✦',()=>settings.menuFooter||'✦ *VIZZABOT V5* ✦');
 const url=process.env.MENU_LOGO_URL?.trim()||MENU_IMAGE;
 try{
  const opts=ctx.msg.key?.fromMe&&!ctx.chat.endsWith('@g.us')?undefined:{quoted:ctx.msg};
  await ctx.sock.sendMessage(ctx.chat,{image:settings.customMenuImage?await readFile('data/menu-custom.jpg'):{url},caption},opts);
 }catch(error){ctx.logger?.warn?.({err:error},'Imagem do menu indisponível');await ctx.reply(caption);}
}
