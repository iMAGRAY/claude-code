import { Policy } from './types.js';

const HIGH_RISK = [/Bash\(rm -rf:.*\)/, /Bash\(sudo:.*\)/, /WebFetch\(\*\)/];
const MED_RISK = [/Bash\(curl:.*\)/, /Bash\(wget:.*\)/];

export function riskScore(policy: Policy) {
  const buckets: [string[], number][] = [
    [policy.allow || [], 5],   // allow carries full risk
    [policy.ask || [], 2],     // ask is mitigated
    [policy.deny || [], 0]     // deny does not increase risk
  ];
  let score = 0;
  for (const [arr, weight] of buckets) {
    for (const p of arr) {
      if (HIGH_RISK.some(re => re.test(p))) score += weight;
      else if (MED_RISK.some(re => re.test(p))) score += Math.max(1, Math.floor(weight/2));
    }
  }
  return score;
}
