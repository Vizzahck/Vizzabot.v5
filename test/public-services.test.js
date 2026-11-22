import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanQuery, weatherDescription, getJson, publicServices } from '../src/commands/general/public-services.js';

test('public services are registered with distinct names', () => {
 assert.deepEqual(publicServices.map(x => x.name), ['wikipedia', 'clima']);
 assert.equal(new Set(publicServices.map(x=>x.name)).size, 2);
});
test('query validation limits external API input', () => {
 assert.equal(cleanQuery(['  Pinheiro  ']), 'Pinheiro');
 assert.equal(cleanQuery([]), null);
 assert.equal(cleanQuery(['x'.repeat(101)]), null);
});
test('weather codes translate to Portuguese', () => {
 assert.equal(weatherDescription(0), 'Céu limpo');
 assert.equal(weatherDescription(61), 'Chuva');
});
test('HTTP failures are rejected', async () => {
 await assert.rejects(getJson('https://example.test', async () => ({ok:false,status:503})), /503/);
});
test('wikipedia command reports missing query without API request', async () => {
 let reply='';
 await publicServices[0].execute({args:[],config:{prefix:'!'},reply:async text=>{reply=text;}});
 assert.match(reply,/Uso: !wikipedia/);
});
test('clima command reports missing city without API request', async () => {
 let reply='';
 await publicServices[1].execute({args:[],config:{prefix:'!'},reply:async text=>{reply=text;}});
 assert.match(reply,/Uso: !clima/);
});
