# Task C: Manual ledger

Status: done. Date: 2026-11-03.
Backlog item: `epics/agento/001-seed/backlog/C-ledger.md`. Checkout/branch/HEAD: `C:\code\agento`; `main` tracking `origin/main`, ahead by 1; `3283807afee076d2d4cf1ee24c44ba1df20576da` (`Spikes A, B implemented`). The work is uncommitted. Origin is `https://github.com/exones/agento.git`. No push, PR, merge, release, or npm publication was performed. The index was not changed. Two backlog files were already staged (`A-preflight.md`, `B-foundation.md`) and were left staged.

## Outcome

C implements the corrected schema 1 manual ledger. `init`, `new`, `status`, and `story add/start/block/complete` run as separate processes against `<root>/.crew/`. Kinds are `story`, `task`, and `spike`. Completion stores `acceptance: "manual"` and status prints `evidence: manual record; not gate acceptance`. The CLI does not call T3, Git, or the network, and it does not edit `epics/`.

`state.json` is authoritative. A mutation writes `state.json.tmp`, syncs and closes that handle, then renames the temp file directly over `state.json` in the same directory. The live state file is not unlinked or renamed away first. `events.jsonl` is append-only. Complete revisions must be the contiguous prefix `1..N`. Status can warn when that prefix lags a valid state. A mutation refuses a gap, an ahead revision, a duplicate or skipped revision, and a partial trailing line. `init` of valid schema 1 is idempotent and does not repair an unhealthy event log.

Help, version, and genuine unknown-command behavior remain. `task`, `spike`, `story resume`, `story cancel`, and `story set` are unknown. `private` remains `true`. No dependency was added. `scripts/Install-NodeToolchain.ps1` was not edited.

Acceptance mapping:

- Scenarios 1–6 passed on this Windows machine, in temporary roots whose paths contain a space, with separate processes for the CLI lifecycle.
- Planted layouts, the lock timeout, concurrent init, concurrent adds, pre-commit replacement failure, and post-commit append failure passed.
- The local gate is `pwsh -NoProfile -File .\scripts\Verify.ps1`. It passed after the suite was complete. Remote CI was not run. Linux was not run.

## Evidence

| Check | Exact command or method | Result | Revision/log/CI/PR link |
| --- | --- | --- | --- |
| Verify | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. Toolchain Node `v26.13.0` (`C:\code\agento\.tools\node\node-v26.13.0-win-x64\node.exe`), npm `11.20.0` (bundled `npm-cli.js`). Typecheck, build, then `test: every suite under test/`. | Local only. No commit. |
| Test runner | `node --test --test-reporter spec test` inside that gate | 3 suites, 38 tests, 38 passed, 0 failed, 0 skipped. Duration about 13.2 s. | Local only. |
| PowerShell | `(Get-Command pwsh).Version` after the gate | `7.6.9.0`. | Local only. |
| Repository `.crew` | `Test-Path .\.crew` after the gate | False. | Local only. |
| Remote CI | Not run. No push. | `.github/workflows/ci.yml` is unchanged from B. There is no Actions run URL. | Unverified. |
| Linux | Not run. | Junction, directory-symlink, chmod, and rename results below are Windows Node 26 only. | Unverified. |

Suite counts from the gate output:

- `agento help, version, and unknown commands`: 8 passed.
- `ledger preservation and failure boundaries`: 19 passed.
- `manual ledger lifecycle`: 11 passed.

### Scenario results

| Required case | Where it ran | Outcome |
| --- | --- | --- |
| 1. Lifecycle for story `S`, then task `T` and spike `K` | `test/ledger.test.ts`, separate `dist/cli.js` processes, temp path containing a space | Passed. Stdout lines match the contract, including `resumed` and `completed ... manual`. Final text status is revision 16 with three `done` items. Events are revisions 1..16 with LF newlines and no CR. `createdAt` stays fixed. |
| 2. New-process `status --json` after start | Same lifecycle test, before block | Passed. Revision 3, `eventsRevision` 3, `eventsLag` false, note `operator note`, next `Write the ledger.`. |
| 3. Invalid transitions and duplicates | `invalid transitions and duplicate ids leave accepted bytes unchanged` | Passed, exit 2, both files byte-for-byte unchanged. Covered: start from `done`, complete from `backlog`, complete from `blocked`, block from `backlog`/`done`/`blocked`, second start of an `in-progress` item, duplicate item, duplicate epic, unknown epic, unknown item, status of an unknown epic. |
| 4. Repeated init and new | Repeated-init test, plus the duplicate-epic case above | Passed. Second `init` prints `already initialized schema 1` and leaves bytes unchanged, including when the event file has a partial `{` tail. Repeat `new` exits 2. |
| 5. Safe paths | Argument, null-byte, missing-root, symlink-root, junction, and link tests | Passed on Windows. `..`, `DEMO-001/../NO`, and `DEMO-001\NO` exit 1 and create no ledger file. A missing `--root` stays absent. A file used as `--root` exits 1. A symlinked root creates `.crew` in the real directory. |
| 6. Preservation table | `test/ledger-failures.test.ts` | Passed. Details are in the next table. |

