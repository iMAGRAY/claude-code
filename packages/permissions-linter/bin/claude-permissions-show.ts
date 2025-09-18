#!/usr/bin/env node
import { effectiveFromPaths } from '../src/loader.js';

function parseArgs(argv: string[]) {
  const out: any = {};
  for (let i=0;i<argv.length;i++) {
    const k = argv[i];
    const v = argv[i+1];
    if (!v) continue;
    if (k==='--managed') out['managed']=v;
    if (k==='--cli') out['cli']=v;
    if (k==='--project-local') out['project.local']=v;
    if (k==='--project') out['project']=v;
    if (k==='--user') out['user']=v;
  }
  return out;
}

const paths = parseArgs(process.argv.slice(2));
if (!Object.keys(paths).length) {
  console.log('Usage: claude-permissions-show --project ./.claude/settings.json [--user ~/.claude/settings.json] [--managed ./managed.json] ...');
  process.exit(1);
}

const {settings, order} = effectiveFromPaths(paths);
console.log(`# Effective permissions`);
console.log(`Sources (priority high→low): ${order.join(' > ')}`);
const p = settings.permissions || {};
for (const key of ['deny','ask','allow'] as const) {
  const arr = (p as any)[key] as string[]|undefined;
  console.log(`\n${key.toUpperCase()}:`);
  for (const r of (arr||[])) console.log(` - ${r}`);
}
