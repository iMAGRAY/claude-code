#!/usr/bin/env node
import { validateFile } from '../src/index.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: claude-settings-validate <settings.json>');
  process.exit(1);
}

try {
  const res = validateFile(file);
  if (!res.ok) {
    console.error('Invalid settings:');
    for (const err of res.errors || []) {
      console.error(` - ${err.instancePath ?? ''} ${err.message ?? ''}`);
    }
    process.exit(2);
  }
  console.log('OK');
} catch (error: any) {
  console.error('Failed to validate settings:', error?.message || error);
  process.exit(2);
}
