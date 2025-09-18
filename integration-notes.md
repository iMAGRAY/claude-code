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

