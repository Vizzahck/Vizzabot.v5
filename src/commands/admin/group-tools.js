import { groupRoles } from '../../core/group.js';
const defs = [
 ['linkgp',['linkgroup'],'Mostra o link de convite do grupo','link'],
 ['grupoinfo',['infogrupo','infogp','gpinfo'],'Informações do grupo','info'],
 ['fechargp',[],'Fecha o grupo para mensagens de participantes','close'],
 ['abrirgp',[],'Abre o grupo para mensagens de participantes','open'],
 ['novolink',['redefinir'],'Revoga o link de convite anterior','revoke'],
 ['nomegp',[],'Altera o nome do grupo','subject'],
 ['descgp',['descricaogp'],'Altera a descrição do grupo','description'],
 ['promover',['promote'],'Promove participante mencionado','promote'],
 ['rebaixar',['demote'],'Rebaixa participante mencionado','demote'],
 ['tagall',['marcar'],'Menciona todos os participantes','tagall']
];
export const groupTools = defs.map(([name,aliases,description,action])=>({
 name,aliases,description,category:'Administração',
 async execute(ctx) {
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('⚠️ Este comando funciona apenas em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(action!=='info'&&action!=='link'&&!roles.admin)return ctx.reply('⛔ Somente administradores podem usar este comando.');
  if(['close','open','revoke','subject','description','promote','demote'].includes(action)&&!roles.botAdmin)return ctx.reply('⛔ O bot precisa ser administrador.');
  const meta=await ctx.sock.groupMetadata(ctx.chat);
  if(action==='info')return ctx.reply('👥 *'+meta.subject+'*\n📝 '+(meta.desc||'Sem descrição')+'\n👤 Participantes: '+meta.participants.length+'\n🆔 '+ctx.chat);
  if(action==='link'){try{const code=await ctx.sock.groupInviteCode(ctx.chat);return ctx.reply('🔗 https://chat.whatsapp.com/'+code);}catch{return ctx.reply('Não consegui obter o convite. O bot pode precisar ser administrador.');}}
  if(action==='close'||action==='open'){await ctx.sock.groupSettingUpdate(ctx.chat,action==='close'?'announcement':'not_announcement');return ctx.reply(action==='close'?'🔒 Grupo fechado.':'🔓 Grupo aberto.');}
  if(action==='revoke'){await ctx.sock.groupRevokeInvite(ctx.chat);return ctx.reply('🔁 Convite anterior revogado.');}
  if(action==='subject'||action==='description'){const value=ctx.args.join(' ').trim();if(!value)return ctx.reply('Uso: '+ctx.config.prefix+name+' novo texto');if(action==='subject'){if(value.length>100)return ctx.reply('Nome muito longo.');await ctx.sock.groupUpdateSubject(ctx.chat,value);}else{if(value.length>1024)return ctx.reply('Descrição muito longa.');await ctx.sock.groupUpdateDescription(ctx.chat,value);}return ctx.reply('✅ Grupo atualizado.');}
  if(action==='promote'||action==='demote'){const target=ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];if(!target||!meta.participants.some(p=>p.id===target))return ctx.reply('Mencione alguém que esteja no grupo.');await ctx.sock.groupParticipantsUpdate(ctx.chat,[target],action);return ctx.reply('✅ Solicitação enviada.');}
  if(action==='tagall'){if(meta.participants.length>1024)return ctx.reply('Grupo grande demais para marcar todos.');const ids=meta.participants.map(p=>p.id);await ctx.sock.sendMessage(ctx.chat,{text:'📢 *ATENÇÃO, GRUPO!*\n'+(ctx.args.join(' ')||'Chamando todos!'),mentions:ids});}
 }
}));

const extraDefs=[
 ['trancargp','Restringe edição das informações do grupo','locked'],
 ['destrancargp','Libera edição das informações do grupo','unlocked'],
 ['listadmins','Lista administradores do grupo','admins'],
 ['statusgp','Consulta configurações do grupo','status']
];
groupTools.push(...extraDefs.map(([name,description,action])=>({
 name,description,category:'Administração',
 async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 if(action==='locked'||action==='unlocked'){
 if(!roles.botAdmin)return ctx.reply('O bot precisa ser administrador.');
 await ctx.sock.groupSettingUpdate(ctx.chat,action);
 return ctx.reply('Configuração de edição atualizada.');
 }
 const meta=await ctx.sock.groupMetadata(ctx.chat);
 if(action==='admins'){
 const ids=meta.participants.filter(p=>p.admin).map(p=>p.id);
 return ctx.sock.sendMessage(ctx.chat,{text:'Administradores ('+ids.length+'):\n'+ids.map(j=>'@'+j.split('@')[0]).join('\n'),mentions:ids});
 }
 const s=ctx.store.group(ctx.chat);
 await ctx.reply(['Configurações do grupo','Mensagens: '+(meta.announce?'Administradores':'Todos'),'Edição: '+(meta.restrict?'Administradores':'Todos'),...['welcome','antilink','antisticker','antiaudio','antivideo','antiimagem','antipalavra'].map(k=>k+': '+(s[k]?'Ativo':'Inativo'))].join('\n'));
 }
})));
