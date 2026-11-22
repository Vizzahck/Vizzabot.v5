import test from 'node:test';
import assert from 'node:assert/strict';
import { utilityBatch2 } from '../src/commands/general/utility-batch-2.js';
test('twenty new utility commands have unique names',()=>{
 assert.equal(utilityBatch2.length,20);
 assert.equal(new Set(utilityBatch2.map(c=>c.name)).size,20);
});
test('base64 round trip preserves accented text',async()=>{
 let result='';
 const ctx=(args)=>({args,config:{prefix:'!'},reply:async t=>{result=t;}});
 await utilityBatch2.find(c=>c.name==='base64').execute(ctx(['olá']));
 const encoded=result.replace('🔐 ','');
 await utilityBatch2.find(c=>c.name==='decbase64').execute(ctx([encoded]));
 assert.match(result,/olá/);
});
test('SHA-256 matches known digest',async()=>{
 let result='';
 await utilityBatch2.find(c=>c.name==='sha256').execute({args:['abc'],config:{prefix:'!'},reply:async t=>{result=t;}});
 assert.match(result,/ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad/);
});
test('rule of three calculates',async()=>{
 let result='';
 await utilityBatch2.find(c=>c.name==='regra3').execute({args:['2','10','5'],config:{prefix:'!'},reply:async t=>{result=t;}});
 assert.match(result,/25/);
});
