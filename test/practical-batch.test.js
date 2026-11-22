import test from 'node:test';
import assert from 'node:assert/strict';
import { practicalBatch } from '../src/commands/general/practical-batch.js';
const run=async(name,args)=>{let output='';await practicalBatch.find(c=>c.name===name).execute({args,config:{prefix:'!'},reply:async s=>{output=s;}});return output;};
test('15 unique practical commands',()=>{assert.equal(practicalBatch.length,15);assert.equal(new Set(practicalBatch.map(c=>c.name)).size,15);});
test('number tools',async()=>{
 assert.match(await run('mediana',['1','2','3','4']),/2.5/);
 assert.match(await run('mdc',['12','18']),/6/);
 assert.match(await run('mmc',['12','18']),/36/);
 assert.match(await run('primo',['97']),/é primo/);
 assert.match(await run('paridade',['17']),/ímpar/);
});
test('text tools',async()=>{
 assert.equal(await run('ordenarpalavras',['zebra','abacaxi']),'abacaxi zebra');
 assert.match(await run('contarfrases',['Oi.','Tudo','bem?']),/2/);
});
