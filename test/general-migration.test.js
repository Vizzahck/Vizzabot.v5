import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { restoredGeneral } from '../src/commands/general/restored-general.js';
const find=name=>restoredGeneral.find(c=>c.name===name);
test('Feedback requires confirmation and private chat',async()=>{
 const db=new DatabaseSync(':memory:');const replies=[];
 const c={chat:'123@g.us',sender:'test-user@s.whatsapp.net',args:['teste','confirmar'],config:{prefix:'!'},store:{db},reply:async text=>replies.push(text)};
 try{
  await find('bug').execute(c);
  assert.match(replies.at(-1),/privado/);
  c.chat='test-user@s.whatsapp.net';c.args=['teste'];
  await find('bug').execute(c);
  assert.match(replies.at(-1),/confirmar/);
  c.args=['teste','confirmar'];
  await find('bug').execute(c);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM general_feedback').get().n,1);
  await find('bug').execute(c);
  assert.equal(db.prepare('SELECT COUNT(*) n FROM general_feedback').get().n,1);
 }finally{db.close();}
});
test('Feedback inbox and deletion are owner commands',()=>{
 assert.equal(find('listarelatos').ownerOnly,true);
 assert.equal(find('resolverrelato').ownerOnly,true);
});
test('Invalid group invitation is not recorded',async()=>{
 const db=new DatabaseSync(':memory:');const replies=[];
 const c={chat:'test-2@s.whatsapp.net',sender:'test-2@s.whatsapp.net',args:['https://example.com','confirmar'],config:{prefix:'!'},store:{db},reply:async text=>replies.push(text)};
 try{await find('convite').execute(c);assert.match(replies.at(-1),/convite válido/);}
 finally{db.close();}
});
