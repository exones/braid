# 0077/G: the board reads `braids/` without blocking

**What changed.**

- `src/braids/worktree.ts` (new): the board's read of the working tree (`braids/`, plus `autonomy/` and `BRAID.md` for the readiness check). It is all `fs/promises`. Each read lists the folders and stats the files, reads a file's text only when its stat changed, and returns the same object as before when nothing changed.
- `loadTree` and `checkBraids` share that read through a `Tree`; the CLI commands keep the blocking `fsTree`. `/api/item` answers a working-tree item from the same read (it read report and logs with blocking calls inside the request).
- A read with an unchanged tree, unchanged braid branch tips and unchanged HEAD returns the braids of the last load; `braid check` for the readiness line is not run again for an unchanged tree.
- Fewer `git` processes: the readiness check no longer computes the `related` warnings it never showed (so `withKnownBraids` is gone); plans and inbox are read again only when their tips move. On a clone of this repository a quiet read went from 14 processes to 7.
- The watcher's folder check is asynchronous.
- A legacy `.braid/requests.json` is now carried over without blocking (`migrateAsync`).

**Why.** After 0077/B the board still stalled for seconds on synchronous reads of `braids/`.

**Validation.**

- `test/board-tree.test.ts`: wraps the synchronous `fs` calls and fails on one under `<root>/braids` during a board read, its readiness check and an item page (a second test shows the wrapper sees the blocking loader); a quiet read loads nothing and asks Git only for tips; an edit and a new strand branch are picked up; the board's readiness equals the CLI's.
- `test/board-async.test.ts`: one test added for the legacy migration.
- Live: a scratch clone of this repository (759 files under `braids/`), temporary `HOME` and `BRAID_HOME`, fake `gh` and `t3`, free ports, refresh every 1 s (30 times the real rate), one brief edited every 20 s, `/api/session` asked every second from another process, while `npm run verify` ran in this worktree on a machine busy with other agents. "Before" is ae2947f.

| run | board | n | median | p95 | max | over 1 s | loop delay max |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1, two boards at once | before | 249 | 18 ms | 1627 ms | 4668 ms | 25 | 6879 ms (with startup) |
| 1 | after | 314 | 4 ms | 187 ms | 888 ms | 0 | 6673 ms (with startup) |
| 2, two boards at once | before | 236 | 7 ms | 1297 ms | 2730 ms | 22 | 3049 ms |
| 2 | after | 284 | 4 ms | 131 ms | **2363 ms** | 3 | 2443 ms |
| 3, one board | after | 231 | 4 ms | 121 ms | 420 ms | 0 | 1316 ms |

CPU profile of run 2 (302 s): before, `stat`, `readFileUtf8`, `existsSync` and `readdir` took 76 s and `spawn` 40 s; after, the file reads are gone (the snapshot's own code about 2 s) and `spawn` is 51 s. Runs 2 and 3 count the loop delay only from the start of sampling.

**The target (max under 1 s) is met in runs 1 and 3, not in run 2.** What is left is `child_process.spawn` itself, which blocks while Windows creates the process.

**Gate.** `npm run verify` here: 717 tests pass, 2 fail, both the known lock tests of `test/requests.test.ts` ("overlapping writers in separate processes lose no update", with and without a stale lock; leftover 2026-11-25-x9jg, they fail on the base too under this load). The gate box is ticked on the PR's green CI.

**Docs.** `docs/board.md` ("Refresh" and the reads paragraph). Not affected: README, getting-started, cli, autonomy, development, decisions (no user decision), braids-format, roadmap, npm-distribution.

**Choices and limits.**

- Change detection is by stat, not by the folder watcher the brief named: a missed or dead watcher would leave the board stale for good. So a quiet read still lists and stats the files (asynchronously), but reads and parses none.
- A file rewritten with the same size, inode and timestamps would be missed until the next change; file systems here keep timestamps fine enough that this isn't expected.
- `repoSources` still runs two blocking `git` calls once per project at setup. Making them asynchronous needs `repoSources` or `Sources.repo` to be asynchronous through the project roster, so it isn't cheap; left as is.
- Size: about 590 changed source lines in 11 files against 250 in 6 expected (about 150 of them the new reader, about 130 mostly the moved migration body). The coordinator was told late, after the code was written. The plan in the brief was also written after the code.

For later items:
- (growth, for the coordinator) If the board must stay under 1 s with certainty on a saturated machine, the remaining stall is process spawning. Options: (a) run the board's `git` calls from a worker thread, so `spawn` blocks that thread and not the server (about 60-100 lines in `gitio.ts`; the brief says to propose this, not build it); (b) one shared `for-each-ref` per read to go from 7 processes to 2 (less stall, not none); (c) accept. Recommendation: measure at the real 30 s refresh in the braid's final check first; if it misses there, (a).

Needs the user: none
