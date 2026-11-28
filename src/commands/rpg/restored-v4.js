import { randomInt, randomBytes, createHash } from 'node:crypto';
import { initAdventure } from './adventure.js';
import { groupRoles } from '../../core/group.js';

const items=Object.freeze({ouro:8,gemas:35,reliquias:60,minerio:12,cristais:45});
function init(db){
 db.exec("CREATE TABLE IF NOT EXISTS rpg_codes (digest TEXT PRIMARY KEY, expires INTEGER NOT NULL, redeemed_by TEXT)");
 db.exec("CREATE TABLE IF NOT EXISTS rpg_challenges (chat TEXT NOT NULL, challenger TEXT NOT NULL, opponent TEXT NOT NULL, expires INTEGER NOT NULL, PRIMARY KEY(chat,opponent))");
 db.exec("CREATE TABLE IF NOT EXISTS rpg_equipped (jid TEXT PRIMARY KEY, shield INTEGER NOT NULL DEFAULT 0)");
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
 'templo esquecido':{label:'Templo esquecido',resources:()=>({cristais:randomInt(1,3),reliquias:1}),coins:()=>randomInt(25,71)},
 'portal dimensional':{label:'Portal dimensional',resources:()=>({gemas:randomInt(1,3),reliquias:1}),coins:()=>randomInt(30,101)}
};
const fmtResources=resources=>Object.entries(resources).filter(([,n])=>n>0).map(([k,n])=>'+'+n+' '+k).join(' • ');
const wait=ms=>'Aguarde '+Math.ceil(ms/60000)+' minuto(s) para tentar novamente.';
async function explore(ctx,zone){
 const area=zones[zone];if(!area)return ctx.reply('Use '+ctx.config.prefix+'explorar floresta | caverna | ruínas antigas | portal dimensional | templo esquecido');
 const resources=area.resources(),coins=area.coins();
 const result=award(ctx.store.db,ctx.sender,'explorar',60*60000,{coins,xp:15,resources});
 return ctx.reply(result.ok?'🧭 '+area.label+'\n'+fmtResources(resources)+'\n+'+coins+' moedas • +15 XP\nSaldo: '+result.coins:wait(result.remaining));
}
const cmd=(name,description,execute,aliases=[])=>({name,aliases,category:'Economia',description,execute});
export const restoredRpg=[
 cmd('coletar-cristais','Coleta cristais na caverna (40% de chance)',async c=>{
  const n=randomInt(100)<40?randomInt(1,4):0;
  const r=award(c.store.db,c.sender,'coletar-cristais',30*60000,{resources:{cristais:n}});
  await c.reply(!r.ok?wait(r.remaining):n?'💎 Você coletou '+n+' cristais preciosos.':'Nenhum cristal encontrado. Você ganhou 5 XP.');
 }),
 cmd('extrair-minerio','Extrai minério nas montanhas (50% de chance)',async c=>{
  const n=randomInt(100)<50?randomInt(1,6):0;
  const r=award(c.store.db,c.sender,'extrair-minerio',30*60000,{resources:{minerio:n}});
  await c.reply(!r.ok?wait(r.remaining):n?'⛏️ Você extraiu '+n+' unidades de minério.':'Nenhum minério encontrado. Você ganhou 5 XP.');
 }),
 cmd('investigar','Investiga o templo esquecido',async c=>explore(c,'templo esquecido')),
 cmd('encontrar','Explora o portal dimensional',async c=>explore(c,'portal dimensional')),
 cmd('caçar','Aventura contra criaturas místicas',async c=>{
  const r=award(c.store.db,c.sender,'cacada',60*60000,{coins:randomInt(30,91),xp:15,resources:{ouro:randomInt(3,11)}});
  await c.reply(r.ok?'🐉 Aventura concluída! Você ganhou ouro, moedas e 15 XP. Saldo: '+r.coins:wait(r.remaining));
 },['cacar']),
 cmd('negociar','Negocia um recurso com o comerciante virtual',async c=>{
  const item=normal(c.args[0]),n=Number(c.args[1]||1);
  if(!Object.hasOwn(items,item)||!Number.isSafeInteger(n)||n<1||n>1000)return c.reply('Use '+c.config.prefix+'negociar ouro 5. Recursos: '+Object.keys(items).join(', '));
  const price=items[item]*n;
  const ok=transaction(c.store.db,()=>{
   c.store.db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(c.sender);
   if(!consume(c.store.db,c.sender,item,n))return false;
   c.store.db.prepare('UPDATE users SET coins=coins+? WHERE jid=?').run(price,c.sender);return true;
  });
  await c.reply(ok?'Comerciante: negócio fechado! +'+price+' moedas.':'Recursos insuficientes.');
 }),
 {...cmd('criarcodigorpg','Cria código de resgate de uso único (dono)',async c=>{
  if(!c.isOwner)return c.reply('Somente o dono.');
  if(c.chat.endsWith('@g.us'))return c.reply('Crie o código no privado.');
  const db=c.store.db;init(db);
  const code=randomBytes(12).toString('hex');
  const digest=createHash('sha256').update(code).digest('hex');
  db.prepare('INSERT INTO rpg_codes(digest,expires) VALUES (?,?)').run(digest,Date.now()+7*86400000);
  await c.reply('Código RPG (uso único, válido 7 dias): '+code+'\nRecompensa: 100 moedas e 200 ouro.');
 }),ownerOnly:true},
 cmd('codigorpg','Resgata código RPG de uso único',async c=>{
  if(c.chat.endsWith('@g.us'))return c.reply('Resgate o código no privado para não expô-lo.');
  const code=String(c.args[0]||'').toLowerCase();
  if(!/^[a-f0-9]{24}$/.test(code))return c.reply('Informe um código RPG válido.');
  const digest=createHash('sha256').update(code).digest('hex'),db=c.store.db;
  const ok=transaction(db,()=>{
   const use=db.prepare('UPDATE rpg_codes SET redeemed_by=? WHERE digest=? AND redeemed_by IS NULL AND expires>?').run(c.sender,digest,Date.now());
   if(!use.changes)return false;
   db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(c.sender);
   db.prepare('UPDATE users SET coins=coins+100 WHERE jid=?').run(c.sender);
   addItem(db,c.sender,'ouro',200);return true;
  });
  await c.reply(ok?'🎁 Código resgatado! +100 moedas e +200 ouro.':'Código inválido, vencido ou já resgatado.');
 }),
 cmd('batalhar','Desafio fictício de RPG com aceitação, sem apostas',async c=>{
  if(!c.chat.endsWith('@g.us'))return c.reply('Somente em grupos.');
  const db=c.store.db;init(db);const now=Date.now();
  if(normal(c.args[0])==='aceitar'){
   const result=transaction(db,()=>{
    const match=db.prepare('SELECT * FROM rpg_challenges WHERE chat=? AND opponent=? AND expires>?').get(c.chat,c.sender,now);
    if(!match)return {error:'Nenhum desafio válido.'};
    db.prepare('DELETE FROM rpg_challenges WHERE chat=? AND opponent=?').run(c.chat,c.sender);
    for(const jid of [match.challenger,c.sender]){
     const last=db.prepare("SELECT last_used FROM adventure_cooldowns WHERE jid=? AND activity='batalhar'").get(jid)?.last_used||0;
     if(last&&now-last<60*60000)return {error:'Um dos jogadores ainda está no intervalo de uma hora.'};
    }
    const winner=randomInt(2)?match.challenger:c.sender;
    for(const jid of [match.challenger,c.sender]){
     db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(jid);
     db.prepare("INSERT INTO adventure_cooldowns(jid,activity,last_used) VALUES (?,'batalhar',?) ON CONFLICT(jid,activity) DO UPDATE SET last_used=excluded.last_used").run(jid,now);
     db.prepare('UPDATE users SET xp=xp+? WHERE jid=?').run(jid===winner?15:5,jid);
    }
    db.prepare('UPDATE users SET coins=coins+50 WHERE jid=?').run(winner);
    addItem(db,winner,'ouro',50);return {winner};
   });
   if(result.error)return c.reply(result.error);
   return c.sock.sendMessage(c.chat,{text:'🏆 Duelo RPG concluído! @'+result.winner.split('@')[0]+' ganhou 50 moedas, 50 ouro e 15 XP. O outro jogador ganhou 5 XP.',mentions:[result.winner]});
  }
  const target=c.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if(!target||target===c.sender)return c.reply('Use '+c.config.prefix+'batalhar @jogador. O jogador precisa aceitar.');
  const group=await c.sock.groupMetadata(c.chat);
  const norm=j=>String(j||'').replace(/:\d+(?=@)/,'');
  const other=group.participants.find(p=>[p.id,p.lid,p.phoneNumber].some(j=>norm(j)===norm(target)));
  const self=group.participants.find(p=>[p.id,p.lid,p.phoneNumber].some(j=>norm(j)===norm(c.sender)));
  if(!other||other===self)return c.reply('Escolha outro membro do grupo.');
  const opponent=other.id;
  db.prepare('DELETE FROM rpg_challenges WHERE expires<=?').run(now);
  const pending=db.prepare('SELECT 1 FROM rpg_challenges WHERE chat=? AND (challenger=? OR opponent=? OR challenger=? OR opponent=?)').get(c.chat,c.sender,c.sender,opponent,opponent);
  if(pending)return c.reply('Já existe um desafio pendente. Ele expira em dois minutos.');
  db.prepare('INSERT INTO rpg_challenges(chat,challenger,opponent,expires) VALUES (?,?,?,?)').run(c.chat,c.sender,opponent,now+120000);
  await c.sock.sendMessage(c.chat,{text:'⚔️ @'+opponent.split('@')[0]+', você recebeu um desafio RPG. Use '+c.config.prefix+'batalhar aceitar em até 2 minutos.',mentions:[opponent]});
 },['iniciar-batalha']),

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
