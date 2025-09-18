import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function validateSettings(obj: any) {
  const schemaPath = path.join(__dirname, 'schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath,'utf-8'));
  const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
  const validate = ajv.compile(schema as any);
  const ok = validate(obj);
  return { ok: !!ok, errors: validate.errors || [] };
}

export function validateFile(p: string) {
  const raw = fs.readFileSync(p,'utf-8');
  const obj = JSON.parse(raw);
  return validateSettings(obj);
}
