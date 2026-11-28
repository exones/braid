0077 The board stays fast under load (programme pm/autonomous-dev-machine, row P24).

## What changed

- **One git runner and a per-root cache** (A, #323): every git call goes through `gitSync` or its async forms in src/braids/gitio.ts. Each root's main checkout and repo name are read once (src/braids/repo.ts).
- **Nothing blocks the board on git or gh** (B, #328): every git and gh call in board reads, wakes, reminders, nudges and actions is asynchronous. The request record's read and write is one generator algorithm with a sync driver (CLI) and an async driver (board). A `t3` or `gh` timeout now reads as "didn't answer within 30 s", and only a missing command reads as "not installed". The dead `fresh` parameter and the 3 s caches are gone. test/board-async.test.ts fails on any synchronous child process in a board read.
- **`braids/` read without blocking** (G, #333): async file reads, re-read only when a file's stat changed. A quiet read starts 7 git processes instead of 14.
- **`braid gate`** (D, #338): it runs BRAID.md's gate with at most two at once per machine; a third waits and says who holds the slots. `--no-wait` exits 75. braid's own tests use at most half the cores, except in CI.
- **Request-record writes with few git processes** (H, #346): one `git fast-import` builds the commit, byte-identical to before, including the encoding header with a non-UTF-8 `i18n.commitEncoding` (the PM, Q-jgl9). A write that replaces a request starts 10 git processes instead of 17.
- **The probe finds a busy board** (C, #353): `braid board --url` and `service status` share one probe with a 10 s budget. A board that listens but answers late reads as "busy" with its address, not "no board". main with 0074 was merged here.
- **The programme card's running count** (E, #354): it follows the user's rule. A braid counts while it is started and not Done, and its coordinator is alive (running, or idle and not failed or archived), or the PM is handling one of its open requests. main with 0072 was merged here.
- **Docs** (F, #356): `braid gate`, decisions D-board-async and D-running-count, board.md, cli.md and the roadmap.
- **Tailscale keeps its owner answer under load** (I, #366, tier L, security): a "yes, the owner" answer is fresh for 5 min. Up to 30 min after the last "yes" it lets the owner in while one `whois` revalidates in the background; a failure never extends that window. "Not the owner" stays 5 s and drops the "yes". Windows decided by the PM.
- **The board stops asking T3 about finished subagent threads** (J, #367, the user's "1. C"): finished threads are remembered in the board process and re-checked after 5 min, at most 6 per read. They are re-checked at once when re-recorded or listed running. With 31 finished records, the second read went from 60 s and 31 calls to 0.6 s and none.
- **main merged before the final PR** (K, #368): 0060, 0081 and 0082. The board's answer action now uses the last good T3 read or one `thread show`, not a full T3 read on the request.
- **A fresh board recovers** (L, #372): with 31 finished records at 10 s each, the first read after a start fails at 60 s but still fills the memory, and the second read asks T3 nothing.
- **Measured under load** (M, #373): see below.

## Measured under load (0077/M, PR #373)

A scratch board of this branch over agento, dctl-studio and everix4, with two gates plus the machine's other agents, for 15 minutes.

- **Reads, against the 60 s limit:** missed after a fresh start. Every project failed at 60 s (73 to 157 s) and recovered after about 3 minutes. The longest read after that was 42 s. dctl-studio failed twice after a start.
- **`/api/session`, against the 1 s target:** missed. After the start: median 190 ms, p95 2.6 s, max 6.8 s, 16 % of requests over 1 s. Over the whole run, starts included: p95 26.7 s, max 56.6 s.
- **Cause:** starting git, t3 and gh processes blocks the board's main thread. The profile spent 560 s of 910 s in `spawn`, about 300 ms per spawn on this machine (about 62 % by wall clock). A control run and a bare `spawn` timing show the cost is the machine's process start, not the measuring.

The user decided (brown-cloud-p70q, "B"): ship 0077 as it is. Spawning git, t3 and gh off the board's main thread, and spreading the first read's calls after a start, become a follow-up braid in the PM's plan.

## Completion boxes

- Moved, not ticked: "With two gates running at once on one machine, the board's `/api/session` and page answer within a second". It was measured above and not met. The user's decision B (brown-cloud-p70q) moved it to the follow-up P34 "The board never waits on git or t3", which the user has parked.
- All the others hold.

## Validation

Each strand passed the gate, or green CI where two load-sensitive lock tests timed out locally on the base too (leftover x9jg, fixed by H). Each had an independent review, and green CI on Ubuntu and Windows. The braid branch's CI was green at 7cf8f04, the last code merge.

Decisions: the user: F without the braid-worker skill line ("not yet"); J's approach ("1. C"); ship with the 1 s box unmet ("B", brown-cloud-p70q). The PM: two gate slots (q-f2ad); the encoding header fix (Q-jgl9); the Tailscale windows. Mine, logged: strands G, H, I, J, K, L and M added, sizes and merge facts of B, G, C, E and K, E's reading of "the PM is handling it", the D test script.
For later items: the follow-up braid (spawn off the main thread, spread the first read; leftover jni7). Leftovers from this braid: fvs5, x9jg (taken), jni7, yknv, tbdi, wkyq, n6ai, d0x4, d1zk, cdec, fj25.
Needs the user: scope: the Completion box "within a second under two gates" is left open by the user's decision B; merging this PR into main is the user's.
