# Integration Notes — Claude Code

## Baseline Runtime Environment (recorded 2025-09-18)
- Node.js version: v22.19.0
- npm version: 10.9.3

## Toolchain Parity Check (2025-09-18)
- `json2ts`: not resolvable under current root dependencies (`MODULE_NOT_FOUND`).
- `fast-check`: not resolvable under current root dependencies (`MODULE_NOT_FOUND`).
- `husky`: not resolvable under current root dependencies (`MODULE_NOT_FOUND`).
- Action: address via Section 1 dependency alignment before feature work.

## Верификационный цикл (2025-09-18)
- После каждого объединения PR выполняем `npm run build` и `npm test` из корня репозитория.
- Дополнительно запускаем профильные тесты для затронутых пакетов (см. TODO разделы 2–6) до и после мерджа.
- Перед выдачей патчей прогоняем `claude-guard` из `packages/no-simulation-guard` по diff (см. раздел ниже).
- Логи тестов и отчёты guard сохраняем в этой же заметке с указанием даты и команд.

## Сравнение package.json (2025-09-18)
- Дополнительные скрипты в contributing/package.json: `gen:types`, `prepare`.
- Дополнительные devDependencies: `fast-check`, `json-schema-to-typescript`, `husky`.
- Связанные задачи: включить скрипты и зависимости в корневой package.json (см. TODO §1.1).

## Решение по commitlint и Husky (2025-09-18)
- Применяем commitlint с конфигурацией `@commitlint/config-conventional`.
- Добавляем `@commitlint/cli` и `@commitlint/config-conventional` в devDependencies.
- Сохраняем хуки из `contributing/.husky`, адаптируем под root (`prepare` + `npx --no`).
- Проверим shebang на совместимость с Git Bash/WSL; при необходимости оставляем `bash` и документируем требование.

## Команды npm (2025-09-18)
- `npm install` (Node v22.19.0): завершилась успешно; предупреждение husky о deprecated `install` зафиксировано.
- `npm ci` (Node v22.19.0): завершилась успешно с тем же предупреждением.
- `npm run build`: завершилась с ошибками (см. ниже) — ожидаются дальнейшие правки в пакетах (§2–§6), поэтому сборка пока падает на отсутствующих типах и синтаксических ошибках в текущем коде.
- `npm -w packages/no-simulation-guard run build`: успешно; CLI guard собран и готов к запуску.
  - @claude/cli-extras: не найдены типы `@claude/fs-patch`, `@claude/permissions-linter`.
  - @claude/permissions-linter: top-level `await` требует обновления `tsconfig`.
  - @claude/settings-schema: tsconfig не находит входных файлов.
  - @claude/shell-runner: синтаксическая ошибка в `src/bash.ts` (незакрытая строка).
- Примечание: команды выполнялись под Node 22.19.0 из-за отсутствия локально Node 18; требуется обсудить необходимость фикса на Node 18.

## Проверка синхронизации артефактов (2025-09-18)
- `tsconfig.base.json` и `Makefile` совпадают с версиями из `contributing/`.
- `README.md` отличается от `contributing/README.md`; различия существовали до изменений, корректировка не потребовалась.

## Черновик описания PR "build: align tooling prerequisites for claude-code"
- Добавлены скрипты `gen:types`, `prepare` и зависимости (`fast-check`, `json-schema-to-typescript`, `husky`, `@commitlint/cli`, `@commitlint/config-conventional`).
- Обновлён `package-lock.json` после `npm install`.
- Инициализирован husky в корне; перенесены хуки `commit-msg`, `pre-commit` с исполнением через `bash`.
- Добавлен `commitlint.config.cjs` для conventional commits.
- Обновлён `scripts/prep-pr.sh` (POSIX-совместимость, shebang `sh`).
- `.gitignore` уже содержит `contributing/`; проверена консистентность базовых артефактов (`tsconfig.base.json`, `Makefile`).
- Husky hooks требуют наличия `bash`; на Windows используем Git Bash или WSL (соответствует contributing).
- Тесты: `npm ci` (OK), `npm run build` (ошибки в текущем коде, задокументированы).

## Node.js runtime alignment (2025-09-18)
- Установлен Node.js v18.20.4 (LTS) в `$HOME/.local/node-v18.20.4-linux-x64`.
- Все будущие npm-скрипты будут выполняться с `PATH="$HOME/.local/node-v18.20.4-linux-x64/bin:$PATH"` для соответствия основному репозиторию.

- `npm ci` (Node v18.20.4): повторно успешен с теми же предупреждениями.
- `npm run build` ещё не повторяли после переключения на Node 18 (ошибки будут устранены в рамках следующих разделов).

## No-simulation guard (2025-09-18)
- Пакет: `packages/no-simulation-guard` (CLI `claude-guard`). После `npm -w packages/no-simulation-guard run build` доступен бинарь `node_modules/.bin/claude-guard`.
- Запуск перед ревью: `git diff --patch > /tmp/claude-guard.diff` и `PATH="$HOME/.local/node-v18.20.4-linux-x64/bin:$PATH" npx -w packages/no-simulation-guard claude-guard --repo . --patch /tmp/claude-guard.diff --strict --json`.
- Блокирующие срабатывания (severity=block, confidence ≥ 0.85 или эскалации) запрещают отдавать изменения пользователю до устранения.
- Добавлен к обязательному проверочному циклу вместе с `npm run build` и `npm test`.

## Permissions linter sync (2025-09-18)
- Сравнил `packages/permissions-linter` с contributing версией: новые бинарники (normalize), обновлённые lint-правила (`BASH_ANY`, `BASH_QUOTES`), gitignore-утилиты и risk анализатор.
- Принято решение синхронизировать `src/`, `bin/`, `test/`, `tsconfig.json`, `package.json` из contributing.

