import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/database/index.js';
import { initAdventure, adventureReward, purchaseItem, adventureCommands } from '../src/commands/rpg/adventure.js';

test('RPG registers five commands with distinct names',()=>{
 assert.deepEqual(adventureCommands.map(c=>c.name),['pescar','tesouro','loja','comprar','inventario']);
});
test('RPG cooldown and inventory persist in SQLite',()=>{
 const store=openDatabase(':memory:');
 try{
  initAdventure(store.db);
  const first=adventureReward(store.db,'a@s.whatsapp.net','pescar',1000000,1200000,50,'peixe:Tilápia');
  assert.equal(first.ok,true);
  assert.equal(first.coins,50);
  const repeat=adventureReward(store.db,'a@s.whatsapp.net','pescar',1000001,1200000,50,'peixe:Tilápia');
  assert.equal(repeat.ok,false);
  assert.equal(repeat.remaining,1199999);
  const again=adventureReward(store.db,'a@s.whatsapp.net','pescar',2200000,1200000,50,'peixe:Tilápia');
  assert.equal(again.ok,true);
  assert.equal(store.db.prepare('SELECT quantity FROM adventure_inventory WHERE jid=? AND item=?').get('a@s.whatsapp.net','peixe:Tilápia').quantity,2);
 }finally{store.close();}
});
test('RPG purchase is atomic and prevents negative balances',()=>{
 const store=openDatabase(':memory:');
 try{
  assert.equal(purchaseItem(store.db,'buyer','vara',200),false);
  adventureReward(store.db,'buyer','tesouro',1000000,1,250,'tesouro');
  assert.equal(purchaseItem(store.db,'buyer','vara',200),true);
  assert.equal(purchaseItem(store.db,'buyer','vara',200),false);
  assert.equal(store.user('buyer').coins,50);
 }finally{store.close();}
});
