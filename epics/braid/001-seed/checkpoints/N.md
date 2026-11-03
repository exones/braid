# Checkpoint N

Updated: 2026-11-03.
Task: N, rename pre-release storage from `.crew/` to `.agento/`. Submitted for coordinator review. Not started: D.
Checkout: `C:\code\agento`. Branch: `main`, tracking `origin/main`, ahead by 1 commit. HEAD: `3283807afee076d2d4cf1ee24c44ba1df20576da` (`Spikes A, B implemented`). Origin: `https://github.com/exones/agento.git`.
Commit/push state: this assignment did not stage, commit, push, open a PR, merge, publish, or change the index. The index had no staged paths at start and still has none. Pre-existing unstaged and untracked files were left in place.
Controller: bootstrap `agento-coordinate` skill and files; no released CLI.
Worker: Grok 4.7 in the shared checkout. This file is the worker checkpoint. `epic.md` and `checkpoints/current.md` were not edited.

## Done

- Schema 1 ledger paths, help, and errors use `.agento/`. Internal names `crew`, `paths.crew`, `ensureCrewForInit`, and `ensureRealCrew` are now `STORAGE_DIRECTORY`, `paths.dir`, `ensureStorageForInit`, and `ensureRealStorage`.
- Schema, transitions, lock budget, same-directory replacement, and event rules are unchanged. There is no alias, migration, or deletion of a pre-existing `.crew/` directory.
- Tests keep the previous failure, concurrency, path, and manual-evidence expectations on the new paths. One added test checks that an old `.crew/` directory stays byte-for-byte in place while `init` and `new` write only `.agento/`.
- `.gitignore`, README storage and usage wording, `docs/seed-contract.md`, `docs/cli-name.md`, and the storage sentence in `AGENTS.md` agree on `.agento/` and state that old disposable ledgers are not moved.
- Local gate last passed: `pwsh -NoProfile -File .\scripts\Verify.ps1` exit 0. Node `v26.13.0`, npm `11.20.0`, PowerShell `7.6.9`. 3 suites, 39 tests, 39 passed. Repository `.crew` and `.agento` were absent.

## In flight

None.

## Last check

`pwsh -NoProfile -File .\scripts\Verify.ps1` on 2026-11-03. Exit 0. Printed toolchain Node `v26.13.0` (`C:\code\agento\.tools\node\node-v26.13.0-win-x64\node.exe`) and npm `11.20.0`, then typecheck, build, `test: every suite under test/`, and 39 passing tests. `Test-Path -LiteralPath .\.crew` and `Test-Path -LiteralPath .\.agento` were both false. `git diff --cached --name-only` was empty.

## Blockers

No user-owned blocker for N. Remote Actions execution is unverified because this assignment must not push. Linux was not run on this machine. A pre-release `.crew/` ledger is not imported; an operator who still has one starts a new `.agento/` ledger.

## Next concrete action

Coordinator: review `reports/N.md` and the local gate. On acceptance, mark N in review in `epic.md` and `checkpoints/current.md`. Do not mark N Done from this local gate. README progress cleanup and the Git/PR transition stay with the coordinator. Do not start D from this checkpoint.

## Files changed for N

Edited: `src/ledger-fs.ts`, `src/ledger.ts`, `src/help.ts`, `test/helpers.ts`, `test/cli.test.ts`, `test/ledger.test.ts`, `test/ledger-failures.test.ts`, `.gitignore`, `README.md` (storage, usage, and ignore wording), `docs/seed-contract.md`, `docs/cli-name.md`, `AGENTS.md` (storage sentence), and the implementation checklist in `backlog/N-storage-name.md`.
Created: this checkpoint and `reports/N.md`.
Not edited: `epic.md`, `checkpoints/current.md`, historical reports and checkpoints, `docs/decisions.md`, backlog items B and C, inspiration, and the original MVP plan. The index was not changed.

## braid rename

Updated: 2026-11-03. The user accepted the later plan in `backlog/N-storage-name.md`.

The active command, package, and storage directory are `braid` and `.braid/`. `package.json` is public (`private: false`) at `braid@0.1.0`, with repository `git+https://github.com/exones/braid.git`. Pre-existing `.agento/` and `.crew/` directories are not migrated. Historical reports and sealed validation files still quote the former name.

Local `scripts/Verify.ps1` passed on Node v26.13.0: 40 tests, then a dirty-tree packed-install probe. Digest of that probe is not the publish identity. A clean proof follows the commit. GitHub repository creation and npm publish are the remaining steps.
