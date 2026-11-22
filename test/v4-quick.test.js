import test from 'node:test';
import assert from 'node:assert/strict';
import { v4QuickCommands } from '../src/commands/fun/v4-quick.js';
test('13 V4 quick commands with no repeated names',()=>{
 assert.equal(v4QuickCommands.length,13);
 assert.equal(new Set(v4QuickCommands.map(x=>x.name)).size,13);
});
test('offline piadas and cantadas return nonempty messages',async()=>{
 for(const name of ['piadas','cantadas','cor','animal']){
  let message='';
  await v4QuickCommands.find(x=>x.name===name).execute({reply:async text=>message=text});
  assert.ok(message.length>10,name);
 }
});
test('info command uses registry and hides owner-only entries',async()=>{
 let message='';
 const ctx={args:['secreto'],config:{prefix:'!'},isOwner:false,registry:{get:()=>({name:'secreto',ownerOnly:true,description:'privado'})},reply:async t=>message=t};
 await v4QuickCommands.find(x=>x.name==='info').execute(ctx);
 assert.match(message,/indisponível/);
});
