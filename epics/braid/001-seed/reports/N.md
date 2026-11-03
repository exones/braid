# Task N: use agento for local storage naming

Status: done. Date: 2026-11-03.
Backlog item: `epics/agento/001-seed/backlog/N-storage-name.md`. Checkout/branch/HEAD: `C:\code\agento`; `main` tracking `origin/main`, ahead by 1; `3283807afee076d2d4cf1ee24c44ba1df20576da` (`Spikes A, B implemented`). The work is uncommitted. Origin is `https://github.com/exones/agento.git`. No stage, commit, push, PR, merge, release, or npm publication was performed. `git diff --cached --name-only` was empty before and after the edit. Pre-existing unstaged and untracked files were not reverted.

## Outcome

N renames the pre-release ledger directory from `.crew/` to `.agento/` in the running CLI, its internal storage identifiers, help, errors, tests, `.gitignore`, README storage and usage wording, the seed contract, and the current storage instruction in `AGENTS.md` and `docs/cli-name.md`. D18 supersedes C's original `.crew/` requirement. Schema 1, command transitions, the 5000 ms directory lock, direct same-directory replacement, and the event-prefix rules are unchanged.

A fresh root stores state, events, `state.json.tmp`, and `lock` only under `.agento/`. The CLI does not create, read, alias, migrate, or delete a `.crew/` directory. An existing `.crew/` directory and its files stay byte-for-byte in place, and `status` before `init` still reports `error: not initialized; run agento init`. README, the seed contract, and `docs/cli-name.md` say this unreleased correction does not move old disposable ledgers.

Historical reports, checkpoints, the original MVP plan, and inspiration were not rewritten. Backlog items B and C still name `.crew/` because that is the directory those assignments specified. `epic.md` and `checkpoints/current.md` were left for the coordinator. README progress wording outside storage and usage was left for the coordinator's later cleanup.

Local acceptance criteria 1–5 are met on this machine. That is not item Done. Done still requires a scoped commit, PR, hosted CI, review, and human-approved merge.

## Evidence

| Check | Exact command or method | Result | Revision/log/CI/PR link |
| --- | --- | --- | --- |
| Verify | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. Toolchain Node `v26.13.0` (`C:\code\agento\.tools\node\node-v26.13.0-win-x64\node.exe`), npm `11.20.0`. Typecheck, build, then every suite under `test/`. | Local only. No commit. |
| Test runner | `node --test --test-reporter spec test` inside that gate | 3 suites, 39 tests, 39 passed, 0 failed, 0 skipped. Duration about 14.5 s. The added test is `a pre-existing .crew directory is left untouched and is not the ledger`. | Local only. |
| PowerShell | `(Get-Command pwsh).Version` after the gate | `7.6.9.0`. | Local only. |
| Repository storage dirs | `Test-Path -LiteralPath .\.crew` and `Test-Path -LiteralPath .\.agento` after the gate | Both false. | Local only. |
| Index | `git diff --cached --name-only` | Empty. No staged paths. | Local only. |
| Remote CI | Not run. No push. | No Actions run URL. | Unverified. |
| Linux | Not run. | Junction, directory-symlink, chmod, and rename results are Windows Node 26 only. | Unverified. |

Suite counts from the gate output:

- `agento help, version, and unknown commands`: 8 passed.
- `ledger preservation and failure boundaries`: 19 passed.
- `manual ledger lifecycle`: 12 passed.

Acceptance mapping:

1. The lifecycle test runs the full story, task, and spike scenario in a temporary root whose path contains a space. At the end the root listing is only `.agento`, that directory contains `state.json` and `events.jsonl`, and `.crew` is absent. Failure tests still cover `state.json.tmp` and `.agento/lock` on those renamed paths.
2. Help says `Create an empty schema 1 ledger at .agento/.`. Error strings use `.agento`. The seed contract, README examples, `AGENTS.md`, `docs/cli-name.md`, and `.gitignore` use `.agento/`. Remaining `.crew` mentions in those current files describe the superseded name or the no-migration rule. Historical reports and checkpoints still record the name they observed.
3. The previous 38 tests passed after the path rename, including invalid transitions, planted layouts, lock timeout, concurrent init and adds, pre-commit replacement failure, and post-commit append failure. Expectations were retargeted to `.agento` and were not removed or loosened.
4. The new lifecycle test plants `.crew/state.json`, `.crew/events.jsonl`, and `.crew/notes.txt`, then runs `status`, `init`, and `new`. The old bytes and directory listing stay unchanged. The new ledger is schema 1 revision 1 with event revision 1, and it does not contain the planted revision 9. No migration code was added.
5. The verify command above passed. Hosted CI and Linux were not run.

