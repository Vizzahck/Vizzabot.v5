import { groupRoles } from '../../core/group.js';

export function normalizeBlockedWord(word) {
 return String(word||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').trim();
}
export function ensureWordTable(db) {
 db.exec('CREATE TABLE IF NOT EXISTS group_blocked_words (group_jid TEXT NOT NULL, word TEXT NOT NULL, PRIMARY KEY(group_jid,word))');
}
export function blockedWords(db,chat){
 ensureWordTable(db);
 return db.prepare('SELECT word FROM group_blocked_words WHERE group_jid=? ORDER BY word').all(chat).map(r=>r.word);
}
export function matchesBlockedWord(text,words){
 const content=normalizeBlockedWord(text);
 return words.find(word=>{
  const escaped=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('(^|[^\\p{L}\\p{N}])'+escaped+'(?=$|[^\\p{L}\\p{N}])','u').test(content);
 })||null;
}
export const wordFilterCommands=[
 {name:'antipalavra',aliases:['antipalavrao'],category:'Administração',description:'Liga ou desliga filtro de palavras cadastradas',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(!roles.admin)return ctx.reply('⛔ Somente administradores.');
  const value=ctx.args[0]?.toLowerCase();
  if(!['on','off'].includes(value))return ctx.reply('Uso: '+ctx.config.prefix+'antipalavra on/off');
  if(value==='on'&&!roles.botAdmin)return ctx.reply('⛔ O bot precisa ser administrador para remover mensagens.');
  ctx.store.setGroup(ctx.chat,'antipalavra',value==='on');
  await ctx.reply('🛡️ Filtro de palavras '+(value==='on'?'ativado':'desativado')+'.');
 }},
 {name:'addpalavra',aliases:['addword'],category:'Administração',description:'Adiciona palavra ao filtro do grupo',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(!roles.admin)return ctx.reply('⛔ Somente administradores.');
  const word=normalizeBlockedWord(ctx.args.join(' '));
  if(!word||word.length>40||!/^[-\p{L}\p{N} ]+$/u.test(word))return ctx.reply('Uso: '+ctx.config.prefix+'addpalavra palavra (até 40 caracteres)');
  const db=ctx.store.db;ensureWordTable(db);
  if(blockedWords(db,ctx.chat).length>=100)return ctx.reply('Limite de 100 palavras atingido.');
  db.prepare('INSERT OR IGNORE INTO group_blocked_words(group_jid,word) VALUES (?,?)').run(ctx.chat,word);
  await ctx.reply('✅ Palavra adicionada ao filtro.');
 }},
 {name:'delpalavra',aliases:['removerpalavra'],category:'Administração',description:'Remove palavra do filtro do grupo',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(!roles.admin)return ctx.reply('⛔ Somente administradores.');
  const word=normalizeBlockedWord(ctx.args.join(' '));
  if(!word)return ctx.reply('Uso: '+ctx.config.prefix+'delpalavra palavra');
  ensureWordTable(ctx.store.db);
  const result=ctx.store.db.prepare('DELETE FROM group_blocked_words WHERE group_jid=? AND word=?').run(ctx.chat,word);
  await ctx.reply(result.changes?'🗑️ Palavra removida.':'Palavra não encontrada.');
 }},
 {name:'listapalavras',aliases:['palavrasbloqueadas','listapalavra','listapalavrao','listapalavrão','listpalavra'],category:'Administração',description:'Lista palavras bloqueadas no grupo',async execute(ctx){
  if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
  const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
  if(!roles.admin)return ctx.reply('⛔ Somente administradores.');
  const words=blockedWords(ctx.store.db,ctx.chat);
  await ctx.reply('🛡️ *PALAVRAS BLOQUEADAS*\n'+(words.length?words.map((w,i)=>(i+1)+'. '+w).join('\n'):'Nenhuma palavra cadastrada.'));
 }}
];

wordFilterCommands.push({name:'limparpalavras',category:'Administração',description:'Limpa filtro de palavras deste grupo',async execute(ctx){
 if(!ctx.chat.endsWith('@g.us'))return ctx.reply('Somente em grupos.');
 const roles=await groupRoles(ctx.sock,ctx.chat,ctx.sender,ctx.isOwner,ctx.isBotAdmin);
 if(!roles.admin)return ctx.reply('Somente administradores.');
 if(ctx.args[0]!=='confirmar')return ctx.reply('Use limparpalavras confirmar.');
 ensureWordTable(ctx.store.db);
 const r=ctx.store.db.prepare('DELETE FROM group_blocked_words WHERE group_jid=?').run(ctx.chat);
 await ctx.reply('Palavras removidas: '+r.changes);
}});
