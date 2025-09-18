import fs from 'node:fs';
import { applyPatchTransactional } from '@claude/fs-patch';

export async function cmdFs(argv: string[]) {
  const sub = argv[0];
  if (sub !== 'apply-patch') {
    console.log('fs apply-patch <file> <patch-file> [preHash]');
    return;
  }
  const file = argv[1];
  const patchFile = argv[2];
  const preHash = argv[3];
  if (!file || !patchFile) {
    console.error('Usage: fs apply-patch <file> <patch-file> [preHash]');
    process.exit(1);
  }
  const patch = fs.readFileSync(patchFile, 'utf-8');
  const res = applyPatchTransactional(file, patch, { preHash: preHash || undefined });
  if (!res.ok) {
    console.error('ERROR:', res.error);
    process.exit(2);
  }
  console.log(JSON.stringify(res, null, 2));
}