### Planted layouts and fault injection

| Layout or fault | Result |
| --- | --- |
| Schema 2, invalid JSON `{`, missing schema, extra key, negative revision | Exit 3. Bytes unchanged for both `story add` and `init`. |
| Stale `state.json.tmp` containing revision 999, plus an operator `.bak` | Status reports revision 0 from `state.json`. A later successful `new` removes the regular temp and leaves the backup. |
| Invalid state or invalid transition with a diagnostic temp | Exit 3 or 2. Temp remains. |
| `.crew` containing only `notes.bak` | `init` exits 3, `error: .crew is not an empty ledger directory; state preserved`. No `state.json` is created. |
| `events.jsonl` replaced by a directory after a valid init | Second `init` still prints `already initialized schema 1` and leaves the directory. Status exits 3, `error: events must be regular files`. |
| Missing `state.json` with temp, backup, and events present | Exit 3, `error: state file missing`. Nothing is promoted. |
| Partial trailing `{` on a complete matching prefix | Status exits 0 and warns. Mutation exits 3 with `error: events log ends with a partial line; state preserved`. Bytes unchanged. |
| Partial tail plus a short contiguous prefix | Status warns about the partial line, then the lag. JSON reports `eventsLag` true. Mutation uses the partial-line error and writes nothing. |
| Contiguous prefix behind state | Status shows the committed items and the lag warning. Mutation exits 3 with `error: events lag state; mutation refused; state preserved`. |
| Missing event file at revision greater than 0 | Status warns `warning: events file missing; not repaired` and does not also print the lag sentence. JSON `eventsRevision` is null and `eventsLag` is true. Mutation uses the lag error. The file stays absent. |
| Missing event file at revision 0 | Status warns and reports `eventsRevision` 0, `eventsLag` false. The next `new` creates event revision 1. |
| Event revision 9 above state, with a partial tail | Status and mutation exit 3 with `error: events ahead of state; state preserved`. |
| Duplicate revision 1, and skipped revision 2 | Status and mutation exit 3 with `error: events log invalid; state preserved`. |
| Junction and directory symlink at `.crew` | `init` exits 1. A later command exits 3. Both use `error: .crew must be a real directory inside the project root`. The target marker is unchanged. Node 26 `lstat` reports both as symbolic links. |
| Symlinks for `state.json`, `events.jsonl`, and `state.json.tmp` | Exit 3 with the regular-file errors. Targets unchanged. The symlink remains. |
| Two concurrent `init` processes | Both exit 0. One ledger, revision 0, empty events, lock released. |
| Two concurrent adds of different ids | Both exit 0. Both items stored. Revision increased by 2. Events 1..3. |
| Held `.crew/lock` | Exit 4, `error: state lock held at .crew/lock`, after the 5000 ms budget and before 15 seconds (observed about 5.3 s). Bytes unchanged. The lock directory remains. |
| `chmod 0o444` on `state.json` before rename | Exit 5, `error: cannot write state`. Previous bytes unchanged. Temp remains and contains the uncommitted next document. No elevation was required. Mode observed earlier as producing `EPERM`. |
| `chmod 0o444` on `events.jsonl` after a committed rename | Exit 5, `error: state updated to revision 2 but the event append failed; not rolled back`. State is revision 2. Events stay at revision 1. Status warns about lag. A later add exits 3 and does not hide the gap. |
| Injected `replaceTemp` throw while the live `state.json` is still present | Exit 5, `error: cannot write state`. Previous bytes unchanged. Temp remains. The seam checks the live path and the same-directory names `state.json.tmp` and `state.json`. |
| Injected append writes a complete revision-2 line, then throws | Exit 5 with the not-rolled-back line. Status then exits 0 with matching revisions and `eventsLag` false. |
| Injected empty-events creation failure after init's revision-0 replace | Exit 5, `error: state updated to revision 0 but the event append failed; not rolled back`. State exists. Events file is absent. Status warns that the events file is missing. A later `new` succeeds. |
| Injected init replace failure | Exit 5, `error: cannot write state`. No `state.json`. Temp remains. A second `init` exits 3 because the directory is not empty. Lock is released. |

The chmod cases are real filesystem failures. The injected cases use the `LedgerIo` argument of `run()` in `src/main.ts`. There is no public debug command and no production fault flag.

Help and version coverage still includes no arguments, `--help`/`-h`, known-command help, `--version`/`-v` with extra arguments, unknown commands (`task`, `spike`, `story resume`, `story cancel`, `story set`, and an unknown word), and option errors (unknown, duplicate, invalid, missing value) before any root is created. `--json` is rejected on commands other than `status`, including an unknown command word, before the unknown-command error.

## Decisions

