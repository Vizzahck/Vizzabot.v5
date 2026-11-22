import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase } from '../src/database/index.js';
import { activeMediaFilter, moderateMessage } from '../src/core/moderation.js';
import { mediaFilterCommands } from '../src/commands/admin/media-filters.js';

test('four media filters are registered',()=>{
 assert.deepEqual(mediaFilterCommands.map(c=>c.name),['antisticker','antiaudio','antivideo','antiimagem']);
});
test('media filter settings persist in database',()=>{
 const store=openDatabase(':memory:');
 try{
  store.setGroup('a@g.us','antisticker',true);
  assert.equal(store.group('a@g.us').antisticker,1);
  assert.equal(store.group('a@g.us').antiaudio,0);
  store.setGroup('a@g.us','antisticker',false);
  assert.equal(store.group('a@g.us').antisticker,0);
 }finally{store.close();}
});
test('media filter recognizes ephemeral wrappers',()=>{
 assert.equal(activeMediaFilter({ephemeralMessage:{message:{audioMessage:{}}}},{antiaudio:1}),'antiaudio');
 assert.equal(activeMediaFilter({videoMessage:{}},{antivideo:0}),null);
});
test('media moderation deletes prohibited sticker and records warning',async()=>{
 const store=openDatabase(':memory:');
 const sent=[];
 const sock={user:{id:'bot@s.whatsapp.net'},groupMetadata:async()=>({participants:[{id:'bot@s.whatsapp.net',admin:'admin'},{id:'person@s.whatsapp.net'}]}),sendMessage:async(chat,payload)=>sent.push(payload)};
 try{
  store.setGroup('group@g.us','antisticker',true);
  const result=await moderateMessage(sock,{key:{remoteJid:'group@g.us',participant:'person@s.whatsapp.net',id:'1'},message:{stickerMessage:{}}},store,{warn:()=>{}},{botAdmins:[],owners:[]});
  assert.equal(result,true);
  assert.equal(sent.length,2);
  assert.equal(store.warnings('group@g.us','person@s.whatsapp.net'),1);
 }finally{store.close();}
});
