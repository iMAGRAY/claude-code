#!/usr/bin/env node
import { loadSettings, effectiveFromPaths } from '../src/loader.js';
import { riskScore } from '../src/risk.js';

const args = process.argv.slice(2);
let file = './.claude/settings.json';
let managed, user, project, projectLocal, cli;
let jsonOut = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--project' || arg === '--file') file = args[++i];
  else if (arg === '--managed') managed = args[++i];
  else if (arg === '--user') user = args[++i];
  else if (arg === '--project-local') projectLocal = args[++i];
  else if (arg === '--cli') cli = args[++i];
  else if (arg === '--json') jsonOut = true;
}

let policy;
let sources: string[] = [];
if (managed || user || project || projectLocal || cli) {
  const eff = effectiveFromPaths({ managed, user, project, 'project.local': projectLocal, cli });
  policy = eff.settings.permissions || {};
  sources = eff.order;
} else {
  const settings = loadSettings(file);
  policy = settings.permissions || {};
  sources = ['file'];
}

const score = riskScore(policy);
const result = { file, score, sources };

if (jsonOut) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Risk score: ${score} (sources: ${sources.join(', ') || 'n/a'})`);
}

process.exit(score > 0 ? 1 : 0);
