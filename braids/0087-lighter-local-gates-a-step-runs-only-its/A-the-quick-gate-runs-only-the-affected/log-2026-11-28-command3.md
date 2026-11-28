## 2026-11-28 09:23Z

Decided: `import type` and `export type` lines don't make a test depend on a module (erased at runtime, the gate typechecks everything). With them, a change to src/commands/board.ts picked 37 of 74 files, without 19; sweep.ts 51, without 2.
Decided: an empty change set runs every test; web/ and other unclassified paths run every test.
Finding: 0077 is not in main, so the picked files go to node --test directly. When main with 0077 is merged, scripts/Test-Node.ps1 must take the file list or the picked run loses its concurrency cap; git merges both cleanly, so nothing flags it.

## 2026-11-28 12:01Z checkpoint

done: picker, Verify.ps1, Test-Node.ps1 file list, Pester suite, docs/development.md, decisions D121, braid branch (with 0077) merged. The "0077 is not in main" finding above is resolved by that merge.

Timings after the merge, other braids loading the machine (CPU about 80-85%):
- quick gate, README only: 95 s (no typecheck, build or test)
- quick gate, src/commands/launch.ts (4 of 78 test files, 47 tests): 979 s
- quick gate, src/commands/requests.ts (37 of 78 files, 424 tests): 2466 s, 2 failures
- verify:full: 4654 s, exit 1; Pester 43/43 (619 s); node tests 853, 849 pass, 1 skipped, 3 fail (3726 s)

The 3 failures: test/board-async.test.ts:97 (too few slow reads), test/board-projects.test.ts:362 (push project name), test/inbox.test.ts:70 (age 1m, expected 0m). This branch changes no src/ or test .ts file; they look load-related, not yet confirmed: their re-run was stopped for the machine restart.

Picked files per one-file change (of 78): start.ts 47, done.ts 45, requests.ts 37, board/commands/board.ts 22, board/tailnet.ts 22, sweep.ts 2, launch.ts 4, board/model.ts 56, braids/title.ts 62, braids/store.ts 65, test/title.test.ts 1, web/src/App.tsx all. 8 of 78 files import no src module (6 spawn dist/cli.js); sweep.ts does not pick inbox-sweep.test.ts, gate.ts's gate.test.ts spawns too.

next: on Go, re-run those 3 files (pwsh scripts/Test-Node.ps1 test/board-async.test.ts test/board-projects.test.ts test/inbox.test.ts), no second full gate; tick boxes; write report.md (For later items: name-based signal, e.g. start.test.ts for src/commands/start.ts; Needs the user: scope, since a hub-module change still picks most files and takes far more than minutes under load); open the PR into braid/0087-lighter-local-gates-a-step-runs-only-its.
open: no PR yet.
