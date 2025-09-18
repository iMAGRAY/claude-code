# Integration Execution Plan — Anthropic Claude Code Contributions

> Snapshot date: 2025-09-18
> Maintainer: Codex (external integrator)
> Target branch: main

All items must be executed in order unless explicitly tagged as parallel-safe. Use conventional commits. PR titles must be dry, factual, and scoped to one deliverable.

## 0. Baseline Readiness & Risk Controls
- [x] 0.1 Capture clean `git status -sb` on `main` for baseline (recorded 2025-09-18).
- [ ] 0.2 Document runtime prerequisites: Node >=18, npm >=10; confirm via `node -v`, `npm -v`, store output in integration notes.
- [ ] 0.3 Validate local toolchain parity: ensure `json2ts`, `fast-check`, `husky` resolved after dependency alignment (see §1).
- [ ] 0.4 Establish verification cadence: agree to run `npm run build`, `npm test`, and targeted package tests after each PR landing.

## 1. Repository Hygiene & Dependency Alignment (PR: "build: align tooling prerequisites for claude-code")
- [ ] 1.1 Diff `package.json` vs `contributing/package.json`; enumerate delta scripts (`gen:types`, `prepare`) and devDependencies (`fast-check`, `json-schema-to-typescript`, `husky`).
- [ ] 1.2 Decide on commitlint adoption: `.husky/commit-msg` invokes `npx commitlint` but repo lacks config; either add commitlint packages + config or replace hook with noop. Document decision in PR summary.
- [ ] 1.3 Merge dependency changes into root `package.json` and regenerate `package-lock.json` via `npm install` (ensure deterministic lockfile, run on Node 18).
- [ ] 1.4 Hoist Husky: copy `.husky/` scripts, ensure shebang compatibility on Windows + WSL, and add `prepare` script invocation.
- [ ] 1.5 Stage helper script `scripts/prep-pr.sh`; confirm it is POSIX compliant and mention in docs (README or CONTRIBUTING) if needed.
- [ ] 1.6 Update `.gitignore` to include `contributing/` (see §0) and verify no other ignores regress (respect existing entries for `.claude/*`).
- [ ] 1.7 Verify `tsconfig.base.json`, `Makefile`, and root docs remain in sync; no action expected but confirm.
- [ ] 1.8 Run `npm ci && npm run build` to ensure dependency uplift compiles before functional changes.
- [ ] 1.9 Draft PR metadata: title `build: align tooling prerequisites for claude-code`; description must list scripts, deps, Husky hooks, and test results.

## 2. RFC-001 — Permissions Linter Enhancements (PR: "feat: expand permissions lint coverage")
- [x] 2.1 Catalog new CLI binaries (`claude-permissions-normalize`) and ensure `packages/permissions-linter/package.json` bins align with actual compiled outputs.
- [x] 2.2 Review `src/lints.ts` deltas: integrate additional diagnostics (`BASH_ANY`, `BASH_QUOTES`), confirm message wording matches house style, and add unit coverage.
- [x] 2.3 Inspect `contributing/packages/permissions-linter/test/property-bash-prefix.test.ts`; integrate into `node --test` suite and ensure fast-check run time acceptable (≤5s) with 50 iterations.
- [x] 2.4 Align CLI entry points: update `packages/permissions-linter/bin/*.ts` and ensure `normalize` command shares error handling with existing commands.
- [x] 2.5 Wire new capabilities into `packages/cli-extras/src/commands/permissions.ts` if UX expects shortcuts (e.g., `cli-extras permissions normalize`).
- [x] 2.6 Update documentation: add short section to `docs/` or `README.md` enumerating new lint warnings and normalization command.
- [x] 2.7 Execute targeted tests: `npm -w packages/permissions-linter run build`, `node --test dist/test/*.js`.
- [x] 2.8 Performance sanity: run lint command against sample policy to ensure no regression (CLI completes <1s on sample `examples/project/.claude/settings.json`).
- [x] 2.9 Capture PR summary referencing RFC-001 and attach test evidence.

