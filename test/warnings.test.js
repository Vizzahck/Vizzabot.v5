import test from 'node:test';
import assert from 'node:assert/strict';
import { warningCommands } from '../src/commands/admin/warnings.js';

function context(args, target, store) {
 const replies=[];
 return {
  replies,
  ctx:{
   chat:'123@g.us',sender:'admin@s.whatsapp.net',isOwner:true,isBotAdmin:true,
   config:{prefix:'!'},args,store,
   msg:{message:{extendedTextMessage:{contextInfo:{mentionedJid:target?[target]:[]}}}},
   sock:{groupMetadata:async()=>({participants:[{id:'admin@s.whatsapp.net',admin:'admin'}]})},
   reply:async text=>{replies.push(text);}
  }
 };
}
test('warn requires a mention', async()=>{
 const {ctx,replies}=context([],null,{warn:()=>{throw Error('should not call');}});
 await warningCommands[0].execute(ctx);
 assert.match(replies[0],/Uso:/);
});
test('warn rejects self warnings', async()=>{
 const {ctx,replies}=context([],'admin@s.whatsapp.net',{warn:()=>{throw Error('should not call');}});
 await warningCommands[0].execute(ctx);
 assert.match(replies[0],/si mesmo/);
});
test('warn records a warning for a mentioned user', async()=>{
 let called=0;
 const {ctx,replies}=context([],'member@s.whatsapp.net',{warn:(group,user)=>{called++;assert.equal(group,'123@g.us');assert.equal(user,'member@s.whatsapp.net');return 2;}});
 await warningCommands[0].execute(ctx);
 assert.equal(called,1);
 assert.match(replies[0],/2/);
});
test('warnings query uses existing database method', async()=>{
 const {ctx,replies}=context([],'member@s.whatsapp.net',{warnings:()=>3});
 await warningCommands[1].execute(ctx);
 assert.match(replies[0],/3/);
});
