#!/usr/bin/env node
import { loadSettings, effectiveFromPaths } from '../src/loader.js';
import { dryRun } from '../src/dryrun.js';

const args = process.argv.slice(2);
let file = './.claude/settings.json';
let tool = 'Bash';
let cmd = 'echo ok';
let managed,user,project,projectLocal,cli;

for (let i=0;i<args.length;i++) {
  if (args[i]==='--project' || args[i]==='--file') file = args[++i];
  if (args[i]==='--tool') tool = args[++i];
  if (args[i]==='--cmd' || args[i]==='--') { cmd = args.slice(i+1).join(' '); break; }
  if (args[i]==='--managed') managed = args[++i];
  if (args[i]==='--user') user = args[++i];
  if (args[i]==='--project-local') projectLocal = args[++i];
  if (args[i]==='--cli') cli = args[++i];
}

let s;
if (managed || user || project || projectLocal || cli) {
  const eff = effectiveFromPaths({managed, user, project, 'project.local': projectLocal, cli});
  s = eff.settings;
} else {
  s = loadSettings(file);
}
const res = dryRun(s, tool, cmd);
console.log(JSON.stringify(res, null, 2));
process.exit(res.decision==='deny' ? 2 : 0);
