import { readFile, writeFile, rename } from 'node:fs/promises';
import { downloadImage } from '../../core/media.js';
const path='owner-settings.json';
let queue=Promise.resolve();
export async function ownerState(){
 try{return JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code==='ENOENT')return {};throw e;}
}
function change(fn){
 const task=queue.then(async()=>{const s=await ownerState();fn(s);await writeFile(path+'.tmp',JSON.stringify(s,null,2),{mode:0o600});await rename(path+'.tmp',path);});
 queue=task.catch(()=>{});return task;
}
const cmd=(name,aliases,description,execute)=>({name,aliases,description,execute,ownerOnly:true,category:'Proprietário'});
const text=c=>c.args.join(' ').trim();
const target=c=>c.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
const number=c=>/^\d{10,15}$/.test(c.args[0]||'')?c.args[0]+'@s.whatsapp.net':null;
const toggle=(name,aliases,key,value)=>cmd(name,aliases,'Configura '+key,async c=>{await change(s=>{s[key]=value;});await c.reply('Configuração salva.');});
const list=(name,aliases,key)=>cmd(name,aliases,'Lista '+key,async c=>{const s=await ownerState();await c.reply((s[key]||[]).join('\n')||'Lista vazia.');});
const member=(name,key,add)=>cmd(name,[],'Gerencia '+key,async c=>{
 const id=target(c)||number(c);if(!id)return c.reply('Marque um usuário ou informe DDI e número.');
 await change(s=>{const a=new Set(s[key]||[]);add?a.add(id):a.delete(id);s[key]=[...a];});await c.reply('Lista atualizada.');
});
export const ownerRestored=[
 list('premiumlist',[],'premium'),member('addpremium','premium',true),member('delpremium','premium',false),
 list('listacomandos',[],'blockedCommands'),
 ...['blockcmd','unblockcmd'].map(name=>cmd(name,[],'Gerencia bloqueio de comandos',async c=>{
 const found=c.registry.get(c.args[0]?.toLowerCase());if(!found||found.ownerOnly)return c.reply('Escolha um comando público válido.');
 await change(s=>{const a=new Set(s.blockedCommands||[]);name==='blockcmd'?a.add(found.name):a.delete(found.name);s.blockedCommands=[...a];});await c.reply('Bloqueio atualizado.');
 })),
 member('block_user_cmd','blockedUsers',true),member('unblock_user_cmd','blockedUsers',false),
 toggle('recebmsg-on',[],'receive',true),toggle('recebmsg-off',[],'receive',false),
 toggle('set-on',[],'enabled',true),toggle('set-off',[],'enabled',false),
 toggle('antipvon',[],'privateNotice',true),toggle('antipvoff',[],'privateNotice',false),
 cmd('msg_antipv',[],'Define aviso de privado',async c=>{const t=text(c);if(!t||t.length>500)return c.reply('Informe texto de até 500 caracteres.');await change(s=>{s.privateText=t;});await c.reply('Aviso salvo.');}),
 cmd('recado',[],'Atualiza recado do perfil',async c=>{const t=text(c);if(!t||t.length>139)return c.reply('Informe até 139 caracteres.');await c.sock.updateProfileStatus(t);await c.reply('Recado atualizado.');}),
 cmd('nick-bot',[],'Atualiza nome do perfil WhatsApp',async c=>{const t=text(c);if(!t||t.length>25)return c.reply('Informe até 25 caracteres.');await c.sock.updateProfileName(t);await c.reply('Nome atualizado.');}),
 cmd('fotobot',[],'Atualiza foto do perfil do bot',async c=>{const img=await downloadImage(c.sock,c.msg,c.logger);if(!img)return c.reply('Responda a uma foto.');await c.sock.updateProfilePicture(c.sock.user.id,img.buffer);await c.reply('Foto atualizada.');}),
 cmd('donos',['donoslist'],'Lista proprietários configurados',async c=>c.reply(c.config.owners.join('\n')||'Nenhum proprietário.')),
 ...['block','unblock'].map(name=>cmd(name,[],'Gerencia bloqueio de contato',async c=>{const id=number(c);if(!id)return c.reply('Informe DDI e número.');await c.sock.updateBlockStatus(id,name);await c.reply('Contato atualizado.');})),
 cmd('entrar',[],'Entra em grupo por convite',async c=>{const m=text(c).match(/^https:\/\/chat\.whatsapp\.com\/([A-Za-z0-9_-]{15,40})$/);if(!m)return c.reply('Informe um convite válido.');await c.sock.groupAcceptInvite(m[1]);await c.reply('Convite aceito.');}),
 cmd('sairgp2',[],'Sai de um grupo pelo ID',async c=>{const id=c.args[0];if(!/^[\d-]+@g\.us$/.test(id||'')||c.args[1]!=='confirmar')return c.reply('Uso: '+c.config.prefix+'sairgp2 ID confirmar');const groups=await c.sock.groupFetchAllParticipating();if(!groups[id])return c.reply('Grupo não encontrado.');await c.sock.groupLeave(id);await c.reply('Grupo removido.');}),
 cmd('serpremium',[],'Consulta cadastro premium do proprietário',async c=>{const s=await ownerState();await c.reply((s.premium||[]).includes(c.sender)?'Premium ativo.':'Premium não cadastrado.');})
];
