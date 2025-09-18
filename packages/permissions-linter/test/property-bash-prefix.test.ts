import assert from 'node:assert';
import { test } from 'node:test';
import fc from 'fast-check';
import { lintPolicy } from '../src/lints.js';

const bashChar = fc.constantFrom(
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','-',' '
);

const bashPrefix = fc.stringOf(bashChar, { minLength: 1, maxLength: 20 });

test('CLI warns on Bash prefixes missing colon', async () => {
  await fc.assert(
    fc.asyncProperty(bashPrefix, async (cmd) => {
      const issues = lintPolicy({ allow: [`Bash(${cmd}*)`] });
      assert.ok(issues.some(i => i.code==='BASH_COLON' || i.code==='P001' || i.code==='P002'));
    }),
    { numRuns: 50 }
  );
});
