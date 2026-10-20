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
- The coordinator does not implement — read-only grounding only. Subagents (workspace-write sandbox) cannot launch child processes (`spawn EPERM`) or escalate — all exe/runtime work (`tsc`, `node`, tests) is done by the coordinator.

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
- **Owner of `WorldState`** — `GameLoopService`: creates the world in `initialize()` via the factory; exposed outward only through the readonly getter `world`. Services do not receive `WorldState` in constructors — they hold a reference to `GameLoopService` and read the world from its getter.
- **Validator naming:** `validate<Thing>` (the method THROWS on error and returns the value). Names of the form `valid<Thing>` are forbidden — they look like a boolean check.
- **Encapsulation:** the owner of a state validates its own fields; items/services NEVER clamp or validate numbers — they only call the owner's methods (Medkit: `player.addHP(this.addHP)`).
- Private variable names start with an underscore `_`.

## Environment (this machine)

- Windows PowerShell 5.1 only (`powershell.exe`; `pwsh` is NOT installed). Complex strings — a temp `.ps1` + `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <ps1>`; the call operator `& "$env:..."` is rejected by the dsh-allow parser — do not use it.
- Node v24: `C:\Program Files\nodejs\node.exe`. System HTTPS (schannel) is broken (`SEC_E_NO_CREDENTIALS`) — use Node for network. Node ≥ 19 cannot spawn `.cmd` without a shell — call `node.exe` directly. Inline `node -e` with quotes is mangled — use temp `.mjs` files and delete them after.
- Sandbox (workspace-write): direct launches of `tsc` / `node` (typecheck, build, tests) work without approval. Child-process spawns from node are blocked (`spawn EPERM`) — `tsx` (the esbuild service) does not work under workspace-write. `dsh-allow` rules do not lift the spawn block on Windows: the kernel fence is the harness's own, and rules are only compiled into profiles on macOS. A `dsh-allow` rule for `E:\dev` (all five capabilities, recursive) exists in `C:\Users\USER\.dsh\dsh-allow.json` (user-added, 2026-10-19) — it covers the pre-execute gate, not the kernel fence. As of 2026-10-19 the sandbox starts normally (the earlier `SetNamedSecurityInfoW Win32 5` no longer occurs).

## Ground truth (this project)

- Stack: Node.js + TypeScript (`strict: true`), `ws` for the WS server. tsconfig: `target ES2022`, `module`/`moduleResolution NodeNext`, `rootDir src`, `outDir dist`.
- Versions (installed): `typescript 5.9.3`, `tsx 4.23.15`, `ws 8.22.0`, `@types/node 24.19.2` (declared in package.json: `^5.9.3` / `^4.19.0` / `^8.18.0` / `^24.0.0`).
- Scripts: `build` (tsc) / `start` (node dist/entry.js) / `test` (tsx src/test/runner.ts) / `typecheck` (tsc --noEmit).
- Verification (run by the coordinator, under `workspace-write`, no approval): `.\verify.bat` — typecheck (`tsc --noEmit`) → build (`tsc` → `dist/`) → tests (`node dist\test\runner.js`, in-process, no child processes). The pipeline deliberately avoids `tsx`: esbuild spawns a coprocess — `spawn EPERM` under workspace-write.
- Server: HTTP + WS (ports from `StaticDataService.config`). Runtime check — the scenario in `src/test/runner.ts` (smoke: spawn HP/armor from config, `medkit.onUse` → maxHP, `advanceTick` → tick=1, snapshot with 1 player).

## Root allowlist (workspace)

Project root must contain ONLY:

- `AGENTS.md`, `report.md`, `task.md`
- `src/` — application code (`entry.ts`, `data.ts`, `core/`, `services/`, `storage/`, `items/`, `server/`, `utils/`, `test/`)
- `node_modules/`, `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`
- `dist/` — build artifact (regenerated by `npm run build`)
- `.idea/` — IDE (JetBrains)
- `README.md` — required by the spec (how to run + architecture overview)
- `verify.bat` — verification pipeline (typecheck → build → tests)

Temp scripts (tmp-*.mjs, tmp-*.ps1 etc.) must be deleted after use.
