import { CheckpointEvent } from './types.js';

export class Emitter {
  write: (line: string) => void;
  constructor(sink?: (line: string)=>void) {
    this.write = sink || ((line)=> process.stdout.write(line + '\n'));
  }
  now() { return Date.now(); }
  stepStart(stepId: string, summary?: string) {
    this.write(JSON.stringify({ type:'stepStart', stepId, summary, ts: this.now() }));
  }
  stepEnd(stepId: string, status: 'ok'|'error'|'skipped', error?: string) {
    this.write(JSON.stringify({ type:'stepEnd', stepId, status, error, ts: this.now() }));
  }
  toolUse(corrId: string, tool: string, args?: any, idempotent=true) {
    this.write(JSON.stringify({ type:'toolUse', corrId, tool, args, idempotent, ts: this.now() }));
  }
  toolResult(corrId: string, exitCode: number, stdout?: string, stderr?: string) {
    this.write(JSON.stringify({ type:'toolResult', corrId, exitCode, stdout, stderr, ts: this.now() }));
  }
}
