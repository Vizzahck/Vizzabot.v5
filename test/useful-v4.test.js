import test from 'node:test';
import assert from 'node:assert/strict';
import { dddLookup, usefulV4Commands } from '../src/commands/general/useful-v4.js';

test('DDD lookup identifies Maranhão without claiming current location',()=>{
 assert.match(dddLookup('98'),/São Luís/);
 assert.match(dddLookup('99'),/Maranhão/);
 assert.equal(dddLookup('00'),null);
});
test('V4 utilities have distinct command names',()=>{
 assert.equal(usefulV4Commands.length,8);
 assert.equal(new Set(usefulV4Commands.map(c=>c.name)).size,8);
});
test('Google search escapes user input',async()=>{
 let result='';
 await usefulV4Commands.find(c=>c.name==='google').execute({args:['café','&','chá'],config:{prefix:'!'},reply:async text=>{result=text;}});
 assert.match(result,/caf%C3%A9%20%26%20ch%C3%A1/);
});
test('group ID command rejects private chat',async()=>{
 let result='';
 await usefulV4Commands.find(c=>c.name==='idgp').execute({chat:'123@s.whatsapp.net',reply:async text=>{result=text;}});
 assert.match(result,/Somente em grupos/);
});
test('quoted message returns text safely',async()=>{
 let result='';
 await usefulV4Commands.find(c=>c.name==='getquoted').execute({msg:{message:{extendedTextMessage:{contextInfo:{quotedMessage:{conversation:'Olá'}}}}},config:{prefix:'!'},reply:async text=>{result=text;}});
 assert.match(result,/Olá/);
});
