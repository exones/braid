# 0077/M: the board under load, measured

## Answer

**With 0077 built, both targets are missed on this machine.**

| target | held? | numbers |
| --- | --- | --- |
| a project's read under 60 s | **No after a start**, yes afterwards | after a start under two gates every project's read failed with "the read took longer than 60 s" (73 to 150 s); afterwards the longest was 42 s |
| `/api/session` under 1 s | **No** | two gates, from the start: median 190 ms, p95 26.7 s, max 56.6 s; after the start: median 103 ms, p95 2.6 s, max 6.8 s, 16 % over 1 s |

So the braid's first Completion box ("with two gates running, `/api/session` and the page answer within a second") is **not met**, and the user's symptom (a read over 60 s) was reproduced after every fresh start with three projects.

**Cause: starting processes blocks the board's one thread.** Every `git`, `t3` and `gh` start costs a synchronous `spawn` (CreateProcess) on the main thread. Under the gates one start took 316 ms on average, and the board started 1786 of them in 760 s: **565 s (74 %) of the time the main thread was inside `spawn`**. In the CPU profile `spawn` is 560 s of 910 s of self time; every other function is under 6 s. This is the leftover jni7 stall, much larger with three real projects than in 0077/B and G (one scratch project).

By caller (profile of the load run): `git` (`gitAsync`, src/braids/gitio.ts) 318 s, `t3` (src/board/t3.ts, mostly `thread show`) 213 s, `gh` 28 s.

