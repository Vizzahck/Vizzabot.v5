import { randomInt } from 'node:crypto';
import { initAdventure } from './adventure.js';
import { groupRoles } from '../../core/group.js';

const items=Object.freeze({ouro:8,gemas:35,reliquias:60,minerio:12});
function init(db){
 initAdventure(db);
 db.exec("CREATE TABLE IF NOT EXISTS rpg_verified (jid TEXT PRIMARY KEY, verified_at INTEGER NOT NULL)");
 db.exec("CREATE TABLE IF NOT EXISTS group_modes (jid TEXT NOT NULL, mode TEXT NOT NULL, enabled INTEGER NOT NULL, PRIMARY KEY(jid,mode))");
}
function transaction(db,fn){
 init(db);
 db.exec('BEGIN IMMEDIATE');
 try{const result=fn();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}
}
function addItem(db,jid,item,quantity){
 if(quantity>0)db.prepare('INSERT INTO adventure_inventory(jid,item,quantity) VALUES (?,?,?) ON CONFLICT(jid,item) DO UPDATE SET quantity=quantity+excluded.quantity').run(jid,item,quantity);
}
function quantity(db,jid,item){return db.prepare('SELECT quantity FROM adventure_inventory WHERE jid=? AND item=?').get(jid,item)?.quantity||0;}
function consume(db,jid,item,n){return !!db.prepare('UPDATE adventure_inventory SET quantity=quantity-? WHERE jid=? AND item=? AND quantity>=?').run(n,jid,item,n).changes;}
function award(db,jid,activity,cooldown,{coins=0,xp=5,resources={}},now=Date.now()){
 return transaction(db,()=>{
  db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(jid);
  const last=db.prepare('SELECT last_used FROM adventure_cooldowns WHERE jid=? AND activity=?').get(jid,activity)?.last_used||0;
  const remaining=last?Math.max(0,cooldown-(now-last)):0;
  if(remaining)return {ok:false,remaining};
  db.prepare('INSERT INTO adventure_cooldowns(jid,activity,last_used) VALUES (?,?,?) ON CONFLICT(jid,activity) DO UPDATE SET last_used=excluded.last_used').run(jid,activity,now);
  db.prepare('UPDATE users SET coins=coins+?,xp=xp+? WHERE jid=?').run(coins,xp,jid);
  for(const [item,n] of Object.entries(resources))addItem(db,jid,item,n);
  return {ok:true,coins:db.prepare('SELECT coins FROM users WHERE jid=?').get(jid).coins};
 });
}
const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const zones={
 floresta:{label:'Floresta',resources:()=>({ouro:randomInt(5,16)}),coins:()=>randomInt(15,61)},
 caverna:{label:'Caverna',resources:()=>({gemas:randomInt(1,4),minerio:randomInt(1,6)}),coins:()=>randomInt(15,46)},
 'ruinas antigas':{label:'Ruínas antigas',resources:()=>({reliquias:1,ouro:randomInt(3,9)}),coins:()=>randomInt(30,81)},
 'portal dimensional':{label:'Portal dimensional',resources:()=>({gemas:randomInt(1,3),reliquias:1}),coins:()=>randomInt(30,101)}
};
const fmtResources=resources=>Object.entries(resources).filter(([,n])=>n>0).map(([k,n])=>'+'+n+' '+k).join(' • ');
const wait=ms=>'Aguarde '+Math.ceil(ms/60000)+' minuto(s) para tentar novamente.';
async function explore(ctx,zone){
 const area=zones[zone];if(!area)return ctx.reply('Use '+ctx.config.prefix+'explorar floresta | caverna | ruínas antigas | portal dimensional');
 const resources=area.resources(),coins=area.coins();
 const result=award(ctx.store.db,ctx.sender,'explorar',60*60000,{coins,xp:15,resources});
 return ctx.reply(result.ok?'🧭 '+area.label+'\n'+fmtResources(resources)+'\n+'+coins+' moedas • +15 XP\nSaldo: '+result.coins:wait(result.remaining));
}
const cmd=(name,description,execute,aliases=[])=>({name,aliases,category:'Economia',description,execute});
export const restoredRpg=[
 cmd('modo_rpg','Ativa ou desativa RPG no grupo (administrador)',async c=>{
  const roles=await groupRoles(c.sock,c.chat,c.sender,c.isOwner,c.isBotAdmin);
  if(!roles.group||!roles.admin)return c.reply('Somente administradores de grupos.');
  const db=c.store.db;init(db);
  const value=normal(c.args[0]);
  const current=db.prepare("SELECT enabled FROM group_modes WHERE jid=? AND mode='rpg'").get(c.chat)?.enabled??1;
  if(!['1','0','on','off'].includes(value))return c.reply('RPG '+(current?'ativo':'inativo')+'. Use '+c.config.prefix+'modo_rpg 1 ou 0.');
  const enabled=Number(value==='1'||value==='on');
  db.prepare("INSERT INTO group_modes(jid,mode,enabled) VALUES (?,'rpg',?) ON CONFLICT(jid,mode) DO UPDATE SET enabled=excluded.enabled").run(c.chat,enabled);
  await c.reply('Modo RPG '+(enabled?'ativado':'desativado')+'.');
 },['rpg']),
 cmd('ganhar-recursos','Coleta ouro e gemas uma vez a cada 24 horas',async c=>{
  const resources={ouro:randomInt(15,31),gemas:randomInt(1,4)};
  const r=award(c.store.db,c.sender,'ganhar-recursos',86400000,{coins:100,xp:15,resources});
  await c.reply(r.ok?'🎁 '+fmtResources(resources)+' • +100 moedas • +15 XP':wait(r.remaining));
 }),
 cmd('explorar','Explora floresta, caverna, ruínas ou portal',async c=>explore(c,normal(c.args.join(' ')))),
 cmd('buscar-reliquias','Explora ruínas em busca de relíquias',async c=>explore(c,'ruinas antigas'),['buscar-relíquias']),
 cmd('realizar-missao-epica','Completa missão diária de RPG sem custo',async c=>{
  const success=randomInt(2)===1,coins=success?randomInt(500,1001):0;
  const r=award(c.store.db,c.sender,'missao-epica',86400000,{coins,xp:success?30:5,resources:success?{ouro:10}:{}});
  await c.reply(!r.ok?wait(r.remaining):success?'🏰 Missão concluída! +'+coins+' moedas, +10 ouro e +30 XP.':'A missão não deu certo desta vez. Você ganhou 5 XP pela experiência. Volte amanhã.');
 },['missao-epica','missão-épica']),
 cmd('rpgperfil','Consulta seu personagem e seus recursos',async c=>{
  const db=c.store.db;init(db);
  const u=c.store.user(c.sender);
  const verified=!!db.prepare('SELECT 1 FROM rpg_verified WHERE jid=?').get(c.sender);
  await c.reply('👤 PERFIL RPG'+(verified?' • Verificado':'')+'\nMoedas: '+u.coins+'\nXP: '+u.xp+'\nNível: '+(1+Math.floor(u.xp/100))+'\n'+Object.keys(items).map(k=>k+': '+quantity(db,c.sender,k)).join('\n'));
 },['perfilrpg']),
 cmd('vender','Vende recursos do inventário por moedas virtuais',async c=>{
  const item=normal(c.args[0]),n=Number(c.args[1]||1);
  if(!Object.hasOwn(items,item)||!Number.isSafeInteger(n)||n<1||n>1000)return c.reply('Uso: '+c.config.prefix+'vender recurso quantidade\n'+Object.entries(items).map(([k,v])=>k+' — '+v+' moedas/unidade').join('\n'));
  const db=c.store.db;
  const result=transaction(db,()=>{
   db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(c.sender);
   if(!consume(db,c.sender,item,n))return false;
   db.prepare('UPDATE users SET coins=coins+? WHERE jid=?').run(items[item]*n,c.sender);
   return true;
  });
  await c.reply(result?'Venda concluída: +'+(n*items[item])+' moedas.':'Quantidade insuficiente no inventário.');
 }),
 cmd('adquirir-verificado-rpg','Adquire emblema de RPG por 200 moedas e 200 ouro',async c=>{
  if(c.args[0]!=='confirmar')return c.reply('Emblema de RPG (não é verificação do WhatsApp). Custa 200 moedas e 200 ouro. Use '+c.config.prefix+'adquirir-verificado-rpg confirmar.');
  const db=c.store.db;
  const status=transaction(db,()=>{
   db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(c.sender);
   if(db.prepare('SELECT 1 FROM rpg_verified WHERE jid=?').get(c.sender))return 'already';
   if(quantity(db,c.sender,'ouro')<200)return 'funds';
   const debit=db.prepare('UPDATE users SET coins=coins-200 WHERE jid=? AND coins>=200').run(c.sender);
   if(!debit.changes)return 'funds';
   if(!consume(db,c.sender,'ouro',200))throw Error('Falha na reserva de ouro');
   db.prepare('INSERT INTO rpg_verified(jid,verified_at) VALUES (?,?)').run(c.sender,Date.now());
   return 'ok';
  });
  await c.reply(status==='ok'?'Emblema RPG adquirido!':status==='already'?'Você já possui o emblema.':'Recursos insuficientes.');
 }),
 cmd('ranklevel','Ranking de XP e níveis do RPG',async c=>{
  const top=c.store.db.prepare('SELECT jid,xp FROM users ORDER BY xp DESC,jid ASC LIMIT 10').all();
  if(!top.length)return c.reply('Nenhum jogador registrado.');
  await c.sock.sendMessage(c.chat,{text:'🏆 RANKING DE NÍVEL\n'+top.map((u,i)=>(i+1)+'. @'+u.jid.split('@')[0]+' — Nível '+(1+Math.floor(u.xp/100))+' | '+u.xp+' XP').join('\n'),mentions:top.map(u=>u.jid)});
 },['rl'])
];
