import test from 'node:test';
import assert from 'node:assert/strict';
import { v4ExtraCommands } from '../src/commands/general/v4-extra-batch.js';
const find=n=>v4ExtraCommands.find(c=>c.name===n);
test('12 unique commands',()=>{assert.equal(v4ExtraCommands.length,12);assert.equal(new Set(v4ExtraCommands.map(c=>c.name)).size,12);});
test('AFK activates and deactivates',async()=>{let result='';const ctx={args:['ocupado'],sender:'test@s.whatsapp.net',reply:async x=>{result=x;}};await find('afk').execute(ctx);assert.match(result,/ocupado/);await find('verafk').execute(ctx);assert.match(result,/Ausente/);await find('voltei').execute(ctx);assert.match(result,/Bem-vindo/);});
test('table formatting',async()=>{let result='';await find('criartabela').execute({args:['A','|','B'],config:{prefix:'!'},reply:async x=>{result=x;}});assert.match(result,/01\. A/);assert.match(result,/02\. B/);});
