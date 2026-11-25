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

groupTools.push(...[
 ['fotogp','Altera foto do grupo'],
 ['legendabvgrupo','Define boas-vindas específicas do grupo'],
 ['legendasaidagrupo','Define despedida específica do grupo']
].map(([name,description])=>({name,description,category:'Administração',async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 if(name==='fotogp'){
 if(!roles.botAdmin)return ctx.reply('O bot precisa ser administrador.');
 const {downloadImage}=await import('../../core/media.js');
 const img=await downloadImage(ctx.sock,ctx.msg,ctx.logger);
 if(!img)return ctx.reply('Responda a uma imagem.');
 const {default:sharp}=await import('sharp');
 const buffer=await sharp(img.buffer,{limitInputPixels:20000000}).rotate().resize(640,640,{fit:'cover'}).jpeg().toBuffer();
 await ctx.sock.updateProfilePicture(ctx.chat,buffer);return ctx.reply('Foto do grupo atualizada.');
 }
 const value=ctx.args.join(' ').trim();
 if(!value||value.length>1000)return ctx.reply('Informe o texto (até 1000 caracteres) ou reset.');
 const key=name==='legendabvgrupo'?'welcome':'farewell';
 const db=ctx.store.db;
 db.exec('CREATE TABLE IF NOT EXISTS group_greetings (jid TEXT NOT NULL,kind TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(jid,kind))');
 if(value==='reset')db.prepare('DELETE FROM group_greetings WHERE jid=? AND kind=?').run(ctx.chat,key);
 else db.prepare('INSERT INTO group_greetings(jid,kind,body) VALUES (?,?,?) ON CONFLICT(jid,kind) DO UPDATE SET body=excluded.body').run(ctx.chat,key,value);
 await ctx.reply('Mensagem do grupo atualizada.');
}})));

groupTools.push(...['grupo','idgp','admins','enquete','msgtemporaria'].map(name=>({
 name,category:'Administração',description:({grupo:'Abre ou fecha grupo',idgp:'Mostra ID do grupo',admins:'Menciona administradores',enquete:'Cria enquete nativa',msgtemporaria:'Configura mensagens temporárias'})[name],
 async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 if(name==='idgp')return ctx.reply(ctx.chat);
 if(name==='admins'){
 const ids=(await ctx.sock.groupMetadata(ctx.chat)).participants.filter(p=>p.admin).map(p=>p.id);
 return ctx.sock.sendMessage(ctx.chat,{text:'Administradores:\n'+ids.map(j=>'@'+j.split('@')[0]).join('\n'),mentions:ids});
 }
 if(name==='enquete'){
 const [title,...values]=ctx.args.join(' ').split('|').map(s=>s.trim());
 if(!title||title.length>200||values.length<2||values.length>12||values.some(v=>!v||v.length>100)||new Set(values).size!==values.length)return ctx.reply('Uso: enquete Pergunta | Opção 1 | Opção 2');
 return ctx.sock.sendMessage(ctx.chat,{poll:{name:title,values,selectableCount:1}});
 }
 if(!roles.botAdmin)return ctx.reply('O bot precisa ser administrador.');
 if(name==='grupo'){
 if(!['a','f'].includes(ctx.args[0]))return ctx.reply('Uso: grupo a (abrir) ou grupo f (fechar)');
 await ctx.sock.groupSettingUpdate(ctx.chat,ctx.args[0]==='a'?'not_announcement':'announcement');
 }else{
 const days=ctx.args[0];if(!['0','1','7','90'].includes(days)||ctx.args[1]!=='confirmar')return ctx.reply('Uso: msgtemporaria 0|1|7|90 confirmar (dias). Mensagens futuras podem desaparecer.');
 await ctx.sock.groupToggleEphemeral(ctx.chat,Number(days)*86400);
 }
 await ctx.reply('Configuração atualizada.');
 }
})));