## 3. RFC-002 — Transactional FS Patch & Diff3 (PR: "feat: harden fs patch transactional writes")
- [ ] 3.1 Review `packages/fs-patch/src/index.ts` for duplicated imports/options introduced by manual merge; deduplicate (`import os` appears twice) before integrating.
- [ ] 3.2 Integrate new options (`allowCreate`, `allowDelete`, `lock`, `allowConflictMerge`, diff3) with defensive defaults; ensure TypeScript interfaces remain backwards compatible.
- [ ] 3.3 Validate `diff3Merge` implementation: port `src/diff3.ts`, ensure exported signatures include conflict counts, and add unit coverage (`diff3.test.ts`).
- [ ] 3.4 Ensure CLI (`bin/claude-fs-apply-patch.ts`) exposes new flags (`--lock`, `--allow-conflict-merge`, `--base`) with help text.
- [ ] 3.5 Confirm transactional path writes behave on Windows (use temp file rename fallback) and locks handle stale lock files; document behavior edges in code comments if missing.
- [ ] 3.6 Run tests: `npm -w packages/fs-patch run build`; `node --test dist/test/*.js`; add manual smoke by applying `examples/patches/readme.patch` to `examples/project/README.md`.
- [ ] 3.7 Update docs (`docs/rhpv.md`) to mention new flags and diff3 capability.
- [ ] 3.8 Include PR risk assessment explaining lock + conflict merge semantics.

## 4. RFC-003 — Shell Runner Enhancements (PR: "feat: add resilient shell fallback routing")
- [ ] 4.1 Diff `packages/shell-runner/src/*.ts`; integrate error handling that surfaces ENOENT with actionable messaging.
- [ ] 4.2 Audit new helper `tryPowershellExe` for dead code; either integrate into fallback path or drop to avoid unused exports.
- [ ] 4.3 Ensure options object merges respect existing API; add tests covering shell fallback order (`bash`→`pwsh`→`cmd`).
- [ ] 4.4 Confirm new behavior documented (README / docs) to set expectations for fallback and error messaging.
- [ ] 4.5 Run targeted builds/tests for package and simulate absence of default shells (mock spawn) if feasible.
- [ ] 4.6 Draft PR summary referencing RFC-003 with platform coverage notes.

## 5. RFC-004 — Stream Checkpoints Validation (PR: "feat: strengthen stream checkpoint schema validation")
- [ ] 5.1 Integrate `schema.d.ts` generation; ensure `npm run gen:types` produces deterministic output (watch for newline differences across OS).
- [ ] 5.2 Merge stricter validation logic in `src/validate.ts` (step matching, corrId tracking) and confirm options parameter default remains backwards compatible.
- [ ] 5.3 Ensure new tests (`test/steps.test.ts`) cover step/tool mismatch cases and pass under Node test runner.
- [ ] 5.4 Update docs or package README to describe new validation guarantees and usage of `requireMatched` flag.
- [ ] 5.5 Execute `npm -w packages/stream-checkpoints run build` and `node --test dist/test/*.js`.
- [ ] 5.6 Document PR results referencing RFC-004.

## 6. CLI Extras Surface Updates (PR: "feat: expose diagnostics commands in claude-extras")
- [ ] 6.1 Wire newly added commands (`verify`, `doctor`) into CLI dispatcher (`src/index.ts`) and update help banner; remove dead imports.
- [ ] 6.2 Review `cmdVerify` pipeline: ensure commands exist (`claude-permissions-coverage`, `risk`, `normalize`) after §2 integration; add timeout/error handling for missing binaries.
- [ ] 6.3 Enhance `cmdDoctor`: confirm Windows compatibility (PowerShell invocation), ensure JSON output schema documented.
- [ ] 6.4 Update `cmdSession` TTL logic and environment variable names; add unit tests if possible or manual acceptance notes.
- [ ] 6.5 Extend docs/examples to teach new commands (`verify`, `doctor`, TTL, `CLAUDE_BYPASS_AUDIT_KEEP`).
- [ ] 6.6 Run CLI smoke tests: `npx ts-node packages/cli-extras/src/index.ts doctor`, `session start --ttl 1m`, `verify` against sample config.
- [ ] 6.7 Prepare PR summary enumerating UX changes and link to impacted docs.

