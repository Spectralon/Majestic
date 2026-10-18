# AGENTS.md — Agent Rules (Majestic)

Universal rules for AI agents working on **Majestic**: a server-authoritative item system in Node.js + TypeScript (interview task). Development, build, typecheck and tests (including runtime) are performed by the coordinator; verification is done against artifacts.

## This project — documentation map

| File | Role |
| ---- | ---- |
| `task.md` | Spec: the task, conditions, application structure, acceptance criteria, prohibitions |
| `report.md` | Knowledge base: code facts, architecture, pitfalls & dead ends — **read first** |

## Documentation discipline

- At the START of any task, read all relevant project `.md` docs (start with `report.md`).
- After finishing work, UPDATE the affected docs so facts stay current — no stale paths, offsets, or hashes.
- Docs hold FINAL FACTS + PITFALLS ONLY — no history, no process narration.
- New findings / pitfalls → `report.md` ("Pitfalls & dead ends").
- All docs and user communication — in Russian.

## Subagent discipline

Always use CONTINUABLE subagents (run_in_background: true). NEVER EVER USE ONE-SHOT SUBAGENTS. All subagents should be run sequentially — no parallel jobs.

- One task per subagent, with a self-contained spec (exact paths, commands, expected outputs).
- The coordinator does not implement — read-only grounding only. Subagents (workspace-write sandbox) cannot launch executables or escalate — all exe/runtime work (`tsc`, `tsx`, `node`) is done by the coordinator.

## Engineering principles

- Verify results at the artifact level — exit code, typecheck/test output (PASS/FAIL), HTTP status — not just "it ran".
- Keep ONE canonical source of truth for tooling facts (`report.md`).
- Record pitfalls and dead ends as final facts in the knowledge base (`report.md`), never as history.
- Document every dead end in one line so it is never retried.

## Code rules (fixed by the user)

- Code is written clean, **without comments or TODO markers** (they never land in commits — the user strips them).
- Method stub with a return type: `throw new Error("Not implemented")` — that is code, not a comment; it does land in commits.
- Commits are made by the user; the coordinator only prepares files and verifies. The workspace is **not** a git repository.
- **Constructors:** a ctor only receives and stores references to the services it needs (DI). Creating objects inside a constructor is forbidden. Creation/initialization — in separate methods (`initialize()` pattern). The factory is stateless: it does not hold `WorldState`, and there are no "already created" checks.
- **Owner of `WorldState`** — `GameLoopService`: creates the world in `initialize()` via the factory; exposed outward only through the readonly getter `world`. Services do not receive `WorldState` in constructors — they either hold a reference to `GameLoopService` or receive the world as a method argument (`EffectService.tick(world)`).
- **Validator naming:** `validate<Thing>` (the method THROWS on error and returns the value). Names of the form `valid<Thing>` are forbidden — they look like a boolean check.
- **Encapsulation:** the owner of a state validates its own fields; items/services NEVER clamp or validate numbers — they only call the owner's methods (Medkit: `player.addHP(this.addHP)`).
- Private variable names start with an underscore `_`.

## Environment (this machine)

- Windows PowerShell 5.1 only (`powershell.exe`; `pwsh` is NOT installed). Complex strings — a temp `.ps1` + `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <ps1>`; the call operator `& "$env:..."` is rejected by the dsh-allow parser — do not use it.
- Node v24: `C:\Program Files\nodejs\node.exe`. System HTTPS (schannel) is broken (`SEC_E_NO_CREDENTIALS`) — use Node for network. Node ≥ 19 cannot spawn `.cmd` without a shell — call `node.exe` directly. Inline `node -e` with quotes is mangled — use temp `.mjs` files and delete them after.
- Sandbox (workspace-write) cuts off child-process spawns from node (`spawn EPERM`): `tsc` / `tsx` / `node` (build/test) — run only under `danger-full-access`. In this workspace `pwsh` itself hits a sandbox-ACL error (`SetNamedSecurityInfoW Win32 5`) — read files via `read`/`glob`, not via the shell.

## Ground truth (this project)

- Stack: Node.js + TypeScript (`strict: true`), `ws` for the WS server. tsconfig: `target ES2022`, `module`/`moduleResolution NodeNext`, `rootDir src`, `outDir dist`.
- Versions (installed): `typescript 5.9.3`, `tsx 4.23.15`, `ws 8.22.0`, `@types/node 24.19.2` (declared in package.json: `^5.9.3` / `^4.19.0` / `^8.18.0` / `^24.0.0`).
- Scripts: `build` (tsc) / `start` (node dist/entry.js) / `test` (tsx src/test/runner.ts) / `typecheck` (tsc --noEmit).
- Commands (run by the coordinator, under `danger-full-access`):
  - typecheck: `node.exe node_modules\typescript\bin\tsc --noEmit --project tsconfig.json`
  - test: `node.exe node_modules\tsx\dist\cli.mjs src\test\runner.ts`
  - build: `node.exe node_modules\typescript\bin\tsc`
- Server: HTTP + WS (ports from `StaticDataService.config`). Runtime check — the scenario in `src/test/runner.ts` (smoke: drop→pickup, expiry by timeout, `use` effect, concurrent pickup).

## Root allowlist (workspace)

Project root must contain ONLY:

- `AGENTS.md`, `report.md`, `task.md`
- `src/` — application code (`entry.ts`, `types.ts`, `core/`, `services/`, `storage/`, `items/`, `server/`, `utils/`, `test/`)
- `node_modules/`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`
- `dist/` — build artifact (regenerated by `npm run build`)
- `.idea/` — IDE (JetBrains)
- `README.md` — required by the spec (how to run + architecture overview)

Temp scripts (tmp-*.mjs, tmp-*.ps1 etc.) must be deleted after use.
