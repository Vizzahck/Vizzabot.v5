import test from 'node:test';
import assert from 'node:assert/strict';
import {formatTerminalRecord} from '../src/core/terminal.js';
test('terminal shows command without phone or message body',()=>{
 const line=formatTerminalRecord({level:30,activity:'command',chatType:'group',command:'ping',sender:'5598987654321'});
 assert.match(line.text,/COMANDO/);assert.match(line.text,/!ping/);assert.doesNotMatch(line.text,/5598987654321/);
});
test('terminal summarizes timeout without stack',()=>{
 const line=formatTerminalRecord({level:50,msg:'unexpected error in init queries',err:{message:'Timed Out',stack:'PRIVATE_STACK'},status:408});
 assert.match(line.text,/Timed Out/);assert.match(line.text,/408/);assert.doesNotMatch(line.text,/PRIVATE_STACK/);
});
