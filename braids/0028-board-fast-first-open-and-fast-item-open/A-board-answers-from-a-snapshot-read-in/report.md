## Done

- The board server now reads GitHub, T3, the braids and the inbox in a background loop (start, every 30 s, 200 ms after a change under `braids/`, Refresh) and keeps the latest complete result as a snapshot. `/api/board` and `/api/item` answer from it; a new snapshot is pushed over `/api/events`. Reads run one at a time and a refresh asked for during a read queues exactly one more. The first request waits for the first complete snapshot; `?fresh=1` answers when its own read is done. Broke signals are committed once per read.
- `gh` runs through `execFile` (`readGithubAsync`, `runGhAsync`), so the server answers other requests while it runs. The sync `readGithub` stays for the other commands.
- Open thread takes the link from the snapshot and reads T3 only when the snapshot has none; Start and Merge still read GitHub and T3 fresh.
- `BRAID_BOARD_TIMINGS=1` prints one line per read with each source's milliseconds. `docs/board.md` (Refresh) and decision D64 describe it.

## Validation

- New `test/board-snapshot.test.ts`: slow fake sources; once a snapshot exists `/api/item` and Open thread answer in under 500 ms with no further GitHub/T3 read; a static file and `/api/board` are served during a slow read; queued refreshes; Start and Merge read fresh.
- Two existing tests adapted: `test/t3.test.ts` counts the read at start; `test/board.test.ts` retries removing its temp folder (the board's background `git` children hold it for a moment on Windows).
- A read ends only when every source call it started (`gh`, `t3`) has settled, also when another source throws: a test has braids throw while a slow `gh` runs and shows the next read doesn't start `gh` before the first settled, and that the next successful read replaces the failure (a malformed brief stays a 500 until then).
- Gate `npm run verify` passes (290 tests).

Times on this repository (26 braids, ~200 T3 threads), `braid board` run in this checkout, same machine, ms per request:

| request | before | after |
|---|---|---|
| first `/api/board` (cold) | 20 949 | 12 453 |
| `/api/board` again | 4 768 | 4 |
| first `/api/item` | 3 676 | 2 |
| `/api/item` again | 208 | 1 |
| `/api/item` (the braid itself) | 4 053 | 4 |

Timing line of the first read: `braids 2674 ms, github 3842 ms, t3 4231 ms, signals 61 ms, inbox 791 ms, board 10154 ms`. Later reads: `braids 160, github 690, t3 2700, signals 55, inbox 1750, board 30` (about 4.5 s, in the background).

## Open

- The first read is still ~12 s: `toBoard` takes ~10 s on the first read, because `doneAt` runs `git` once per Done item (`src/board/done.ts`; cached afterwards). It is synchronous, so it also blocks the server during that first read. The braids read (2.7 s first time) and `signals`/`inbox` are synchronous `git` too. All of that belongs to 0028/B.
- Only `gh` was made async; the git readers stay sync (the brief's "other readers" would be a large change, and B reshapes them).

For later items: 0028/B should batch the Done-date `git` calls (one `git log` over all folders) in addition to the braid and T3 reads, and make the remaining sync `git` reads async so the server stays responsive during the first read.
Needs the user: none
