#!/usr/bin/env node
import { loadSettings } from '../src/loader.js';
import { lintPolicy, extraHeuristics } from '../src/lints.js';

const [,,flag, file] = process.argv;
const path = file || './.claude/settings.json';
const settings = loadSettings(path);
const policy = settings.permissions || {};
const issues = [...lintPolicy(policy, path), ...extraHeuristics(policy, path)];

if (!issues.length) {
  console.log('No issues found.');
  process.exit(0);
}
for (const i of issues) {
  console.log(`[${i.level}] ${i.code}: ${i.message}${i.pattern?` :: ${i.pattern}`:''}`);
  if (i.fix) console.log(`  fix: ${i.fix}`);
}
process.exit(issues.some(i=>i.level==='error') ? 2 : 0);
