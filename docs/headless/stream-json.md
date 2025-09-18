# Stream‑JSON Checkpoints

**Data as of 2025-09-18 (Europe/Berlin)**

When enabled, the CLI emits `stepStart`/`stepEnd` markers and correlates tool calls via `corrId`.
This allows external orchestrators to replay, audit, and retry idempotent steps deterministically.

Example (abridged):

```json
{ "type": "stepStart", "stepId": "s1", "summary": "Edit files" }
{ "type": "toolUse", "corrId": "t42", "tool": "Bash", "args": "git diff --name-only" }
{ "type": "toolResult", "corrId": "t42", "exitCode": 0 }
{ "type": "stepEnd", "stepId": "s1", "status": "ok" }
```

Run `npx claude-stream-validate <file.jsonl>` (or the workspace binary `claude-stream-validate`) to verify
both JSON Schema compliance and logical consistency (`toolUse` ↔ `toolResult`, matched step boundaries).
Use `requireMatched: false` when replaying partial logs or debugging in-progress sessions.
