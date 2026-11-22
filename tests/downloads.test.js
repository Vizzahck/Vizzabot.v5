import test from 'node:test';
import assert from 'node:assert/strict';
import {isHttpUrl,queryTarget,formatInfo} from '../src/commands/downloads/media.js';
test('download accepts valid https link',()=>assert.equal(queryTarget('https://youtu.be/abc'),'https://youtu.be/abc'));
test('download searches by name',()=>assert.equal(queryTarget('musica teste'),'ytsearch1:musica teste'));
test('download rejects empty query',()=>assert.throws(()=>queryTarget('   ')));
test('download rejects non-http protocols',()=>assert.equal(isHttpUrl('file:///etc/passwd'),false));
test('metadata includes title and duration',()=>assert.match(formatInfo({title:'Teste',duration:125}),/2:05/));
