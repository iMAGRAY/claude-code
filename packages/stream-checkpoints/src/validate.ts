import fs from 'node:fs';
import { CheckpointEvent, ValidateOptions } from './types.js';

export function validateLines(lines: string[], opts: ValidateOptions = {requireMatched: true}) {
  const toolUses = new Map<string,number>();
  const results = new Set<string>();
  const errors: string[] = [];
  const steps = new Set<string>();
  const stepOpen = new Set<string>();

  const events: CheckpointEvent[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const ev = JSON.parse(line) as CheckpointEvent;
      events.push(ev);
      if (ev.type === 'toolUse') {
        if (opts.requireMatched && stepOpen.size===0) errors.push('toolUse outside of any step');

        if (toolUses.has(ev.corrId)) errors.push(`Duplicate toolUse corrId=${ev.corrId}`);
        toolUses.set(ev.corrId, 1);
      }
      if (ev.type === 'toolResult') {
        if (opts.requireMatched && stepOpen.size===0) errors.push('toolResult outside of any step');
        if (!toolUses.has(ev.corrId)) errors.push(`toolResult without prior toolUse corrId=${ev.corrId}`);
        if (results.has(ev.corrId)) errors.push(`Duplicate toolResult corrId=${ev.corrId}`);
        results.add(ev.corrId);
      }
      if (ev.type === 'stepStart') {
        if (stepOpen.has(ev.stepId)) errors.push(`stepStart while step is open id=${ev.stepId}`);
        stepOpen.add(ev.stepId);
        steps.add(ev.stepId);
      }
      if (ev.type === 'stepEnd') {
        if (!stepOpen.has(ev.stepId)) errors.push(`stepEnd without open step id=${ev.stepId}`);
        stepOpen.delete(ev.stepId);
      }
    } catch (e:any) {
      errors.push(`Invalid JSON: ${e.message}`);
    }
  }
  if (opts.requireMatched) {
    for (const id of toolUses.keys()) if (!results.has(id)) errors.push(`Missing toolResult for corrId=${id}`);
  }
  if (stepOpen.size) errors.push(`Unclosed steps: ${Array.from(stepOpen).join(',')}`);
  return { ok: errors.length===0, errors, count: events.length };
}

export function validateFile(path: string, opts?: ValidateOptions) {
  const data = fs.readFileSync(path, 'utf-8').split('\n');
  return validateLines(data, opts);
}
