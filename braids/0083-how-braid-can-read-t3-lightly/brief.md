---
id: '0083'
title: "How braid can read T3 lightly"
status: To Do
labels: ["kind:spike", "tier:M"]
dependencies: []
related: ['0077', '0080']
delivery: epic
autonomy: free
---

## Goal

How can braid read what it needs from T3 (a thread's status, parent, last activity) without loading T3's whole store? T3 keeps every thread in one SQLite file, `~/.t3/userdata/statev2.sqlite` (3.1 GB on 2026-11-28, plus a 41 MB WAL). Under load `t3 thread show` took about 10 s per call, and the board's per-project read timed out at 60 s (0077/J now remembers finished threads). This spike answers, from T3's source and read-only measurements:

1. How `t3 thread list`, `t3 thread show` and the T3 MCP tools braid and its agents use (thread list, read and search; `delegate_task` status, `task_status`) query the store: filtered SQL with indexes, or load-then-filter in memory; whole transcripts and events, or only status columns.
2. What each costs against a store this size, measured read-only (timings of the CLI calls braid makes).
3. Which calls or options are cheapest for what the board needs, and how often braid calls each today (src/board/t3.ts, feed.ts, wake.ts and the skills).
4. Whether settled or archived threads can be removed or the store compacted, and what T3 offers for it.

The answer feeds the decision of how braid reads T3 from here on: which calls and how often, in 0077's follow-ups and in 0080 (the board talks to T3 directly over MCP). Time box: one worker run, about half a day of research.

Expected size: report.md and sources.md, about 300 lines in 2 files; no product code.

## Start here

- `src/board/t3.ts`: every `t3` CLI call the board makes (`run(root, ["thread", "list", ...])` around line 265, `showThread` around line 164), on `main` and on `braid/0077-the-board-stays-fast-under-load` (0077/J's memory of finished threads).
- `src/board/feed.ts` (`READ_TIMEOUT_MS`, `BRAID_BOARD_TIMINGS`, how often a read runs), `src/board/wake.ts` (`t3 thread send`), `src/board/inputs.ts`, `src/commands/board.ts`.
- The skills in `.agents/skills/` (braid, braid-pm, braid-worker, braid-reviewer): which T3 MCP tools agents are told to call and when (`t3_thread_read`, `t3_thread_list`, `t3_thread_search`, `task_status`, waits).
- The installed T3: `~/.t3/bin/t3.cmd` runs `C:\Users\exon\AppData\Local\Programs\t3code\resources\server.asar` (`apps/server/dist/bin.mjs`); `~/.t3/userdata/desktop-last-started-version` holds the version, and `~/.t3/userdata/compacted-at` exists (find what writes it). The asar is the code that actually runs here: read it (extracted to your scratchpad) next to the upstream repository at the matching version, and say which one each citation comes from.
- `braids/0077-the-board-stays-fast-under-load/J-the-board-stops-asking-t3-about-finished/` (on the 0077 branch): its brief and report, with the timings that started this.

## Change

- `braids/0083-how-braid-can-read-t3-lightly/report.md`: the answer per question 1 to 4, with evidence (file and line in T3's source, the query or code path; commands and timings); a table of the calls braid makes today (where, how often, what each costs); a recommendation for braid (which calls, which options, how often, what to cache); a list of things to ask T3 upstream (each: what, why, the evidence); proposed follow-ups for the coordinator to turn into briefs.
- `braids/0083-how-braid-can-read-t3-lightly/sources.md`: look at T3's source (upstream repository at the installed version, and the installed bundle), its docs and issues, and SQLite docs where a claim rests on them (indexes, WAL, VACUUM). Read each one rather than its title, record each in the braid-researcher source line format (`.agents/skills/braid-researcher/SKILL.md`), and cite source ids (`[S1]`) for claims in `report.md`.
- Follow braid-researcher's Method (BRAID.md, `models.worker.spike`).

## Already decided

- Decided by the user, binding: "I want to avoid excessive reads of this huge DB until we find something that limits reads (like select where vs select * and then filter in memory). This has to be researched on T3 code" (2026-11-28). The spike runs now beside 0077 ("silly window A").
- **Read-only on the live store.** Never write to, open read-write, vacuum, checkpoint or copy `statev2.sqlite` (or its WAL and SHM) while T3 runs. Prefer reading the code and timing the CLI calls braid already makes. If a direct look at the schema or a query plan is needed, open the file read-only (`file:...?mode=ro`, or `sqlite3 -readonly`) for the schema and `EXPLAIN QUERY PLAN` only, never a full scan. A copy for measurement only if read-only, only when the machine is not under load (two gates running means wait), and only when drive C: has at least three times the store's size free (store plus WAL; check first and say the free space in report.md; C: was nearly full on 2026-11-26). Delete the copy at the end of the run. Otherwise measure on the live file, read-only, only. report.md says whether a copy was made and that it was deleted.
- **Measure gently.** Time each CLI call a few times, spaced out, never in a tight loop or in parallel; note the machine's load at the time (which gates or agents ran). The total measuring load stays small.
- **No outward action.** Contacting T3 upstream (issues, PRs, discussions, comments) is outward: never do it. List what to ask in report.md for the user.
- No product code, no `docs/` or `docs/roadmap.md` edits, no skill edits: the spike's output is its report in this folder. Follow-ups are proposals in report.md; the coordinator turns them into briefs after the user decides.
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): its strand J already caches finished threads in the board process; this spike changes no code, so there is no merge order. Cite its code as it is on that branch.
- Related to 0080 (held; the board talks to T3 directly over MCP): the recommendation says what the findings mean for 0080's MCP approach (which MCP calls are cheap), without editing 0080's brief.

## Out of scope

- Changing braid's code, docs or skills, or 0077's and 0080's briefs.
- Changing T3's settings or data, deleting or archiving threads, or running any T3 maintenance command found (the report names it and what it would do; the user decides).
- Contacting T3 upstream.

## Completion

- [ ] report.md answers questions 1 to 4, each with T3 source citations (repository or bundle, file and line) and, for 2, commands with their timings and the machine's load at the time
- [ ] report.md has the table of braid's T3 calls today (call, where in braid, how often, cost), a recommendation (which calls and options, how often, what to cache), and a list of things to ask T3 upstream
- [ ] report.md says how the live store was touched (read-only CLI calls only, a read-only open for schema and plans, or a read-only copy: when, the free space on C: checked first, and its deletion), and that nothing was written to it
- [ ] No docs from BRAID.md `docs` are edited (a spike edits no docs); report.md names any the findings may make untrue, as follow-ups
- [ ] `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
