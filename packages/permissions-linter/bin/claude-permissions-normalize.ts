#!/usr/bin/env node
import fs from 'node:fs';

function normalizeRule(s: string): string {
  s = s.trim().replace(/\s+/g,' ');
  // Bash(cmd) -> Bash(cmd:*)
  const m = /^Bash\(([^:*)]+)\)$/.exec(s);
  if (m) return `Bash(${m[1]}:*)`;
  // Bash(cmd*) -> Bash(cmd:*)
  if (/^Bash\([^:]*\*\)$/.test(s)) return s.replace(/\*\)$/, ':*)').replace(/^Bash\(([^:)]+)\*\)/,'Bash($1:*)');
  return s;
}

const file = process.argv[2] || './.claude/settings.json';
const raw = fs.readFileSync(file,'utf-8');
const obj = JSON.parse(raw);
const pol = obj.permissions || {};
for (const key of ['allow','ask','deny'] as const) {
  const arr = pol[key] as string[]|undefined;
  if (!arr) continue;
  const set = new Set(arr.map(normalizeRule));
  pol[key] = Array.from(set).sort();
}
fs.writeFileSync(file, JSON.stringify(obj,null,2));
console.log(`Normalized ${file}`);
