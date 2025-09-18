import assert from 'node:assert';
import { validateLines } from '../src/validate.js';

const lines = [
  JSON.stringify({type:'stepStart', stepId:'s1'}),
  JSON.stringify({type:'toolUse', corrId:'t1', tool:'Bash'}),
  JSON.stringify({type:'toolResult', corrId:'t1', exitCode:0}),
  JSON.stringify({type:'stepEnd', stepId:'s1', status:'ok'})
];
const res = validateLines(lines);
assert.ok(res.ok, res.errors.join(', '));
