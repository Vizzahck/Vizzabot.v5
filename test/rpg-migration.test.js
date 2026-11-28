import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initAdventure, purchaseMagicItem } from '../src/commands/rpg/adventure.js';
import { restoredRpg, rpgProfileText } from '../src/commands/rpg/restored-v4.js';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec('CREATE TABLE users (jid TEXT PRIMARY KEY, coins INTEGER NOT NULL DEFAULT 0 CHECK(coins>=0), xp INTEGER NOT NULL DEFAULT 0 CHECK(xp>=0))');
 const user=jid=>{db.prepare('INSERT OR IGNORE INTO users(jid) VALUES (?)').run(jid);return db.prepare('SELECT * FROM users WHERE jid=?').get(jid);};
 const messages=[];
 const ctx={store:{db,user},sender:'100@s.whatsapp.net',chat:'100@s.whatsapp.net',isOwner:true,args:[],config:{prefix:'!'},reply:async message=>messages.push(message)};
 initAdventure(db);user(ctx.sender);
 const command=name=>restoredRpg.find(c=>c.name===name);
 return {db,ctx,messages,command};
}
test('Magic Shop debits gold only when sufficient',()=>{
 const {db,ctx}=fixture();
 try{
  db.prepare("INSERT INTO adventure_inventory VALUES (?,'ouro',40)").run(ctx.sender);
  assert.equal(purchaseMagicItem(db,ctx.sender,'escudo',40),true);
  assert.equal(purchaseMagicItem(db,ctx.sender,'escudo',40),false);
  assert.equal(db.prepare("SELECT quantity FROM adventure_inventory WHERE jid=? AND item='ouro'").get(ctx.sender).quantity,0);
  assert.equal(db.prepare("SELECT quantity FROM adventure_inventory WHERE jid=? AND item='escudo'").get(ctx.sender).quantity,1);
 }finally{db.close();}
});
test('RPG code cannot be redeemed twice',async()=>{
 const {db,ctx,messages,command}=fixture();
 try{
  await command('criarcodigorpg').execute(ctx);
  const code=messages.at(-1).match(/[a-f0-9]{24}/)[0];
  ctx.args=[code];await command('codigorpg').execute(ctx);await command('codigorpg').execute(ctx);
  assert.equal(ctx.store.user(ctx.sender).coins,100);
  assert.equal(db.prepare("SELECT quantity FROM adventure_inventory WHERE jid=? AND item='ouro'").get(ctx.sender).quantity,200);
 }finally{db.close();}
});
test('Shield requires ownership and profile shows active state',async()=>{
 const {db,ctx,command}=fixture();
 try{
  ctx.args=['1'];await command('equipar-rpg').execute(ctx);
  assert.match(rpgProfileText(ctx),/Escudo: inativo/);
  db.prepare("INSERT INTO adventure_inventory VALUES (?,'escudo',1)").run(ctx.sender);
  await command('equipar-rpg').execute(ctx);
  assert.match(rpgProfileText(ctx),/Escudo: ativo/);
 }finally{db.close();}
});
test('Crystal cooldown is persistent',async()=>{
 const {db,ctx,command}=fixture();
 try{
  await command('coletar-cristais').execute(ctx);
  await command('coletar-cristais').execute(ctx);
  assert.equal(ctx.store.user(ctx.sender).xp,5);
 }finally{db.close();}
});
