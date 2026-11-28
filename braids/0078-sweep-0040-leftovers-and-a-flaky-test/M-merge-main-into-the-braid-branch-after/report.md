# 0078/M report

## What changed

`origin/main` (397b243, after 0077) is merged into the braid branch with the merge commit 28fed824. It brings in 0060, 0072, 0074, 0077 and 0082. Later commits on `main` (up to 57e3215, the 0083 spike) add only files under `braids/0083-*/` and are not merged.

## Conflicts and how each was resolved

1. **docs/autonomy.md**, the `Decided:` bullet: 0078/D's `braid decisions <id> [--since <date, time or sha>]` with main's `braid answer <name>`.
2. **docs/braids-format.md**, two blocks:
   - `braid start`, `wait`, `review`: main's `start` (`--no-worktree`) and `review` (subagent roles), 0078/C's `wait` (`--once`, ends at the first failed check).
   - `decisions`, `limits`, `recap`, pauses, requests: 0078/D's `decisions <id>` and time `--since`, with main's "waits left out" and request names; 0078/D's `recap` order (main had not changed that order); main's `limits`, pauses and requests.
3. **docs/cli.md**, two table blocks: 0078/D's `autonomy` row; main's `limits` row (blind provider); the `pause` row is main's with 0078/C's "`--window` only picks the window"; main's `start`, `launch`, `review`, `gate`, `facts` rows; main's `accept` row with 0078/D's "both here and on the PR's base"; 0078/C's `wait` row; 0078/D's `decisions` row with main's "waits left out" and request names.
4. **docs/development.md**, the quick gate's steps: 0078/A and B's line-ending check with `git grep` and no OIDC release guard step (it is a Pester suite in `verify:full`); main's `scripts/Test-Node.ps1` test step and the `braid gate` paragraph.
5. **src/braids/autonomy.ts**, four blocks: main reads preset files and `BRAID.md` through a `Tree`; 0078/D read them at a Git ref. Main's signatures are kept, and a small `refTree(root, ref)` gives them the ref's files, so `judgedPreset` still reads `origin/<base>`. It uses main's one synchronous Git runner (`gitSync`). `JudgedPreset` now also returns that `tree`, and `src/commands/autonomy.ts` (merged without a conflict) passes it to `availablePresets` where it passed the ref.
6. **src/cli.ts**, help lines: main's `start`, `launch`, `review`, `accept`, `gate`; 0078/C's `wait`; 0078/D's `decisions` line with main's "waits aside".
7. **src/commands/pauses.ts**, usage lines: 0078/C's pause usage ("refused unless braid limits says pause") and main's resume usage (`braid resume --limit --all`).

## Validation

- `npm run typecheck` and `npm run build` pass.
- Focused tests: 102 of 102 pass (autonomy, pauses, cli, decisions, wait, done-merge, facts, notify, git-cached-per-root).
- Gate (`npm run verify`, run through `braid gate`): passes on d05c9f68: docs gate, typecheck and build pass; `node --test` 859 tests, 858 passed, 1 skipped, 0 failed, about 14 minutes of tests.
- The first gate run, before a machine restart, had 857 passed, 1 skipped and 1 failure: `test/start-clean.test.ts` "clean says a worktree is still in use and keeps it". It passed when run alone. A second run was stopped for the restart.

## Docs

The conflicted docs are the ones that needed to change. No other doc is made untrue by the resolution.

## Open

Nothing for this item.

For later items: `test/start-clean.test.ts` "clean says a worktree is still in use and keeps it" holds the folder with a process that lives 20 s; on a loaded machine `braid clean` can get to the folder after it has gone, and the test fails (this test and `src/commands/clean.ts` are the same as on `main`).

Needs the user: none