## Permissions linter verification (2025-09-18)
- Sync выполнен из contributing (`src/`, `bin/`, `test/`, `package.json`, `tsconfig.json`), добавлен CLI `claude-permissions-risk` и экспорт `riskScore`.
- Обновил `docs/getting-started/setup-wizard.md` разделом про новые предупреждения (`BASH_ANY`, `BASH_QUOTES`, `BASH_COLON`) и команду нормализации.
- CLI extras: команда `permissions` теперь проксирует `lint|fix|show|coverage|normalize|risk` через бинарники, `dry-run` оставлен inline.
- Сборка: `npm -w packages/permissions-linter run build` (Node v18.20.4) — успешно.
- Тесты: `node --test packages/permissions-linter/dist/test/*.js` — все 7 тестов зелёные (включая property-based).
- Быстрые проверки: `npx -w packages/permissions-linter claude-permissions-lint -- $(pwd)/examples/project/.claude/settings.json` и `claude-permissions-normalize` на временной копии — команды отработали успешно.
- `npm -w packages/cli-extras run build` пока падает (не найдены типы `@claude/fs-patch`, `@claude/permissions-linter`); ожидаемо из-за незавершённых задач §3/§4.
- `claude-guard` (empty diff while файлы не в git): pass, findings=0.
- Черновик PR (RFC-001): добавлены диагностические коды Bash, gitignore matching, CLI `normalize/risk`, обновлены tests/docs; тесты (`npm -w packages/permissions-linter run build`, `node --test dist/test/*.js`), команды lint/normalize по sample, guard = pass.

## fs-patch alignment (2025-09-18)
- Скопирован код из `contributing/packages/fs-patch` и доработан: удалил дубли импортов, реализовал allowCreate/allowDelete, файловые блокировки и diff3-merge с учётом CRLF/atomic перезаписи.
- CLI `claude-fs-apply-patch` теперь поддерживает флаги `--allow-create`, `--allow-delete`, `--allow-conflict-merge`, `--lock`, `--lock-timeout`, `--lock-poll`, `--lock-stale`, `--no-atomic`, `--base`.
- Документ `docs/rhpv.md` обновлён описанием новых возможностей (lock/diff3/normalize).
- Тесты: `npm -w packages/fs-patch run build`, `node --test packages/fs-patch/dist/test/*.js` (все 3 теста зелёные после фикса временных директорий).
- Smoke: `node dist/bin/claude-fs-apply-patch.js <tmp README> /tmp/fs-smoke.patch` → { ok: true, newHash } (ручная проверка патча).
- `npm -w packages/cli-extras run build` всё ещё падает на импортах `@claude/fs-patch`/`@claude/permissions-linter` — ожидаем решить после завершения §3/§4 синхронизации всего монорепо.
- `claude-guard` на diff → pass (findings=0).

## Shell runner updates (2025-09-18)
- Переписал `packages/shell-runner` с поддержкой безопасного окружения, временных скриптов, таймаутов и fallback-логики (`bash → pwsh → cmd` с запасным `powershell.exe`).
- Обновлены run-helpers: новые опции `input`, `onStdout/onStderr`, `redact`, `capture`, `strictMode`, `safeEnv`, файловые блокировки не требуются.
- Добавил тесты `order.test.ts` для проверки порядка fallback и уважения `SHELL_RUNNER_SHELL`.
- Сборка/тесты: `npm -w packages/shell-runner run build`, `node --test packages/shell-runner/dist/test/*.js`.
- Документация (`docs/ru/README-ru.md`) дополнена описанием fallback и переменной `SHELL_RUNNER_SHELL`.
- `npm -w packages/cli-extras run build` всё ещё падает (отсутствуют типы `@claude/fs-patch`, `@claude/permissions-linter`), зафиксировано для следующих этапов.
- `claude-guard` на diff после изменений → pass (findings=0).

## Stream checkpoints validation (2025-09-18)
- Синхронизирован пакет `@claude/stream-checkpoints`: строгое сопоставление corrId/stepId, Ajv-схема и генерация типов через `json2ts` (см. `schema.json`, `schema.d.ts`).
- CLI `claude-stream-validate` теперь валидирует и по схеме, и по логическим правилам.
- Добавлены тесты (`validate.test.ts`, `steps.test.ts`) и schema-driven типы (`types.ts` → экспорт из `schema.d.ts`).
- Команды: `npm run gen:types`, `npm -w packages/stream-checkpoints run build`, `node --test packages/stream-checkpoints/dist/test/*.js` — успешно.
- `claude-guard` по diff — pass (findings=0).

## CLI extras surface (2025-09-18)
- Перенёс `@claude/cli-extras` из contributing: команды `verify` (агрегирует lint/coverage/risk/doctor) и `doctor` (окружение), TTL для `session start`, новые пути для bypass.
- Обновил зависимости: CLI теперь ссылается на локальные пакеты (`@claude/fs-patch`, `@claude/permissions-linter`, `@claude/settings-schema`).
- Исправил `verify` для работы с локальными workspace-бинарями (`npx --no-install`) и добавил fallback на прямой вызов скрипта `@claude/settings-schema`.
- Smoke: `node packages/cli-extras/dist/bin/cli.js doctor`, `... session start --ttl 1m --ephemeral`, `... session cleanup`, `... verify examples/project/.claude/settings.json examples/tools.json` (все завершились успешно, verify вернул exit 0).
- `npm -w packages/cli-extras run build` — успешно.
