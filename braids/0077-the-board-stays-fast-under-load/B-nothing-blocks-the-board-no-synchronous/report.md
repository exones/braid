# 0077/B: nothing blocks the board

**What changed.** Every `git`, `gh` and `t3` process a board read, the wake, the reminders, the nudges and the actions start is now asynchronous.

- `src/braids/gitbranch.ts`: the read and write of a data branch (`braid-requests`, `braid-inbox`) is written once, as generators that yield each `git` call, and run by a blocking driver (the CLI commands, unchanged behaviour) or an awaiting one (the board). So the commits, pushes and their order are the same in both; only how they are called changed. `gitAsync` gained a stdin option, `lockedAsync` (src/braids/state.ts) waits for the branch lock without blocking.
- Async forms for the board: `loadRecordAsync`, `endRequestAsync`, `addEventAsync` (requests.ts), `loadLifecycleAsync`, `braidAtAsync`/`braidsDoneOn` (the `braid:` wake), `readSignalsAsync`, `readinessAsync` (primes the branch caches `braid check` reads, `withKnownBraids`), `loadLiveBraidsAsync` no longer falls back to sync `for-each-ref`/`rev-parse HEAD`. The start/promote actions' `git` runner is async. `Sources.signals` and `Sources.readiness` may return promises.
- `src/board/timeout.ts`: a `t3` or `gh` call killed at its 30 s reads as "T3 didn't answer within 30 s; retrying" / "GitHub didn't answer within 30 s; retrying" (header and the project's failure line); only ENOENT says "not installed or not on PATH". The CLI's blocking `gh` reports ETIMEDOUT the same way.
- l7dw: removed. The board always passed `fresh = true` and the CLI passed `ttlMs: 0`, so the 3 s caches of `readGithubAsync` and `readT3` could never hit: `fresh`, both caches, `ttlMs` and `resetT3Memory` are gone. (`readGithub`, the CLI's blocking read, keeps its 3 s sharing.) No measuring was needed: no caller could reach the cache.

**Why.** Idea 2026-11-24-z45n and leftover 2026-11-23-5bor, and the PM's note that a slow `t3`/`gh` read as "not installed".

**Validation.**
- `test/board-async.test.ts`: (1) a full read, the wake (`braid:` and `time:` waits, with the record write), the reminders, the nudges, `inbox` and the Start action run with `child_process.spawnSync/execFileSync/execSync` wrapped: no synchronous process may start (catches git and gh, and anything else); the scratch brief names a `related` braid and a `plan/` branch exists, so the readiness check's branch reads run too. (2) `/api/session` sampled for 4 s while every async `git` call is delayed 700 ms (`delayGit`, the runner's test hook): slowest answer under 1 s. (3)(4) a killed `t3` / `gh` says not answering, ENOENT says not installed.
- Existing suites for requests, wake, reminders, nudges, inbox, start/promote/merge, snapshots, readiness, t3 and github pass (some touched: `fresh`/`resetT3Memory` removed from the tests that passed them).
- Live check (scratch board: temporary `HOME`/`BRAID_HOME`, port 7811, a clone of this repo, fake `gh` and `t3`; refresh every second; `npm run verify` running in this worktree at the same time, a busy machine; `/api/session` every second, with the event-loop delay in the same process):

| run | what | `/api/session` n / median / p95 / max | loop delay max |
| --- | --- | --- | --- |
| 1 | before the readiness fix | 84 / 3 / 34 / **5340 ms** (one `fetch failed`) | seconds |
| 2 | same | 63 / 3 / 14 / **5528 ms** | 10.3 s |
| 4 | final code | 52 / 4 / 43 / **293 ms** | up to 4.6 s |

Run 1 and 2 found a call I had missed: the readiness check (`braid check`, run at each read when any brief has `related:`) ran about 10 s of synchronous `git` per minute; fixed (`withKnownBraids`) and covered by the test above. With the final code the profile shows `spawnSync` only at startup (`repoSources`: the repo name and the main checkout, once per project).

**Open: what still blocks, measured.** Under the gate the event loop still stalls for up to 4.6 s per read. The profile of run 4 (80 s): about 35 s in synchronous **file-system** reads of the working tree (`loadTree(fsTree(root))`, one call per read, and `checkBraids`' own walk: `stat`, `readdir`, `readFileSync`, `existsSync` over every `braids/` folder), and about 7.6 s in `child_process.spawn` itself (CreateProcess blocks the loop under load; one read starts dozens of `git`). A request that lands in such a stall waits for it; in run 4 none did (a lucky 293 ms max). So the Completion box "answers within a second" is proven for slow `git` (the test) but not for a machine so loaded that the sync file reads take seconds. Proposal under `For later items`.

**Gate.** `npm run verify` is green in CI on d4f65cb (verify on ubuntu and windows). On this machine, under the load of other agents (about 60 node processes), the local runs did not pass: the full gate (about 22 min) ran twice, the last with 711 passing and 2 failing, and the first run also failed `board-cheaper-reads` "a static file is served while a slow read…" (560 ms against its 500 ms bound while a live check ran). The two failures are the lock tests of `test/requests.test.ts`, "overlapping writers in separate processes lose no update" and "…when they start on a stale lock" (6 processes x 3 writes wait 60 s for the lock). Run on their own they still fail here (90 s and 94 s), and on the base commit 67719df they fail too (155 s and 119 s), so it is the load, not this change. The box is ticked on the strength of the green CI run.

**Docs.** `docs/board.md` ("Refresh" and the reads paragraph) now says every process is asynchronous, names the test that fails on a synchronous one, and gives the timeout wording. Not affected: README, getting-started, cli, autonomy, development, decisions (no user decision), braids-format, roadmap, npm-distribution.

**Size.** About 900 changed lines in 16 source files (the brief expected 450 in 13): the request record's algorithm had to be shared by two drivers instead of copied (about 300 lines), and readiness/lifecycle/`braid:` wakes were reached only by the probe, not by the brief's list.

Decisions: generators with two drivers rather than a second copy of the write algorithm (same commits, pushes and order by construction); `readiness` made async rather than cached; `resetT3Memory` and the `fresh` parameter removed (l7dw).
For later items:
- (growth, for the coordinator) The board's remaining stalls are synchronous file-system work and process spawning (above). Options: (a) absorb here: read the working tree's `braids/` into an in-memory `Tree` asynchronously before the sync loader runs, and the same for `checkBraids` (about 150-250 more lines, in `store.ts`/`check.ts`), (b) a prerequisite/follow-up strand: the same, plus reading only when `braids/` changed (watcher event or mtime) and fewer `git` spawns per read (`merge-base` per branch), (c) accept as is. Recommendation: (b), a strand of its own, because this PR is already twice the size and its box is proven for git.
- `repoSources` still runs two blocking `git` calls once per project at setup (`originRepoName`, `mainCheckout`); also when the project list adds a project at a refresh. A cold, one-time cost; making it lazy needs `Sources.repo` async.
- A legacy `.braid/requests.json` is still carried over by the blocking `migrate` on the first board read that finds one (once per project, then renamed).
Needs the user: none
