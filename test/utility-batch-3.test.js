import test from 'node:test';
import assert from 'node:assert/strict';
import { utilityBatch3 } from '../src/commands/general/utility-batch-3.js';
test('third utility batch contains 20 unique commands',()=>{
 assert.equal(utilityBatch3.length,20);
 assert.equal(new Set(utilityBatch3.map(x=>x.name)).size,20);
});
async function call(name,args){let result='';await utilityBatch3.find(x=>x.name===name).execute({args,config:{prefix:'!'},reply:async t=>{result=t;}});return result;}
test('accent removal and slug work',async()=>{
 assert.equal(await call('semacento',['São','Luís']),'Sao Luis');
 assert.equal(await call('slug',['Olá,','Mundo!']),'ola-mundo');
});
test('binary and hexadecimal conversions work',async()=>{
 assert.equal(await call('decimalbin',['42']),'🔢 101010');
 assert.equal(await call('bindecimal',['101010']),'🔢 42');
 assert.equal(await call('hexdecimal',['FF']),'🔢 255');
});
test('literal replacement does not evaluate regex',async()=>{
 assert.equal(await call('substituir',['a','|','b','|','casa']),'cbsb');
});
