import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyBatch } from '../src/commands/general/daily-batch.js';
const run=async(name,args)=>{let result='';await dailyBatch.find(x=>x.name===name).execute({args,config:{prefix:'!'},reply:async x=>{result=x;}});return result;};
test('14 daily commands have unique names',()=>{assert.equal(dailyBatch.length,14);assert.equal(new Set(dailyBatch.map(c=>c.name)).size,14);});
test('CPF validation checks verification digits',async()=>{assert.match(await run('cpfvalidar',['52998224725']),/válidos/);assert.match(await run('cpfvalidar',['11111111111']),/inválidos/);});
test('unit conversion',async()=>{assert.match(await run('convertertemperatura',['0']),/32.00 °F/);assert.match(await run('converterdistancia',['1']),/1000 m/);assert.match(await run('converterpeso',['1']),/1000 g/);});
test('list formatting',async()=>{assert.match(await run('separarvirgula',['Ana,','Bia,','Caio']),/3\. Caio/);});
