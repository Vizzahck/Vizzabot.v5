import test from 'node:test';
import assert from 'node:assert/strict';
import {isHttpUrl,queryTarget,formatInfo,resolvedEntry} from '../src/commands/downloads/media.js';
test('download accepts valid https link',()=>assert.equal(queryTarget('https://youtu.be/abc'),'https://youtu.be/abc'));
test('download searches by name',()=>assert.equal(queryTarget('musica teste'),'ytsearch1:musica teste'));
test('download rejects empty query',()=>assert.throws(()=>queryTarget('   ')));
test('download rejects non-http protocols',()=>assert.equal(isHttpUrl('file:///etc/passwd'),false));
test('metadata includes title and duration',()=>assert.match(formatInfo({title:'Teste',duration:125}),/2:05/));

test('search playlist resolves first video',()=>assert.equal(resolvedEntry({_type:'playlist',entries:[{id:'abc123',url:'https://www.youtube.com/watch?v=abc123'}]}),'https://www.youtube.com/watch?v=abc123'));
test('metadata displays upload date and views',()=>{const text=formatInfo({title:'Música',channel:'Canal',duration:185,upload_date:'20240125',view_count:1234});assert.match(text,/25\/01\/2024/);assert.match(text,/1.234/);});
