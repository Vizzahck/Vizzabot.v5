import test from 'node:test';
import assert from 'node:assert/strict';
import { arithmetic } from '../src/commands/general/v4-utilities.js';
import { ownerSettings } from '../src/commands/owner/settings.js';
test('calculator respects precedence',()=>assert.equal(arithmetic('2+3*4'),14));
test('calculator supports parentheses',()=>assert.equal(arithmetic('(2+3)*4'),20));
test('calculator rejects JavaScript injection',()=>assert.throws(()=>arithmetic('process.exit(1)')));
test('calculator rejects division by zero',()=>assert.throws(()=>arithmetic('1/0')));
test('owner configuration commands require owner',()=>assert.ok(ownerSettings.every(c=>c.ownerOnly===true)));
