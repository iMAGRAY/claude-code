# Setup Wizard

**Data as of 2025-09-18 (Europe/Berlin)**

Run `claude-extras setup` to choose a profile (Locked‑Down / Team / Solo), shell (Bash/Pwsh), telemetry posture,
and model/cost controls. The wizard writes project/user settings and prints a dry‑run summary.

## Permissions Linter Enhancements (2025-09)

- New diagnostics: `BASH_ANY` flags broad `Bash(*)` patterns, `BASH_QUOTES` detects unbalanced quotes, and `BASH_COLON` warns when wildcards miss the `cmd:*` form.
- Run `npx -w @claude/permissions-linter claude-permissions-normalize` to normalize rules (converts `Bash(cmd)` to `Bash(cmd:*)`, deduplicates entries, keeps arrays sorted).
- With `@claude/cli-extras` installed you can invoke the shortcut `claude-extras permissions normalize`.
- Run `claude-extras verify [settings.json] [tools.json]` to execute the bundled validators (`settings`, `permissions`, `coverage`, `risk`) and `claude-extras doctor` for environment diagnostics.