- No new package. TypeScript `7.0.2` and `@types/node` `26.6.6` stay as B left them. `package-lock.json` was not edited.
- Tests import `./helpers.ts`. `tsconfig.json` sets `allowImportingTsExtensions` for the no-emit typecheck. `tsconfig.build.json` turns it off so `src/` still emits. The in-process loader imports `../dist/main.js` through a non-literal specifier, so typecheck does not require `dist/` to exist first. The gate builds before tests.
- `package.json` `test` is `node --test --test-reporter spec test`. `helpers.ts` does not match Node's test filename pattern, so it is not a suite. `Verify.ps1` prints `test: every suite under test/` and then runs that script.
- Lock: exclusive `mkdir` of `.crew/lock`, first try immediate, retry every 100 ms until 5000 ms after the first try, `rmdir` on the paths this process acquired. `ENOENT` on release is ignored. No pid inspection and no steal. `EACCES`, `EPERM`, `EROFS`, and `ENOSPC` on `mkdir` exit 5 with `error: cannot write state`.
- Replacement is `fs.promises.rename` of the temp file onto `state.json`. There is no unlink-first fallback. The writer opens the temp with `wx`, writes UTF-8, `sync`s, then closes before the rename. The event append opens with `a`, writes one `\n`-terminated line, `sync`s, and closes.
- `init` creates `.crew` only after the root and the link/`lstat` checks. Argument failures return before that. A link is classified by `lstat.isSymbolicLink()` before `isDirectory()` or `isFile()`. On this Node 26 Windows build, junctions are symbolic links. `O_NOFOLLOW` is undefined here, so the open path does not pass that flag; the link is rejected by `lstat` before `readFile`.
- A valid schema 1 `init` does not read the event file. Unhealthy events, including an events path that is a directory, stay in place. Absent `state.json` with any directory entry other than the lock exits 3.
- One `Date.toISOString()` value is used for every timestamp a command updates. Omitted `--next` uses the contract defaults. Omitted `--note` stores null on add and keeps the existing note later. Explicit `--note` replaces it. The event `note` is the command's explicit note, null when omitted.
- Parser order: option syntax, allow-list, help, version, then positionals and option values. A known command's `--help` describes that command even if extra operands are present. An unknown command word combined with a flag outside `--root`, `--help`, and `--version` is `error: unknown option` before the unknown-command error. When option syntax is valid and help is absent, `--version` still short-circuits, including for an unknown command word. The missing story subcommand is reported as `error: missing required argument: subcommand`. The contract does not name that argument; this is the routine label.
- When a partial trailing line and a short valid prefix both apply, status prints the partial warning and then the lag warning. The mutation error is the partial-line error. A complete short prefix with no partial tail uses the lag error. Ahead revisions are reported before continuity errors.
- Init's empty event file is created after the revision-0 state replace. If that creation fails, the command uses the contract's post-commit line with revision 0. There is no separate init error string.
- `JSON.parse` keeps the last value for duplicate keys. Those objects are not rejected as invalid JSON. Duplicate epic and item ids inside a parsed document are rejected.
- The contract was not changed.

## Open points

- Remote Windows and Linux Actions have not run. Who can produce that evidence: the coordinator or user, by committing and pushing. C was not allowed to push.
- Linux symlink, `O_NOFOLLOW`, rename-over, and permission behavior were not executed here. Windows junction and directory-symlink coverage passed on Node `v26.13.0`.
- A kill or power loss during rename or sync is untested. Same-directory replacement is not a filesystem crash-durability claim.
- `SHASUMS256.txt.sig` remains unverified from B. The toolchain used for this gate is the already installed `.tools/node/node-v26.13.0-win-x64` tree.
- Node's `spawn` rejects a U+0000 argument (`ERR_INVALID_ARG_VALUE`) before the CLI starts. The null-byte rejection is proven by calling `run()` in-process. Newline, tab, and U+0007 were rejected through separate processes. No ledger directory was created in either case.
- npm account, scope, and trusted publishing remain publication prerequisites. They do not block C or the later assignment of D. The package stays `private: true`.
- Precedence when a partial tail and a lagging prefix occur together is the interpretation above. If the coordinator wants the lag sentence to win that mutation, it is a one-message change.

## Resume

Coordinator: review this report and the local gate, then update the shared epic row and current checkpoint. The next backlog item is D, package and bootstrap proof. D's dependency is C's local gate, which passed here. D is ready to assign after that acceptance. It was not started, and it is not ready for review because no D candidate exists.

## Proposed shared status

Set C to `in-review` until the coordinator accepts the evidence. Suggested epic row:

```text
| C | story | F1 | [Manual ledger](backlog/C-ledger.md) | B local gate accepted | in-review | [reports/C.md](reports/C.md); local verify passed on Node v26.13.0; remote CI unrun |
```

In `checkpoints/current.md`, record HEAD `3283807afee076d2d4cf1ee24c44ba1df20576da`, uncommitted C ledger work plus the existing planning changes, local gate passed (38 tests), remote CI not run, Linux not run, and the next action as review of `reports/C.md` before assigning D. Leave D at `backlog` until that review accepts C.
