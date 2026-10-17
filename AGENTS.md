# AGENTS.md — Agent Rules (Interview)

Universal rules for AI agents working on the Next.js interview-prep app: develop, test (including runtime) and debug via MCP.

## This project — documentation map

| File | Role |
| ---- | ---- |
| `task.md` | ТЗ: задание, условия, структура приложения, приёмка, запреты |
| `report.md` | Knowledge base: tooling facts, dev-cycle status, pitfalls & dead ends — **read first** |

## Documentation discipline

- At the START of any task, read all relevant project `.md` docs (start with `report.md`).
- After finishing work, UPDATE the affected docs so facts stay current — no stale paths, offsets, or hashes.
- Docs hold FINAL FACTS + PITFALLS ONLY — no history, no process narration.
- New findings / pitfalls → `report.md` ("Pitfalls & dead ends").
- All docs and user communication — in Russian.

## Subagent discipline

Always use CONTINUABLE subagents (run_in_background: true). NEVER EVER USE ONE-SHOT SUBAGENTS. All subagents should be run sequentially — no parallel jobs.

- One task per subagent, with a self-contained spec (exact paths, commands, expected outputs).
- The coordinator does not implement — read-only grounding only. Subagents (workspace-write sandbox, approvals disabled) cannot launch executables or escalate — all exe/runtime work is done by the coordinator.

## Engineering principles

- Verify results at the artifact level — exit codes, build output, rendered DOM, HTTP status — not just "it ran".
- Keep ONE canonical source of truth for tooling facts (`report.md`).
- Record pitfalls and dead ends as final facts in the knowledge base, never as history.
- Document every dead end in one line so it is never retried.

## MCP tooling (playwright, context7)

- `playwright` — runtime-тесты и дебаг: `navigate` → `snapshot` (accessibility-дерево, `browser_snapshot`) → `console_messages` → `network_requests` → `evaluate`. `snapshot` — **основной** инструмент: по его refs выполняются все действия (click/type/hover). `take_screenshot` (`browser_take_screenshot`) — **только финальная визуальная верификация** (по скриншоту действия выполнять нельзя). Требует запущенный dev-сервер на `http://localhost:3000`.
- `context7` — актуальная документация библиотек: Next.js → `/vercel/next.js`. Использовать для API Next 16 и breaking changes (см. блок nextjs-agent-rules ниже).
- HMR-WebSocket-ошибки в playwright-браузере (`ERR_INVALID_HTTP_RESPONSE` на `/_next/hmr`) — артефакт окружения, НЕ баг приложения: фильтровать при проверке console (доказательство — `report.md`, Pitfalls).
- Артефакты playwright лежат в `%LOCALAPPDATA%\Temp\playwright-mcp-output` — не в workspace, не чистить корень проекта.

## Environment (this machine)

- Windows PowerShell 5.1 only (`powershell.exe`; `pwsh` is NOT installed). Сложные строки — temp `.ps1` + `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <ps1>`; call-operator `& "$env:..."` отклоняется парсером dsh-allow — не использовать.
- Node v24.13.1: `C:\Program Files\nodejs\node.exe` (npm 11.10.0). System HTTPS (schannel) is broken (`SEC_E_NO_CREDENTIALS`) — use Node for network. Node ≥ 19 cannot spawn `.cmd` without a shell — call `node.exe` directly. Inline `node -e` with quotes is mangled — use temp `.mjs` files and delete them after.
- git 2.46.0.windows.1 · pnpm 12.4.1 · gh 2.102.0 (portable: `C:\Users\USER\AppData\Roaming\npm\gh.exe`, НЕ авторизован) · vercel 63.0.1 (npm global).
- Sandbox (workspace-write) режет spawn дочерних процессов из node (`spawn EPERM`): `npm install`, `next build`, `next dev` — запускать только под `danger-full-access`. Прямой `node.exe` из PowerShell в confined-режиме работает.
- npm-операции: задавать `npm_config_cache=E:\dev\Web\Interview\.tmp\npm-cache` (дефолтный кэш не пишется).

## Ground truth (this project)

- Версии: `next 16.4.0`, `react`/`react-dom 19.3.0`, `typescript 5.9.3` (`strict: true`), `tailwindcss 4.3.3`, `eslint 9.39.5`. Сборка — Turbopack по умолчанию.
- Scripts: `dev` / `build` / `start` / `lint`. `next dev` — фоновой job'ом, затем runtime-проверки через playwright, затем kill.
- Workspace — git-репозиторий, но коммитить и пушить тебе НЕЛЬЗЯ - спрашивай разрешение пользователя.

## Root allowlist (workspace)

Project root must contain ONLY:

- `AGENTS.md`, `report.md`, `task.md`
- `app/`, `components/`, `lib/`, `public/` — код приложения
- `node_modules/`, `.git/`, `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `next-env.d.ts`, `.gitignore`
- `.next/` — артефакт сборки (gitignored, регенерируется `next build`)
- `.tmp/` — temp-скрипты и npm-кэш: удалять после использования

Temp scripts (tmp-*.mjs, tmp-*.ps1 etc.) must be deleted after use.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
