import test from 'node:test'; import assert from 'node:assert/strict'; import { imageSource } from '../src/core/media.js';
test('imagem enviada diretamente', () => { const msg={key:{remoteJid:'test'},message:{imageMessage:{mimetype:'image/jpeg'}}}; assert.ok(imageSource(msg)); });
test('imagem citada', () => { const msg={key:{remoteJid:'test'},message:{extendedTextMessage:{contextInfo:{stanzaId:'123',quotedMessage:{imageMessage:{}}}}}}; assert.equal(imageSource(msg).key.id,'123'); });
test('mensagem sem imagem',()=>assert.equal(imageSource({message:{conversation:'oi'}}),null));
