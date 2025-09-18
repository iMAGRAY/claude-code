#!/usr/bin/env node
import { validateFile } from '../src/validate.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = process.argv[2];
if (!file) { console.error('Usage: claude-stream-validate <jsonl-file>'); process.exit(1); }

const res = validateFile(file, {requireMatched:true});

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/schema.json'),'utf-8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema as any);
const lines = fs.readFileSync(file,'utf-8').split('\n').filter(Boolean);
const schemaErrors: string[] = [];
for (const line of lines) {
  try {
    const obj = JSON.parse(line);
    const ok = validate(obj);
    if (!ok) schemaErrors.push(...(validate.errors||[]).map(e=>`${e.instancePath} ${e.message}`));
  } catch (e:any) { schemaErrors.push(`Invalid JSON: ${e.message}`); }
}

if (!res.ok || schemaErrors.length) {
  console.error('Invalid stream:');
  for (const e of res.errors) console.error(' - logic:', e);
  for (const s of schemaErrors) console.error(' - schema:', s);
  process.exit(2);
}
console.log(`OK: ${lines.length} events`);