## Decisions

- One directory constant, `STORAGE_DIRECTORY` in `src/ledger-fs.ts`, is `".agento"`. `LedgerPaths.crew` is `dir`. Init and lookup helpers are `ensureStorageForInit` and `ensureRealStorage`. Error text is built from that constant so the path and the messages stay the same string.
- No compatibility read of `.crew`, no alias, and no delete. A disposable pre-release ledger is left where it is. A new ledger starts with `init` under `.agento/`.
- The seed contract's storage section, scenario 1, and scenario 5 now name `.agento` and state the no-migration rule. Schema fields, exit codes, and write steps were not otherwise changed.
- B and C backlog text was not rewritten. Those items record the `.crew/` instruction those workers were given. C's report still matches that historical assignment.
- `docs/decisions.md` was not edited. D18 already selects `.agento/`; its log entry still says to apply the correction after C returns. This report is the record that the correction is applied.
- No package or lockfile change. `private` stays `true`.

## Open points

- Remote Windows and Linux Actions have not run. Who can produce that evidence: the coordinator or user, by committing and pushing. N was not allowed to push or stage.
- Linux symlink, `O_NOFOLLOW`, rename-over, and permission behavior were not executed here. The Windows results from C still apply to the renamed paths because the filesystem operations were not changed.
- A kill or power loss during rename or sync is still untested. Same-directory replacement is not a filesystem crash-durability claim.
- Operators with a disposable `.crew/` ledger from this pre-release tree are not migrated. They run `init` to create `.agento/` and leave or remove the old directory themselves.
- README still contains the coordinator's progress sentences. This task updated storage, usage, and the ignore mention only.
- npm account, scope, and trusted publishing remain publication prerequisites. They do not block review of N. The package stays `private: true`.

## Resume

Coordinator: review this report and the uncommitted diff, then update the shared epic row and `checkpoints/current.md`. Leave N at `in-review` until PR, hosted CI, review, and approved merge exist. README progress cleanup and the Git transition are the coordinator's next delivery work. Do not start D until that review accepts N's local gate.

## Proposed shared status

Set N to `in-review`. Suggested epic row:

```text
| N | task | F1 | [Use agento for storage naming](backlog/N-storage-name.md) | C returned; local ledger gate passed | in-review | [reports/N.md](reports/N.md); local verify passed on Node v26.13.0, 39 tests; remote CI unrun |
```

In `checkpoints/current.md`, record HEAD `3283807afee076d2d4cf1ee24c44ba1df20576da`, uncommitted N rename plus the existing planning and C files, local gate passed (39 tests), index unchanged, remote CI not run, Linux not run, and the next action as review of `reports/N.md` before assigning D. Leave D at `backlog`.

## Later rename to braid

2026-11-03. The user selected `braid` because unscoped npm `agento` is another package (version 0.1.2). This section does not replace the `.crew/` to `.agento/` record above.

Active runtime, help, errors, tests, Git ignore, README, seed contract, current instructions, and the coordinator skill now use `braid` and `.braid/`. Epic files moved from `epics/agento/` to `epics/braid/`. The skill moved to `.agents/skills/braid-coordinate/`. Historical reports, review outputs, and sealed validation files were not rewritten. `package.json` name is `braid`, version `0.1.0`, `private` false, repository `git+https://github.com/exones/braid.git`.

`pwsh -NoProfile -File ./scripts/Verify.ps1` passed: Node v26.13.0, npm 11.20.0, pwsh 7.6.9, 40 tests, then the packed-install proof. The proof ran on a dirty tree (`candidate: false`). Its tarball digest was `f485fdee7c6006b1159a6642eb511553a2dc40355e9148fd727fca98c0a7b100`. That digest is a pre-commit probe. The publish identity is a later clean pack of the rename commit.

The Git repository `https://github.com/exones/braid` has this history, and this checkout's `origin` points there. `https://github.com/exones/agento` is unchanged. Public npm publish is still open. `scripts/Publish-Npm.ps1` reads `npm_braid_access_token` from Infisical environment `prod` and does not print the token. Link the project with `infisical init`, or set `BRAID_INFISICAL_PROJECT_ID`.
