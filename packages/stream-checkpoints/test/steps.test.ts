import assert from 'node:assert';
import { validateLines } from '../src/validate.js';
const lines = [
  JSON.stringify({type:'toolUse', corrId:'t1', tool:'Bash'}),
];
const res = validateLines(lines, {requireMatched:true});
assert.ok(!res.ok, 'toolUse outside step should be invalid');
