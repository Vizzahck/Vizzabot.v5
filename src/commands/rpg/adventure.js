// RPG gratuito, persistido no SQLite local, sem APIs externas.
const fish=[['Sardinha',15,55],['Tilápia',25,35],['Dourado',65,9],['Peixe lendário',180,1]];
const goods=[['vara',200,'Vara reforçada'],['bau',350,'Baú decorativo'],['coroa',1000,'Coroa do aventureiro']];
const pick=(arr,random=Math.random)=>{const total=arr.reduce((n,x)=>n+x[2],0);let roll=random()*total;return arr.find(x=>(roll-=x[2])<0)||arr.at(-1);};
export function initAdventure(db){
 db.exec(`CREATE TABLE IF NOT EXISTS adventure_cooldowns (jid TEXT NOT NULL, activity TEXT NOT NULL, last_used INTEGER NOT NULL, PRIMARY KEY(jid,activity));
 CREATE TABLE IF NOT EXISTS adventure_inventory (jid TEXT NOT NULL, item TEXT NOT NULL, quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity>=0), PRIMARY KEY(jid,item));`);
}
export function adventureReward(db,jid,activity,now,delay,reward,item){
 initAdventure(db);
 db.exec('BEGIN IMMEDIATE');
 try{
  db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(jid);
  const last=db.prepare('SELECT last_used FROM adventure_cooldowns WHERE jid=? AND activity=?').get(jid,activity)?.last_used||0;
  const remaining=last?Math.max(0,delay-(now-last)):0;
  if(remaining){db.exec('COMMIT');return {ok:false,remaining};}
  db.prepare('INSERT INTO adventure_cooldowns(jid,activity,last_used) VALUES (?,?,?) ON CONFLICT(jid,activity) DO UPDATE SET last_used=excluded.last_used').run(jid,activity,now);
  db.prepare('UPDATE users SET coins=coins+?,xp=xp+5 WHERE jid=?').run(reward,jid);
  if(item)db.prepare('INSERT INTO adventure_inventory(jid,item,quantity) VALUES (?,?,1) ON CONFLICT(jid,item) DO UPDATE SET quantity=quantity+1').run(jid,item);
  const coins=db.prepare('SELECT coins FROM users WHERE jid=?').get(jid).coins;
  db.exec('COMMIT');return {ok:true,coins};
 }catch(err){db.exec('ROLLBACK');throw err;}
}
export function purchaseItem(db,jid,item,price){
 initAdventure(db);
 db.exec('BEGIN IMMEDIATE');
 try{
  db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(jid);
  const debit=db.prepare('UPDATE users SET coins=coins-? WHERE jid=? AND coins>=?').run(price,jid,price);
  if(!debit.changes){db.exec('COMMIT');return false;}
  db.prepare('INSERT INTO adventure_inventory(jid,item,quantity) VALUES (?,?,1) ON CONFLICT(jid,item) DO UPDATE SET quantity=quantity+1').run(jid,item);
  db.exec('COMMIT');return true;
 }catch(err){db.exec('ROLLBACK');throw err;}
}
export const adventureCommands=[
 {name:'pescar',aliases:['pesca'],category:'Economia',description:'Pesca peixes e recebe moedas (20 min)',async execute(ctx){
  const caught=pick(fish);
  const r=adventureReward(ctx.store.db,ctx.sender,'pescar',Date.now(),20*60*1000,caught[1],'peixe:'+caught[0]);
  if(!r.ok)return ctx.reply('🎣 Espere '+Math.ceil(r.remaining/60000)+' minuto(s) para pescar novamente.');
  await ctx.reply('🎣 Você pescou *'+caught[0]+'*!\n🪙 +'+caught[1]+' moedas\n💰 Saldo: '+r.coins);
 }},
 {name:'tesouro',aliases:['cavartesouro','cavar'],category:'Economia',description:'Procura tesouro a cada 45 minutos',async execute(ctx){
  const reward=20+Math.floor(Math.random()*131);
  const r=adventureReward(ctx.store.db,ctx.sender,'tesouro',Date.now(),45*60*1000,reward,'tesouro');
  if(!r.ok)return ctx.reply('🗝️ Espere '+Math.ceil(r.remaining/60000)+' minuto(s) para procurar novamente.');
  await ctx.reply('🏴‍☠️ Você encontrou um tesouro!\n🪙 +'+reward+' moedas\n💰 Saldo: '+r.coins);
 }},
 {name:'loja',aliases:['lojinha'],category:'Economia',description:'Mostra itens disponíveis para compra',async execute(ctx){
  await ctx.reply('🏪 *LOJA DO VIZZABOT*\n'+goods.map(([id,price,label])=>'• *'+id+'* — '+label+' — '+price+' moedas').join('\n')+'\n\nUse '+ctx.config.prefix+'comprar nome_do_item');
 }},
 {name:'comprar',aliases:['buy'],category:'Economia',description:'Compra item da loja usando moedas',async execute(ctx){
  const item=ctx.args[0]?.toLowerCase();const product=goods.find(x=>x[0]===item);
  if(!product)return ctx.reply('Uso: '+ctx.config.prefix+'comprar vara | bau | coroa');
  const ok=purchaseItem(ctx.store.db,ctx.sender,product[0],product[1]);
  await ctx.reply(ok?'🛍️ Você comprou *'+product[2]+'*!':'💸 Saldo insuficiente.');
 }},
 {name:'inventario',aliases:['inv','mochila'],category:'Economia',description:'Mostra peixes, tesouros e itens comprados',async execute(ctx){
  initAdventure(ctx.store.db);
  const items=ctx.store.db.prepare('SELECT item,quantity FROM adventure_inventory WHERE jid=? AND quantity>0 ORDER BY item LIMIT 40').all(ctx.sender);
  await ctx.reply('🎒 *INVENTÁRIO*\n'+(items.length?items.map(x=>'• '+x.item+' ×'+x.quantity).join('\n'):'Seu inventário está vazio.'));
 }}
];
