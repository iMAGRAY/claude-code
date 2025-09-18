# Дополнения корпоративного уровня для Claude Code

**Дата: 2025-09-18 (Europe/Berlin)**

Этот набор пакетов снижает когнитивную нагрузку и повышает безопасность/надёжность без ломающих изменений.
Режим **bypass permissions** сохраняется (осознанный opt-in), при этом добавлен локальный аудит его включения.

Основные пакеты:
- `@claude/permissions-linter` — линт/автофикс/инвентаризация/"dry-run" правил.
- `@claude/fs-patch` — транзакционные правки RHPV + unified diff.
- `@claude/shell-runner` — Bash/Pwsh/WinCMD-раннер с temp-script для сложных пайпов. При отсутствии выбранной оболочки автоматически откатывается на следующую (`bash → pwsh → cmd`), а переменная `SHELL_RUNNER_SHELL` позволяет зафиксировать предпочтение.
- `@claude/stream-checkpoints` — чекпоинты/корреляция tool-вызовов и валидатор.
- `@claude/cli-extras` — команды setup/session/bypass/fs/permissions.

См. основной `README.md` для примеров.
