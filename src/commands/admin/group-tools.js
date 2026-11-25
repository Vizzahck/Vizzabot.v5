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

groupTools.push(...['mute','desmute','mutados'].map(name=>({
 name,category:'Administração',description:'Gerencia silenciamento individual neste grupo',
 async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 const db=ctx.store.db;
 db.exec('CREATE TABLE IF NOT EXISTS group_mutes (jid TEXT NOT NULL, member TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY(jid,member))');
 db.prepare('DELETE FROM group_mutes WHERE jid=? AND expires<=?').run(ctx.chat,Date.now());
 if(name==='mutados'){
 const rows=db.prepare('SELECT member,expires FROM group_mutes WHERE jid=? ORDER BY expires LIMIT 50').all(ctx.chat);
 return ctx.reply(rows.length?rows.map(r=>r.member.split('@')[0]+' — '+Math.ceil((r.expires-Date.now())/60000)+' min').join('\n'):'Nenhum membro silenciado.');
 }
 const target=ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
 if(!target)return ctx.reply('Marque um membro.');
 if(name==='desmute'){db.prepare('DELETE FROM group_mutes WHERE jid=? AND member=?').run(ctx.chat,target);return ctx.reply('Silenciamento removido.');}
 if(!roles.botAdmin)return ctx.reply('O bot precisa ser administrador.');
 const meta=await ctx.sock.groupMetadata(ctx.chat);
 const member=meta.participants.find(p=>p.id===target);
 if(!member||member.admin||target===ctx.sender||target===ctx.sock.user?.id)return ctx.reply('Selecione um participante comum.');
 const minutes=Number(ctx.args.find(a=>/^\d+$/.test(a))||10);
 if(!Number.isInteger(minutes)||minutes<1||minutes>1440)return ctx.reply('Informe de 1 a 1440 minutos.');
 db.prepare('INSERT INTO group_mutes(jid,member,expires) VALUES (?,?,?) ON CONFLICT(jid,member) DO UPDATE SET expires=excluded.expires').run(ctx.chat,target,Date.now()+minutes*60000);
 await ctx.reply('Membro silenciado por '+minutes+' minutos.');
 }
})));

groupTools.push(...['so_adm','antilinkhard','antilink_adv'].map(name=>({
 name,category:'Administração',description:'Configura '+name+' neste grupo',
 async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 const value=ctx.args[0];if(!['on','off'].includes(value))return ctx.reply('Uso: '+name+' on/off');
 if(name!=='so_adm'&&value==='on'&&!roles.botAdmin)return ctx.reply('O bot precisa ser administrador.');
 const db=ctx.store.db;
 db.exec('CREATE TABLE IF NOT EXISTS group_modes (jid TEXT NOT NULL,mode TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(jid,mode))');
 db.prepare('INSERT INTO group_modes VALUES (?,?,?) ON CONFLICT(jid,mode) DO UPDATE SET enabled=excluded.enabled').run(ctx.chat,name,Number(value==='on'));
 await ctx.reply(name+' '+(value==='on'?'ativado':'desativado'));
 }
})));

groupTools.push(...['blockcmdgp','unblockcmdgp','listblockcmdgp'].map(name=>({
 name,category:'Administração',description:'Gerencia comandos bloqueados neste grupo',
 async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 const db=ctx.store.db;
 db.exec('CREATE TABLE IF NOT EXISTS group_blocked_commands (jid TEXT NOT NULL,command TEXT NOT NULL,PRIMARY KEY(jid,command))');
 if(name==='listblockcmdgp'){
 const rows=db.prepare('SELECT command FROM group_blocked_commands WHERE jid=? ORDER BY command').all(ctx.chat);
 return ctx.reply(rows.map(r=>r.command).join('\n')||'Nenhum comando bloqueado.');
 }
 const command=ctx.registry.get(ctx.args[0]?.toLowerCase()||'');
 if(!command||command.category==='Administração'||command.ownerOnly)return ctx.reply('Informe um comando válido que não seja administrativo ou exclusivo do dono.');
 if(name==='blockcmdgp')db.prepare('INSERT OR IGNORE INTO group_blocked_commands VALUES (?,?)').run(ctx.chat,command.name);
 else db.prepare('DELETE FROM group_blocked_commands WHERE jid=? AND command=?').run(ctx.chat,command.name);
 await ctx.reply('Configuração atualizada: '+command.name);
 }
})));

groupTools.push({name:'configgp',category:'Administração',description:'Mostra configurações administrativas do grupo',async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 const db=ctx.store.db;
 db.exec('CREATE TABLE IF NOT EXISTS group_modes (jid TEXT NOT NULL,mode TEXT NOT NULL,enabled INTEGER NOT NULL,PRIMARY KEY(jid,mode))');
 const modes=db.prepare('SELECT mode,enabled FROM group_modes WHERE jid=? ORDER BY mode').all(ctx.chat);
 const settings=ctx.store.group(ctx.chat);
 const flags=['welcome','antilink','antisticker','antiaudio','antivideo','antiimagem','antipalavra'];
 await ctx.reply('⚙️ Configurações do grupo\n'+[...flags.map(k=>k+': '+(settings[k]?'ON':'OFF')),...modes.map(r=>r.mode+': '+(r.enabled?'ON':'OFF'))].join('\n'));
}});

groupTools.push(...['atividade','inativos','rankativo','checkativo','resetatividade'].map(name=>({
 name,aliases:name==='atividade'?['atividades']:name==='rankativo'?['rankativos']:[],category:'Administração',description:'Consulta ou gerencia contadores de atividade do grupo',
 async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 const db=ctx.store.db;
 db.exec('CREATE TABLE IF NOT EXISTS group_activity (jid TEXT NOT NULL,member TEXT NOT NULL,messages INTEGER NOT NULL DEFAULT 0,commands INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(jid,member))');
 if(name==='resetatividade'){
 if(ctx.args[0]!=='confirmar')return ctx.reply('Uso: resetatividade confirmar');
 db.prepare('DELETE FROM group_activity WHERE jid=?').run(ctx.chat);return ctx.reply('Contadores zerados.');
 }
 const meta=await ctx.sock.groupMetadata(ctx.chat);
 const records=new Map(db.prepare('SELECT member,messages,commands FROM group_activity WHERE jid=?').all(ctx.chat).map(r=>[r.member,r]));
 let rows=meta.participants.map(p=>({member:p.id,messages:0,commands:0,...records.get(p.id)}));
 if(name==='checkativo'){
 const target=ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
 if(!target)return ctx.reply('Marque um membro.');
 rows=rows.filter(r=>r.member===target);
 }else if(name==='inativos')rows=rows.filter(r=>r.messages<=1);
 else if(name==='rankativo')rows=rows.filter(r=>r.messages>0).sort((a,b)=>b.messages-a.messages||b.commands-a.commands).slice(0,10);
 const page=Math.max(1,Math.min(1000,Number.parseInt(ctx.args[0],10)||1));
 const shown=rows.slice((page-1)*20,page*20);
 await ctx.reply('📊 '+name+' — página '+page+'/'+Math.max(1,Math.ceil(rows.length/20))+'\nDados desde a ativação desta versão ou último reset.\n'+(shown.map(r=>r.member.split('@')[0]+' | Mensagens: '+r.messages+' | Comandos: '+r.commands).join('\n')||'Nenhum resultado.'));
 }
})));