The slow start is a property of the machine at the time, not of the measuring harness: with no board and no preload, `spawn` blocked a median 319 ms for `git --version` (max 850) and 356 ms for `cmd.exe` (max 697) while the two gates ran (CPU 80 %), and 281 and 258 ms just after they stopped (CPU 88 % from other agents' work). Why it is that slow was not separated (CPU load; Defender real-time protection is on). An idle machine was not measured.

## What was run

- Build of 67183a22 (`npm ci`, `npm run build`). Ryzen 9 5900X (24 threads), 64 GB, Windows 11, Node 26.13.0.
- `braid board --no-open --no-pause --port 7811`, `BRAID_BOARD_TIMINGS=1`, projects agento (`C:\code\agento`), dctl-studio and everix4, the real paths from `braid projects list`, with the real `gh` and `t3`. Port 7800 and the user's service were not touched.
- Every second from another process: `/api/session` with the run's token, and the page `/`. Every 5 s: `/api/all`, `/api/projects` (failures), CPU load. The sampler's own timer was at most 50 ms late.

| run (UTC 2026-11-28) | what | CPU median / p95 |
| --- | --- | --- |
| trial, 02:02 to 02:04 (100 s) | fresh start, other agents' work only | 51 / 72 % |
| **load, 02:07 to 02:22 (15 min)** | two `node dist/cli.js gate` from this build in two worktrees, running since 02:05 and still running at the end; fresh start | 73 / 95 % |
| quiet, 02:25 to 02:32 (7 min) | my gates stopped; fresh start | 60 / 88 % |

The other work was not controlled: during the load run another agent ran `npm run verify` (from 02:15) and everix4 gates ran (from 02:11 and 02:22), none through `braid gate`, so up to four gates ran at once. "Quiet" only means without my two.

## Fresh start: the first and the next read (seconds)

| project | trial: 1st, 2nd | load: 1st, 2nd, 3rd | quiet: 1st, 2nd, 3rd |
| --- | --- | --- | --- |
| agento | 53.7, 5.5 | **150.4**, 14.1, 8.6 | **156.6**, 10.1, 7.8 |
| dctl-studio | 26.5, 26.8 | **72.8**, **76.6**, 6.5 | **74.3**, **81.7**, 5.2 |
| everix4 | **65.3**, 3.2 | **149.1**, 11.3, 8.6 | **155.7**, 7.5, 6.3 |

Bold is over the 60 s limit. The board recovers by itself, as 0077/L found: all three had a good snapshot about 2 min 40 s (load) and 2 min 50 s (quiet) after the start. But the second read does not always do it: dctl-studio failed twice.

First read of the load run, per source (GitHub and T3 run side by side, the rest one after another):

| project | github | t3 | braids | plans | signals | done dates | inbox | total |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| agento | 18.3 | 26.2 | 46.3 | 0.8 | 2.3 | 73.7 | 1.1 | 150.4 |
| dctl-studio | 15.7 | 16.5 | 17.3 | 2.4 | 9.0 | 26.5 | 1.1 | 72.8 |
| everix4 | 17.3 | 37.2 | 34.5 | 0.5 | 2.3 | 73.4 | 1.1 | 149.1 |

- The first read is mostly `git`: "done dates" and "braids". T3 alone (the finished-subagent records of 0077/J and L) stayed under the limit (10 to 41 s in the first reads).
- Meanwhile the server barely answered: the event loop was delayed up to 44.5 s (load) and 47.9 s (quiet), and the longest stretch without a pause was 53 s, all `git` starts. `/api/session`, which reads nothing, took up to 58.6 s.
- dctl-studio's second read spent 71.8 s (load) in "signals" and 62.4 s (quiet) in "plans", sources whose medians are otherwise under 3 s, while the other two projects' first reads were still running. I infer it waited behind their process starts.
- That "done dates" is slow because it starts many `git` at once (`prefetchDoneDates`, src/board/done.ts) is an inference from the source's time and the code; the profile only names `gitAsync`.

## Steady state (after the first reads)

Whole reads, seconds (median / max):

| project | two gates, 12 min | without my gates, 4 min |
| --- | --- | --- |
| agento | 20.8 / 40.8 (25 reads) | 10.6 / 18.6 (8) |
| dctl-studio | 16.4 / 34.7 (24) | 8.4 / 17.5 (8) |
| everix4 | 20.5 / 41.9 (25) | 10.3 / 17.4 (8) |

No read failed, and GitHub and T3 stayed "ok" throughout.

Per source under two gates, seconds (median / max):

| project | github | t3 | braids | plans | signals | done dates | inbox |
| --- | --- | --- | --- | --- | --- | --- | --- |
| agento | 3.1 / 6.1 | 14.3 / 25.2 | 1.4 / 13.3 | 0.6 / 2.6 | 1.3 / 6.0 | 0.6 / 2.1 | 0.8 / 1.9 |
| dctl-studio | 4.1 / 7.5 | 3.5 / 10.1 | 2.7 / 9.0 | 2.6 / 9.2 | 1.5 / 11.5 | 0.8 / 4.9 | 0.7 / 5.6 |
| everix4 | 3.4 / 9.5 | 12.7 / 23.0 | 1.4 / 15.2 | 0.6 / 3.3 | 1.2 / 7.6 | 0.6 / 2.8 | 0.7 / 1.7 |

Readiness and board take under 0.05 s.

Requests, ms:

| run and window | request | n | median | p95 | p99 | max | over 1 s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| load, whole 15 min | `/api/session` | 890 | 190 | 26724 | 49716 | 56641 | 226 |
| load, whole | page `/` | 890 | 195 | 26725 | 49716 | 56642 | 228 |
| load, whole | `/api/all` | 178 | 266 | 67641 | 70020 | 70039 | 53 (7 gave up at 70 s) |
| load, after the start | `/api/session` | 729 | 103 | 2649 | 4459 | 6753 | 120 |
| load, after the start | page `/` | 729 | 112 | 2649 | 4459 | 6754 | 122 |
| load, after the start | `/api/all` | 145 | 155 | 2188 | 3932 | 3988 | 25 |
| quiet, whole 7 min | `/api/session` | 416 | 64 | 44458 | 54580 | 58612 | 109 |
| quiet, after the start | `/api/session` | 244 | 3 | 926 | 2089 | 2983 | 11 |
| quiet, after the start | page `/` | 244 | 5 | 927 | 2091 | 2983 | 11 |

`/api/all` waits for each project's first read, so its slow answers at a start are partly by design. No `/api/session` or page request failed.

In steady state under the gates the board still started 100 processes a minute and spent 62 % of the time inside `spawn`; the event loop was delayed up to 5.5 s. Without my gates it was still over 1 s for 5 % of `/api/session` requests.

`braid board --url` printed the address (exit 0, no "busy" note) once at the end of each of the three runs. It was not tried during a start's stall.

## Limits of this measurement

- `--no-pause`: no pauses, wakes, reminders or nudges. The user's real board does those too, so it has no less to do than this one.
- A preload (measure-preload.mjs) gave the board a temporary home and guarded writes, and the CPU profiler ran at 10 ms. `braidHome()` reads no variable, so the temporary `BRAID_HOME` is `os.homedir()` answered with a temporary folder; `git`, `gh` and `t3` kept the real settings.
- One load run, on a machine whose other work changed during it.
- The two gates were load only and were stopped after about 19 minutes, unfinished. By then each had one failing test: gate 1 "not before the estimate; once it has passed, reminded hourly, the PM told once per estimate, a new estimate starts again", gate 2 "a PR that merged or closed closes its waits for the board at once, as met or withdrawn (a closed PR is withdrawn)". Different tests under heavy load; not investigated.

## Nothing real touched, everything stopped

- The guard sent any write under a project's `.braid/` to a temporary copy, refused other writes under the three checkouts and `~/.braid`, and refused writing `git`, `t3` and `gh` commands. In all three runs it caught **none**. A control run showed it does catch each kind.
- The files in the three `.braid/` folders and in `~/.braid` had the same sizes and times before and after (everix4's `.braid/` folder time moved once, with no file changed; the board logged no write). Refs in agento and everix4 moved: other agents work there.
- One transient change to the real agento repository: `git worktree add --detach` for the two gate worktrees (`C:\worktrees\agento\m77-gate1` and `2`), both removed again.
- Boards stopped by their stop file, gates by `taskkill /T`; no listener on 7811 or 7800 and no process of this run is left. The temporary home (with its two slot files) is deleted. Test folders that the killed gate tests had open may remain in `%TEMP%`.
- No message was sent to any T3 thread, and nothing was written to `braid-requests` or `braid-inbox`.

## Files

- Measuring scripts in this folder: measure-preload.mjs, measure-sample.mjs, measure-summary.mjs, measure-profile.mjs, measure-spawn.mjs. Node, not PowerShell, because they run inside or time the board's Node process.
- Raw samples, timings and CPU profiles: this item's Git-ignored `temp/` folder in the worker's checkout (not in the PR).

## Gate

This PR changes only `braids/`, so `braid check` and CI are the gate; `npm run verify` was not run for it.

## Docs

None affected: no product code changed, and `docs/board.md` already names the remaining spawn stall. Its size in practice is the finding above.

## Open

- Building nothing, as briefed: the PM decides what follows.

For later items: (a) start the board's `git`, `t3` and `gh` from a worker thread (or a helper process), so a slow `spawn` no longer stalls the server (0077/G's option (a)); this addresses the 1 s target, not the read time. (b) Start fewer processes, mostly at a fresh start: limit them across projects, ask `git` in batches for done dates and braids, keep done dates and finished records across restarts; and fewer `t3 thread show` per refresh. This addresses the 60 s limit. Recommendation: both, (a) first. (c) Separately, find out why a process start takes about 300 ms on this machine under load (for example Defender exclusions), which only the user can change.

Needs the user: none
