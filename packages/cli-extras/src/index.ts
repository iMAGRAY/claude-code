#!/usr/bin/env node
import { cmdPermissions } from './commands/permissions.js';
import { cmdSetup } from './commands/setup.js';
import { cmdTools } from './commands/tools.js';
import { cmdFs } from './commands/fs.js';
import { cmdSession } from './commands/session.js';
import { cmdBypass } from './commands/bypass.js';
import { cmdVerify } from './commands/verify.js';
import { cmdDoctor } from './commands/doctor.js';

export async function main(argv: string[]) {
  const cmd = argv[0] || 'help';
  const rest = argv.slice(1);
  if (cmd==='permissions') return cmdPermissions(rest);
  if (cmd==='setup') return cmdSetup(rest);
  if (cmd==='tools') return cmdTools(rest);
  if (cmd==='fs') return cmdFs(rest);
  if (cmd==='session') return cmdSession(rest);
  if (cmd==='bypass') return cmdBypass(rest);
  if (cmd==='verify') return cmdVerify(rest);
  if (cmd==='doctor') return cmdDoctor(rest);
  console.log('claude-extras: commands = permissions|setup|tools|fs|session|bypass|verify|doctor');
}
