#!/usr/bin/env node
import fs from 'node:fs';
import { loadSettings } from '../src/loader.js';
import { lintPolicy } from '../src/lints.js';

const [,,flag, file] = process.argv;
const targetPath: string = file ?? './.claude/settings.json';
const settings = loadSettings(targetPath);
const policy = settings.permissions || {};
const issues = lintPolicy(policy, targetPath);

let changed = false;
for (const i of issues) {
  if (i.fix && i.pattern && i.code==='BASH_COLON') {
    const pattern = i.pattern;
    const fixValue = i.fix;
    const fixOne = (arr?: string[]) => {
      if (!arr) return arr;
      const idx = arr.indexOf(pattern);
      if (idx >= 0) { arr[idx] = fixValue; changed = true; }
      return arr;
    }
    policy.allow = fixOne(policy.allow);
    policy.ask = fixOne(policy.ask);
    policy.deny = fixOne(policy.deny);
  }
}
if (changed) {
  fs.writeFileSync(targetPath, JSON.stringify(settings, null, 2));
  console.log(`Applied auto-fixes to ${targetPath}`);
} else {
  console.log('No auto-fixes applicable.');
}
