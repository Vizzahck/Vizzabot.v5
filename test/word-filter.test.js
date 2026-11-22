import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/database/index.js';
import { normalizeBlockedWord, blockedWords, matchesBlockedWord, wordFilterCommands } from '../src/commands/admin/word-filter.js';
import { moderateMessage } from '../src/core/moderation.js';

test('blocked word list persists and normalizes accents',()=>{
 const store=openDatabase(':memory:');
 try{
  store.setGroup('a@g.us','antipalavra',true);
  store.db.exec("CREATE TABLE IF NOT EXISTS group_blocked_words (group_jid TEXT NOT NULL, word TEXT NOT NULL, PRIMARY KEY(group_jid,word))");
  store.db.prepare('INSERT INTO group_blocked_words(group_jid,word) VALUES (?,?)').run('a@g.us',normalizeBlockedWord('Péssimo'));
  assert.deepEqual(blockedWords(store.db,'a@g.us'),['pessimo']);
  assert.equal(matchesBlockedWord('Isso é péssimo!',blockedWords(store.db,'a@g.us')),'pessimo');
  assert.equal(matchesBlockedWord('impessimo',blockedWords(store.db,'a@g.us')),null);
 }finally{store.close();}
});
test('word filter moderation deletes messages from ordinary members',async()=>{
 const store=openDatabase(':memory:');
 const sent=[];
 const sock={user:{id:'bot@s.whatsapp.net'},groupMetadata:async()=>({participants:[{id:'bot@s.whatsapp.net',admin:'admin'},{id:'member@s.whatsapp.net'}]}),sendMessage:async(_,payload)=>sent.push(payload)};
 try{
  store.setGroup('g@g.us','antipalavra',true);
  store.db.exec("CREATE TABLE IF NOT EXISTS group_blocked_words (group_jid TEXT NOT NULL, word TEXT NOT NULL, PRIMARY KEY(group_jid,word))");
  store.db.prepare('INSERT INTO group_blocked_words(group_jid,word) VALUES (?,?)').run('g@g.us','teste');
  const removed=await moderateMessage(sock,{key:{remoteJid:'g@g.us',participant:'member@s.whatsapp.net',id:'1'},message:{conversation:'Isto é um teste!'}},store,{warn:()=>{}},{owners:[],botAdmins:[]});
  assert.equal(removed,true);
  assert.equal(sent.length,2);
 }finally{store.close();}
});
test('four commands are registered for word filtering',()=>assert.equal(wordFilterCommands.length,4));
