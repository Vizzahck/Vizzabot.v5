import test from 'node:test';
import assert from 'node:assert/strict';
import { simpleV4Commands } from '../src/commands/general/simple-v4-batch.js';
import { menuText } from '../src/commands/general/menu-layout.js';
import { categoryMenus } from '../src/commands/general/menus.js';
test('simple commands are 25 unique definitions',()=>{
 assert.equal(simpleV4Commands.length,25);
 assert.equal(new Set(simpleV4Commands.map(x=>x.name)).size,25);
});
test('each category menu dynamically lists its own functions',()=>{
 const ctx={config:{name:'Vizzabot',ownerName:'VHS',prefix:'!'},isOwner:true,registry:{list:()=>simpleV4Commands}};
 const tools=menuText(ctx,{category:'Ferramentas',title:'FERRAMENTAS'});
 assert.match(tools,/!tabuada/);
 assert.doesNotMatch(tools,/!d20/);
 const games=menuText(ctx,{category:'Jogos',title:'JOGOS'});
 assert.match(games,/!d20/);
 assert.doesNotMatch(games,/!tabuada/);
 assert.equal(categoryMenus.length,9);
});
test('percent and average calculate correctly',async()=>{
 const result=[];
 const ctx=(args)=>({args,config:{prefix:'!'},reply:async text=>result.push(text)});
 await simpleV4Commands.find(c=>c.name==='porcentagem').execute(ctx(['15','200']));
 await simpleV4Commands.find(c=>c.name==='media').execute(ctx(['7','8','9']));
 assert.match(result[0],/30/);
 assert.match(result[1],/8/);
});
test('password generation rejects unsafe sizes',async()=>{
 let response='';
 await simpleV4Commands.find(c=>c.name==='senha').execute({args:['1000'],config:{prefix:'!'},reply:async text=>response=text});
 assert.match(response,/8 a 64/);
});