## 7. Docs & Policy Presets (PR sequence per contributing/PRs)
- [ ] 7.1 PR-01 (`docs/security/SECURITY-PRESETS.md`, policy JSON examples):
  - [ ] 7.1.1 Copy doc and ensure navigation link (maybe `docs/security/index.md` or README) references it.
  - [ ] 7.1.2 Place policy JSON under `examples/security/policies/`; ensure existing presets align (dedupe fields like `telemetry`).
  - [ ] 7.1.3 Update README as per `PR-01` patch and crosslink from docs.
  - [ ] 7.1.4 Draft PR title `docs: add security policy presets reference` with succinct summary + manual verification (no build logic touched).
- [ ] 7.2 PR-02 (`docs/PERMISSIONS-TROUBLESHOOTING.md`):
  - [ ] 7.2.1 Integrate doc, add README link from “Permissions troubleshooting” section.
  - [ ] 7.2.2 Validate content accuracy against current CLI options (post §2/§6 updates).
  - [ ] 7.2.3 PR title `docs: add permissions troubleshooting guide`.
- [ ] 7.3 PR-04 (README data usage clarification):
  - [ ] 7.3.1 Apply README patch; ensure wording aligns with Anthropic voice and references official docs.
  - [ ] 7.3.2 Confirm environment variables exist or add note to docs.

## 8. CI & Automation (PR: "ci: add optional nightly canary workflow")
- [ ] 8.1 Import `.github/workflows/canary.yml` from `contributing/PRs/PR-03`; ensure Node matrix matches support policy (18, 20) and steps use `npm ci`.
- [ ] 8.2 Confirm workflow default branch filter (schedule only) and add manual trigger `workflow_dispatch` if desired.
- [ ] 8.3 Update docs/README to mention optional canary workflow and how to disable.
- [ ] 8.4 Validate `ci.yml` diff between root and contributing; ensure no regressions to existing pipeline while syncing improvements (if any).
- [ ] 8.5 Provide PR summary including risk (runs nightly only), link to workflow file, and expected runtime.

## 9. Examples & Tooling Artifacts
- [ ] 9.1 Verify `examples/tools.json`, `examples/patches/readme.patch`, sample project remain consistent with new features.
- [ ] 9.2 Decide whether to keep `examples/hooks` (current repo only) when syncing contributions; document rationale.
- [ ] 9.3 Ensure presets referenced by CLI or docs are located correctly (`presets/managed/*`).

## 10. Quality Gates & Regression Safety
- [ ] 10.1 After each PR merge, run `npm run build` and `npm test` from repo root; capture logs in integration notes.
- [ ] 10.2 Add targeted cross-platform verification plan (Windows PowerShell, macOS, Linux) for shell-runner and fs-patch features.
- [ ] 10.3 Evaluate performance impact of new lint/verify flows on large policies (>5k rules); note results.
- [ ] 10.4 Update `CHANGELOG.md` with concise entries per feature PR (optional if upstream maintains release notes elsewhere).

## 11. Final Packaging & Communication
- [ ] 11.1 Compile release notes summarizing new tooling, docs, and workflows; ensure tone is neutral and actionable.
- [ ] 11.2 Verify `LICENSE`/attribution unchanged; note if contributions require additional NOTICE updates (none expected).
- [ ] 11.3 Prepare final PR-of-PRs tracking issue describing rollout order and backport risk.
- [ ] 11.4 Confirm `contributing/` directory remains ignored and kept as reference only.

