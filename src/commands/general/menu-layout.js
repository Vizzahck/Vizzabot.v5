import { ownerState } from '../owner/restored.js';
import { readFile } from 'node:fs/promises';
export const MENU_IMAGE = 'https://telegra.ph/file/cc8a2fd436377132c9b96.jpg';
export const CATEGORY_ICONS={Geral:'🌐',Administração:'🛡️',Figurinhas:'🎨',Economia:'💎',Proprietário:'👑',Brincadeiras:'🎲',Menus:'📚',Ferramentas:'🧰',Jogos:'🎮',Downloads:'📥','Pesquisa e Downloads':'🔎',Logos:'🖼️',Premium:'⭐'};
export function menuText(ctx,{category=null,title='CENTRAL DE COMANDOS'}={}){
 const sharedPremium=new Set(['ddd','clima','qrcode','getquoted','extrairtexto','ping','gitclone']);
 const cmds=ctx.registry.list().filter(c=>(!c.ownerOnly||ctx.isOwner)&&(category?(c.category===category||(category==='Premium'&&sharedPremium.has(c.name))):['Geral','Menus'].includes(c.category)));
 const showAliases=category==='Pesquisa e Downloads'||category==='Proprietário';
 const count=cmds.reduce((n,c)=>n+1+(showAliases?(c.aliases||[]).length:0),0);
 const groups=new Map();
 for(const cmd of cmds){const key=cmd.category||'Geral';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(cmd);}
 const p=ctx.config.prefix;
 const lines=['╭━━━〔 ✦ V I Z Z A B O T ✦ 〕━━━╮','┃ '+(CATEGORY_ICONS[category]||'⚡')+' *'+title+'*','┣━━━━━━━━━━━━━━━━━━━━━━','┃ 🤖 '+ctx.config.name,'┃ 👑 '+(ctx.config.ownerName||'Proprietário'),'┃ ⌨️ Prefixo: '+p,'┃ 📚 Comandos: '+count,'╰━━━━━━━━━━━━━━━━━━━━━━╯'];
 if(!cmds.length)lines.push('⏳ Nenhuma função disponível nesta categoria.');
 if(!category && ctx.registry.get('menu'))lines.push('','🧰 Ferramentas: '+p+'menu ferramentas');
 for(const [name,list] of groups){lines.push('','╭━━〔 '+(CATEGORY_ICONS[name]||'📁')+' *'+name.toUpperCase()+'* 〕━━╮');for(const cmd of list){lines.push('┃ ✧ '+p+cmd.name);if(showAliases)for(const alias of cmd.aliases||[])lines.push('┃ ✧ '+p+alias);}lines.push('╰━━━━━━━━━━━━━━━━━━━━━━╯');}
 lines.push('','🔎 Detalhes: *'+p+'infocmd nome_do_comando*','','✦ *VIZZABOT V5* ✦');
 return lines.join('\n');
}
export async function sendMenu(ctx,options={}){
 const settings=await ownerState();
 if(settings.menuLoading)await ctx.reply('⏳ Carregando menu...');
 const caption=menuText(ctx,options).replace('✦ V I Z Z A B O T ✦',()=>settings.menuTitle||'✦ V I Z Z A B O T ✦').replace('✦ *VIZZABOT V5* ✦',()=>settings.menuFooter||'✦ *VIZZABOT V5* ✦');
 if(settings.menuTextOnly)return ctx.reply(caption);
 const url=process.env.MENU_LOGO_URL?.trim()||MENU_IMAGE;
 try{
  const opts=ctx.msg.key?.fromMe&&!ctx.chat.endsWith('@g.us')?undefined:{quoted:ctx.msg};
  await ctx.sock.sendMessage(ctx.chat,{image:settings.customMenuImage?await readFile('data/menu-custom.jpg'):{url},caption},opts);
 }catch(error){ctx.logger?.warn?.({err:error},'Imagem do menu indisponível');await ctx.reply(caption);}
}
