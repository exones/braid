**Research: How can braid read what it needs from T3 without loading T3's whole store?** — answered

**Versions:** questions 1–4 were researched on T3 0.1.12 (2026-11-27/28 night). T3 updated itself to **0.1.13** (`bc0f04da`) before question 5 (2026-11-28 morning). The 0.1.13 diff of the files cited for 1–4 changes no read path: `cli/thread.ts` lets `--messages` take 0; `OrchestratorMcpService.ts` adds a mode check on delegation; `ProjectionStore.ts` changes run-payload reads; `DatabaseStorage.ts` renames `compacted-at` to `compacted-at-v2`, so the old file is stale. Question 5 and the log findings cite 0.1.13 (S19–S29).

**Answer:** T3 doesn't load its store to answer braid. Every read behind `t3 thread list`, `t3 thread show` and the MCP tools is filtered SQL on indexed columns. It builds the costly per-thread "shells" only for the page asked, and it reads no transcripts beyond the page of items asked. On the server, a `t3_thread_list` page costs about 85 ms and a `t3_thread_read` about 20 ms (p50). What costs 7–24 s is the `t3` process itself. Each call starts the Electron runtime as Node, loads about 10 MB of JavaScript, opens the 3.1 GB database in its own process, writes a new auth session row and revokes it, and only then makes its MCP calls. The call that needs no server at all took 9–19 s. So the lever is fewer `t3` processes, not lighter queries: one long-lived MCP client (0080) asking live-only lists. Confidence in the basis: high for the code paths (read in the source at the installed commit and in the installed bundle). Medium for the split between start-up and server time: one evening's sample, two runs per call, on a loaded machine.

## Frame (written before searching)

- **Decision fed:** how braid reads T3 from here on: which calls, how often, what to cache (0077's follow-ups, 0080).
- **Sub-questions:** (1) query shape of each call; (2) cost per call here; (3) the cheapest call per need, and braid's call counts; (4) can the store shrink.
- **Candidates:** A, T3 loads all threads or transcripts and filters in memory, so the store's size drives the cost. B, T3 filters in SQL, and the cost is per-call overhead, so the number of calls drives the cost. C, a mix: SQL for some calls, in-memory work for others.
- **Settled by:** the SQL and handler code at the installed version, and server-side span timings set against CLI wall times.
- **Result:** B, with a small part of C. The project's active-thread index is filtered in memory after an SQL `WHERE` (S5, S7, S8). That index is small: 792 rows for this project, about 2.7 KB of JSON each.

## 1. How the calls query the store

- **`t3 thread list --project <path> --json`** (read [S1] `cli/thread.ts` 880–916; bundle [S2] `binCli-DU5-3kKm.mjs` 10816–10835):
  - The CLI resolves the project by paging `t3_project_list`. Only a path that is no project root also needs `git worktree list`.
  - It then pages `t3_thread_list` with `includeSubagents: true, limit: 100`, to the end, and drops the subagents **on the client**. It passes no status filter.
  - Server ([S5] `listThreads` 3529–3622): `listProjectThreads` runs `listActiveThreads(projectId)`. That is `SELECT … FROM orchestration_v2_projection_threads WHERE deleted_at IS NULL AND archived_at IS NULL AND project_id = ?`, plus 12 `json_extract`s of each row's `payload_json` ([S8] 9711–9760; plan below). The rows are filtered and sorted in memory ([S7] 879–900). The server then builds shells for **only the 100 threads of the page** ([S5] 3590–3608).
  - Each shell read is a set of `WHERE thread_id IN (json_each(?))` selects on runs, item-count tables, provider threads and pending items ([S8] 8480–8840, 9335–9400). It reads no messages.
  - Because the CLI pages to the end, one `thread list` re-runs the index query and builds shells for **every** active thread of the project: 792 threads, 8 pages.
- **`t3 thread show <id> --json`** ([S1] 1048–1110, 461–568; [S2] 10539, 10908):
  - First one `t3_thread_read {limit: 1, runLimit: 1}`, then message windows of up to 100 items (`READ_PAGE_LIMIT`), widened backward until 10 messages are found.
  - Then one more `t3_thread_read` per message longer than 20,000 characters, and one more call when the latest run ended in error.
  - Server ([S5] `readThread` 3624–3725, `loadReadableThread` 1585–1630): the shell, the recent runs (`latestRunLimit`), active runs, pending requests and one timeline page. Messages are fetched by id for the page only.
  - Without a T3 thread scope (the CLI's case), it never loads the full run history. A thread reading its own subagent loads all of that subagent's runs, turns and transfers (1606–1619). Such a read also marks the task's result delivered.
- **MCP `t3_thread_list` with options** ([S6] 360–373; [S5] 3550–3615): `statuses` made only of live statuses (`queued, preparing, starting, running, waiting`, [S5] 1006–1012) first narrows the list to `listActiveShellIndex`'s `mayBeLive` threads. That index finds live threads through partial indexes on live runs, pending requests and pending items ([S8] 9614–9660), so finished threads cost nothing. With any non-live status in the filter, the server builds shells for every candidate before paging. `titleContains` and `settled` filter the index in memory, before any shell is built.
- **`t3_thread_search`** ([S13] 106–115, 240–305): SQL on thread fields, then the FTS table `orchestration_v2_message_search` for message text, with fixed caps (20,000 rows scanned, 10,000 candidates).
- **`task_status`** ([S5] 3101–3104): `readTask` on the caller's own task, by id. **`delegate_task`'s wake** is a server push, not a read.
- **The CLI's own database work** (read [S3] `persistence/Sqlite.ts`; [S4]): `withThreadTools` provides `EnvironmentAuth.layerRuntime`, whose storage is `SqlitePersistence.layerCliConfig`. On every `t3 thread …` call, the CLI process:
  - opens `statev2.sqlite` with a reader worker and a writer worker;
  - sets `busy_timeout = 5000`, `journal_mode = WAL` and other pragmas;
  - checks the migration history;
  - **inserts** a row into `auth_sessions` and **updates** it to revoke it at the end ([S4] `AuthSessions.ts` 232, 300).
  The `ANALYZE` branch ([S3] 93–97) doesn't run here: the live store has no `sqlite_stat1` (measured, below).
- **Query plans on the live store** (measured, read-only, `EXPLAIN QUERY PLAN` only):
  - `listActiveThreads`: `SEARCH t USING INDEX orchestration_v2_projection_threads_project_updated_idx (project_id=?)`
  - live runs: `SEARCH r USING COVERING INDEX orchestration_v2_projection_runs_recovery_idx (status=?)`
  - item counts: `SEARCH … thread_item_counts USING PRIMARY KEY (thread_id=?)`
  - event head (`MAX(sequence)` in every shell snapshot): `SEARCH orchestration_events USING INDEX idx_orchestration_events_application_sequence`

## 2. What each call costs here

Machine: 24 logical CPUs. Load was 69–100% CPU before each call, mostly the two T3 processes (58,000 and 19,000 CPU-seconds). No gate ran (checked with `Get-CimInstance Win32_Process`). Two braid board services ran (pids 89188 and 23608), each reading T3 every 30 s, and agents were working. Calls were sequential, 20 s apart, from `pwsh` (`& t3 @args`, wall time from a `Stopwatch`), on 2026-11-28 between 00:50 and 00:59 local (UTC+1). Scripts and raw timings: `~/.braid/artifacts/agento/0083/` (`time.ps1`, `base.ps1`, `timings.tsv`, `base.tsv`, `spans.mjs`, `graph.mjs`, `ro*.mjs`; `ro4.mjs` was never run).

| Call (measured) | Run 1 | Run 2 | Output |
| --- | --- | --- | --- |
| `t3 thread show " "` (usage error: no database, no server) | 19.0 s | 9.4 s | — |
| `t3 thread show no-such-thread-0083 --json` (database open, session, one read that fails) | 21.8 s | 16.4 s | — |
| `t3 thread show <19-item completed thread> --json` | 7.4 s | 9.1 s | 3.0 KB |
| `t3 thread show <4,663-item completed thread> --json` | 9.1 s | 10.9 s | 11–14 KB |
| `t3 thread show <608-item running thread> --json` | 23.7 s | 10.6 s | 14.7 KB |
| same with `--messages 1` | 10.0 s | 21.1 s | 2.6 KB |
| `t3 thread list --project C:/code/agento --json` | 23.2 s | 20.3 s | 452 KB, 447 threads |
| (earlier, 00:4x) same list | 18.2 s | | |
| `t3 --version` | 15.8 s | 16.9 s | — |

Server-side, the same work (measured from T3's own span trace [S15], 11 rotated files covering about 11 minutes of all clients):

| Server span | n | p50 | p90 | max |
| --- | --- | --- | --- | --- |
| `tools/call t3_thread_list` (one page of 100) | 169 | 85 ms | 150 ms | 389 ms |
| `ProjectionStore.listActiveThreads` | 169 | 23 ms | 44 ms | 81 ms |
| `OrchestratorV2.getShellSnapshot` | 259 | 40 ms | 86 ms | 357 ms |
| `tools/call t3_thread_read` | 1,196 | 20 ms | 51 ms | 397 ms |
| `OrchestratorV2.getThreadShell` | 2,265 | 5 ms | 11 ms | 215 ms |
| `SessionStore.verify` (every MCP request) | 3,041 | 1 ms | 3 ms | 101 ms |

- measured: a board's `thread list` shows in the trace as 8 `listThreads` pages, 55–85 ms each, in 0.7 s (23:59:10.0–10.7 UTC), followed by bursts of `readThread` at 11–26 ms each.
- measured: one direct MCP call from this thread, `t3_thread_list {projectId, includeSubagents: true, statuses: [the 5 live ones], limit: 100}`: **91 ms** on the server (`listActiveShellIndex` 37 ms, shells 22 ms). It returned all **6** live threads of the project, subagents included, with `parentThreadId`, `status`, `pendingBackgroundTasks` and `blockedOnThreadWait`.
- measured: one `t3_thread_read {threadId, limit: 1, runLimit: 1, maxCharsPerItem: 1}` of the 608-item running thread: **38 ms**. It returned `branch`, `worktreePath`, `pendingRequestCount`, `archived` and the active run.
- inferred (from the two tables): a `thread list` asks about 0.7 s of server work and takes 18–23 s, and a `thread show` asks under 0.2 s and takes 7–24 s. More than 90% of each CLI call is the client process. The usage-error call, with no database and no server, took 9–19 s. The database open, the session and one read added roughly 2–7 s on top (two noisy pairs). The CLI's static import graph is 26 modules, 10.2 MB (measured by walking `binCli-DU5-3kKm.mjs`'s imports in the bundle), loaded before it parses its arguments.
- inferred: `--messages 1` saves nothing measurable, because the process dominates.

## 3. The cheapest call per need, and what braid calls today

| braid call (S17) | Where | How often | Cost per call here |
| --- | --- | --- | --- |
| `t3 thread list --project <main> --json` | `src/board/t3.ts` 265 (`readFresh`), via `readT3` from `commands/board.ts` 553 and `commands/coordinate.ts` 73 | each board read: every 30 s (`REFRESH_MS`, `board.ts` 750), on a `braids/` change (200 ms debounce), on a fresh read; shared 3 s (`SHARE_MS`). Two board services ran: about 4 a minute | 18–23 s; 8 server pages |
| `t3 thread show <id> --json`, per running listed thread | `t3.ts` 324 | each read; 5 running here | 7–24 s each, 6 at a time (`pool`) |
| same, per `.braid/reviews.json` record (not `pm/`) | `t3.ts` 342 | each read; 11 records here. On the 0077 branch (J, `toShow`) the finished ones are asked every 5 min, at most 6 a read | same |
| same, per `pm/` checker record | `t3.ts` 376 | each read | same |
| `t3 thread show <parent> --json` | `parentsCheckout` (`t3.ts` 191) from `commands/clean.ts` 183, `commands/requests.ts` 156 | per `braid clean` candidate and `braid ask` / requests check | same |
| `t3 thread show` | `commands/notify.ts` 54, `commands/requests.ts` 165, `commands/clean.ts` 154 | per command run | same |
| `t3 thread show <thread> --messages 10 --json` | `src/board/steerer.ts` 179 | per steering target while a pause is counted | same |
| `t3 thread show` after `thread start` | `commands/board.ts` 263, 344 | per Start / idea start from the board | same |
| `t3 thread start …` | `commands/board.ts` 252, 333 | per Start | a process plus `t3_thread_launch` (about 434 ms on the server) |
| `t3 thread send …` | `board/wake.ts` 150, 171; `nudge.ts` 58; `remind.ts` 78; `resume.ts` 110, 137; `steerer.ts` 165; `board.ts` 146 | per wake, nudge, reminder, resume, pause or merge message | a process plus about 110 ms on the server |
| Agents: `t3_thread_send`, `delegate_task`, `t3_thread_launch` (S18) | skills | per hand-off; no polling: the skills say wait for wakes | server only: 120 ms, 1.1 s, 0.4 s |
| Agents: `t3_thread_list` or `t3_thread_search`, then reads | braid-pm resume step (`braid-pm/SKILL.md` 143) | per PM resume | 85 ms a page; reads 20 ms |

- inferred: one board read here is 1 list plus 5 + 11 shows: 17 processes, at least 3 rounds of the 6-wide pool after the list. That is about 20 s plus 3 × 7–24 s, past the 60 s `READ_TIMEOUT_MS` (`feed.ts` 13). This is the time-out 0077 saw.
- inferred: with two board services, about 4 board reads a minute here spawn about 70 `t3` processes a minute. That alone can keep the CPU high, and with it the 7–24 s.

Cheapest call per need:

| Need | Cheapest call |
| --- | --- |
| Which threads are live (status, parent, provider, model, link, title, pending background work), subagents included | MCP `t3_thread_list {projectId, includeSubagents: true, statuses: [the 5 live], limit: 100}`: one call, about 90 ms, cost by live threads only. The CLI can't ask for it (no `--status`, and it drops subagents). |
| Worktree, branch, pending questions of one thread | MCP `t3_thread_read {threadId, limit: 1, runLimit: 1, maxCharsPerItem: 1}`: about 20–40 ms. Through the CLI, `thread show` makes 2 or more reads and a process. |
| Idle threads and titles (Start buttons, idle coordinators) | unfiltered `t3_thread_list` pages (8 × 75 ms here), or `settled: false` to skip settled ones (filtered in memory before shells). Needed far less often than every 30 s. |
| A recorded subagent's state | the live list above: a record absent from it is not running. No per-record read. |
| Last messages (steerer) | `t3_thread_read {limit: N, view: "messages"}`: one page. |

## 4. Can the store shrink, and what T3 offers

- measured (read-only): 1,626 thread rows: 1,526 active, 99 archived, 7 deleted. This project has 792 active (447 top-level, 406 of them `completed`), and the next has 314.
  - `page_count` 756,913 × 4,096 bytes, `freelist_count` 1, `auto_vacuum` 2 (incremental), `journal_mode` wal; 273 schema objects.
  - `auth_sessions` has **405,159 rows, 350 not revoked**.
  - `compacted-at` holds 1795810124908, which is 2026-11-27T20:08:44Z.
- read [S9]: every 6 hours the server prunes superseded events (keeping at least a day, [S10]) and writes `compacted-at`. Every minute, with incremental auto-vacuum, it returns up to 1,024 free pages to the file system. The live store is already in that mode and has 1 free page, so there is nothing to return now.
- read [S11, S9]: `t3 doctor` (`--fix`, `--dry-run`) stops T3 and runs an offline VACUUM. inferred: with auto-vacuum incremental already on and no free pages, it would shrink little. T3 itself words this case "This database already shrinks on its own. Nothing to reclaim." ([S9] `requestReclaim`). Not run (out of scope).
- read [S10]: **deleting** a thread purges its turn items, messages, nodes, runs, subagents, handoffs, requests and plans, and leaves a tombstone row. The freed pages then go back to the file through incremental vacuum. **Archiving** deletes nothing. It removes the thread from every active list (`archived_at IS NULL`, [S8]), so it shortens `thread list` and the shell index without shrinking the file.
- read [S12]: T3's cleanup policies remove worktrees and folders, never threads ("Branches and thread history stay"). v0.1.12 has no retention policy that archives or deletes settled threads.
- inferred: the file's size isn't what makes braid slow: every read is indexed (part 1). Archiving braid's finished threads would cut a full list from 8 pages to about 1, and the CLI process would remain. Deleting would shrink the file and lose the threads' history. That is the user's call.
- read [S4] and measured: each `t3` CLI call adds one `auth_sessions` row (insert, then revoke). v0.1.12 has no `DELETE FROM auth_sessions` (searched, none found). The 405,159 rows (inferred: mostly braid's CLI calls, at about 70 a minute) stay in the store. The table is indexed and its rows are small, so it's not a read cost now, only growth.

## 5. Can old checkpoint refs be removed safely, and what does T3 lose? (added)

**Answer:** yes, for settled threads. Removing a settled thread's refs costs that thread's turn diffs and its rewind to old turns. Both fail cleanly, and nothing else breaks. Live threads should keep theirs. The PM pruned 3,652 refs of 435 settled threads in agento at about 09:58. `git for-each-ref refs/t3` went from 340–1,070 ms to 77–81 ms, and the whole-repo listing from 107–2,184 ms to 78–86 ms.

**What reads the refs** (read [S19] `orchestration-v2/CheckpointService.ts`, [S20] `checkpointing/CheckpointDiffQuery.ts`, [S21] `ws.ts`, at 0.1.13; bundle `runtimeLayer-bHa_wuNB.mjs`, `server-B8LwMtOy.mjs`):

| Reader | What it does with a ref | When the ref is missing |
| --- | --- | --- |
| Turn capture, after each turn (S19 736–790) | diffs the previous ordinal against the new one for the turn's file list | logs "previous checkpoint ref lookup failed" (bundle 35999); that turn records no file list |
| Turn baseline, before a turn (S19 493–499, 545–565) | checks the ordinal's ref and skips the capture if it exists | captures it again: one more snapshot |
| Turn diff and full-thread diff (`getTurnDiff`, `getFullThreadDiff`, S21 2131–2145; S20 420–431, 215–236) | `git diff` between two checkpoint refs | the diff fails; the repository diff logs "checkpoint repository diff unavailable" (bundle `server-B8LwMtOy.mjs` 19633–19641) |
| Restore, rewind, revert (S19 859–863, 877–898) | checks the ref, snapshots the folder as `…/pre-rewind`, restores | refuses: "Checkpoint ref is unavailable." (bundle 36066, 36094); the folder isn't touched |
| T3's own cleanup (S22 `storageCleanup.ts` 2006–2105) | lists refs and deletes those of **deleted** threads | — |

- read [S19] 877–898: a `…/pre-rewind` ref left by a failed rewind is "the only copy of how the folder was". Never prune one. agento had none.
- not checked: whether the live working-tree Changes panel (`review.gitDiffPreview`) reads checkpoint refs.
- inferred: a live thread doesn't break without its refs, but it degrades. It gets one more baseline snapshot, one turn without a file list, and no rewind to older turns. That is why the rule below keeps live threads and the children of live parents.
- inferred (Git): deleting refs doesn't shrink `.git` by itself. The snapshot objects go at the next `git gc`.

**T3's own pruning** (read [S22] 2006–2105, 2122–2133, 2294–2300): `StorageCleanup.cleanCheckpointRefs` runs first in every cleanup sweep: at start-up, on a settings change, then hourly, whatever the cleanup policies say.
- It deletes refs only of **deleted** threads that aren't the ancestor of a fork and have no pending effects (`WHERE t.deleted_at IS NOT NULL`). It does this with `git update-ref --no-deref -z --stdin`.
- It also removes their capture index (`<git common dir>/t3-checkpoint-indexes`; idle ones age out after 14 days, [S23] 1–19).
- Settled and archived threads keep their refs for ever. No setting changes that.

**How a ref's name is made** (read [S19] 37, 285–297, 321–324; [S24] `IdAllocator.ts` 199–202, 402–406; bundle `runtimeLayer-bHa_wuNB.mjs` 35664, 35748, `WorkflowStore-BPhFw2zX.mjs` 100105):
- The ref is `refs/t3/orchestration-v2/checkpoints/<segment>/ordinal/<n>`.
- `segment = base64url(sha256_hex(scopeId).slice(0, 32))`: the first 32 characters of the hex digest, taken as text, then base64url-encoded without padding.
- `scopeId = "checkpoint-scope:thread:" + encodeURIComponent(threadId) + ":name:" + encodeURIComponent(name)`. The name is `root` for a thread's own checkout, and `repository:<path>` for the extra repositories of a multi-repo project (everix4).
- measured: `~/.braid/artifacts/agento/0083/seg.mjs --verify C:/code/agento` rebuilt all 1,544 scope ids from their thread and name, and explained all 805 segments and 5,647 refs. The PM's example `M2E2Y2U5…` (decoding to `3a6ce9bc…`) is the 0064/D review subagent.

**Timings** (measured; `C:\code\agento`; 2026-11-28; `refs.ps1`, `refs.tsv`, `refs-after.tsv` in the artifacts folder; one PowerShell `Stopwatch` per command, 1–4 minutes apart):

| When | Refs under `refs/t3` | `git for-each-ref refs/t3` | All refs | Whole-repo `git for-each-ref` | `packed-refs` | CPU |
| --- | --- | --- | --- | --- | --- | --- |
| 09:40:06 before | 5,643 | 886 ms | 6,010 | 2,184 ms | 784,688 B | 52–68% |
| 09:40:36 before | 5,643 | 473 ms | 6,010 | 444 ms | 784,688 B | 71% |
| 09:44:39 before | 5,648 | 340 ms | 6,016 | 107 ms | 784,688 B | 85% |
| 09:48:43 before | 5,652 | 1,070 ms | 6,020 | 135 ms | 784,688 B | 8% |
| about 09:58 | the PM's prune: 3,652 refs of 435 settled threads, one `git update-ref --stdin`; the PM's first listing after it, 1,164 ms (packed-refs just rewritten) | | | | | |
| 09:54:38 after (my clock) | 2,001 | 80 ms | — | — | 300,455 B | — |
| 09:54:47 after | 2,002 | 81 ms | 2,372 | 78 ms | 300,455 B | 56% |
| 09:55:48 after | 2,006 | 78 ms | 2,377 | 79 ms | 300,455 B | 54% |
| 09:56:49 after | 2,010 | 77 ms | 2,381 | 86 ms | 300,455 B | 59% |

My clock reads a few minutes behind the PM's: the PM's "about 09:58" falls between 09:48:43 and 09:54:38 on mine. The count rises by about 4 refs a minute: one per finished turn.

- inferred: `for-each-ref` cost follows the ref count and the `packed-refs` size (785 KB to 300 KB). After the prune, listings are 4–25× faster, and their variance under load is gone. `vcs.listRefs` and `vcs.refreshBranch` run the same listing (finding 2 below), so they should gain likewise. Not measured inside T3.

**The 1,065 refs that matched no listed thread** (measured: `unmatched.mjs`, a read-only select of T3's scope and thread tables plus one live-only `t3_thread_list` MCP call, at about 09:55):
- All 371 segments left (2,006 refs) have a scope in the store, and all are `root` scopes. The 358 the PM couldn't match are **75 archived threads**, which `t3 thread list` leaves out, and **283 subagent threads**, which `t3 thread list` drops on the client ([S1] 880–916).
- Rule: prune a segment only when its thread is **not live** and its **parent is not live**. Live means it appears in `t3_thread_list {projectId, includeSubagents: true, statuses: [queued, preparing, starting, running, waiting]}`, one call of about 90 ms (part 2). The parent check matters because a coordinator messages a finished worker child again for fixes. A child whose parent is live is kept.

| Group now | Segments | Refs | By the rule |
| --- | --- | --- | --- |
| archived, no parent | 28 | 341 | prune |
| archived, parent not live | 34 | 68 | prune |
| archived, parent live | 13 | 43 | keep |
| subagent, not live, parent not live | 254 | 529 | prune |
| subagent, not live, parent live | 28 | 82 | keep |
| subagent, live | 2 | 4 | keep |
| top-level, live | 6 | 844 | keep |
| top-level, not live (unsettled, kept by the PM) | 6 | 95 | keep |

That is **316 segments, 938 refs to prune**, and 55 segments kept.
- Recipe for the PM:
  1. Write the live thread ids, one per line, from that MCP call, to `live-ids.txt`.
  2. `node ~/.braid/artifacts/agento/0083/unmatched.mjs C:/code/agento live-ids.txt --safe` prints the segments to prune, one per line.
  3. For each, delete `refs/t3/orchestration-v2/checkpoints/<segment>/ordinal/*` in one `git update-ref --no-deref -z --stdin` transaction, as T3 does.
- The script reads the store read-only: one `SELECT` joining the scope table (1,544 rows) to the thread rows, and one `SELECT DISTINCT thread_id` of live runs through their covering index. Without `live-ids.txt` it falls back to that live-run index, which misses threads `waiting` on background work, so pass the file.

## What else loads the machine (T3's logs; evidence from the PM)

Two sets of findings [S29], cited as given: "T3 trace logs, 2026-11-28, read by the PM" (PM) and "T3 traces, 2026-11-28, read by a PM helper" (helper), both on T3 0.1.13. I checked each against the code where that was cheap.

| # | Finding (source) | Checked here |
| --- | --- | --- |
| 1 | **Per-turn git snapshots.** T3 takes a checkpoint on every turn (`CheckpointCaptureServiceV2`, from `RunFinalizationService.finalize`), and no setting turns it off. In 31 minutes about 1,500 git processes ran; capture-lock waits reached 294 s and finalize up to 367 s (PM) | read [S19]: captures run under a per-workspace lock (`withWorkspaceLock`, 405–410), up to 6 git processes per thread (`REPOSITORY_SCOPE_CONCURRENCY`, 42). A baseline is skipped only after 2 timeouts (`BASELINE_CAPTURE_BUDGET` 5 s, 40; 506–511). No checkpoint setting in `packages/contracts/src/settings.ts` (searched). `finalize` is at `RunFinalizationService.ts` 73; I didn't trace its call into capture |
| 2 | **Checkpoint refs are never pruned:** 5,587 in agento and 2,358 in everix4; `vcs.listRefs` and `vcs.refreshBranch` were slow (PM) | confirmed: only deleted threads' refs are pruned (part 5). Measured counts and timings above |
| 3 | **Submodule diffs.** The Changes panel diffs submodules in full; everix4's emptied `docs`/`data` submodules (about 1.4M deleted lines) pushed `review.gitDiffPreview` past 15 s (PM) | partly: the review diff of the parent repository runs with `--submodule=short` ([S25] `vcs/GitVcsDriverCore.ts` 118–129), so the full lines more likely come from everix4's submodules being their own checkpoint scopes (`repository:<path>` scopes, measured above). I didn't find the diff preview handler (`rg gitDiffPreview` found nothing in `apps/server/src`) |
| 4 | **Trace logs:** 725 MB in `~/.t3/userdata/logs` (PM) | measured: 726 MB, of which **513 MB is `logs/provider/`** (`events.<id>.log*`). Traces are capped at 10 files of 10 MB per kind ([S26] `config.ts` 246–247) |
| 5 | **PR sweep.** `ThreadPullRequestServiceV2` runs every minute over the unsettled, unarchived, non-subagent threads with a branch, grouped by project, cwd and branch, with concurrency 32. Branches with a PR are rechecked every sweep; branches without one at most 4 per sweep and 30 minutes apart. It also fires on run end, checkpoint capture and unsettle (helper) | read [S27] `orchestration-v2/ThreadPullRequestService.ts`: selection 228–300 (subagents left out, 231–236; unarchived and unsettled, 266–272; grouped by project, cwd and branch, 296–300), concurrency 32 (293), every minute **only while `shouldRunOpportunisticWork`**, meaning a foreground client lease ([S27] 609–620; `background/BackgroundPolicy.ts` 189–191). Throttle numbers not checked |
| 6 | **Remote poller** (fetch, ahead/behind, PR status): only for cwds with an open thread view or diff panel, while a T3 window is visible and recently used; every 30 s (balanced), 15 s (performance), off (battery-saver); sidebar rows watch HEAD only (helper) | partly: `STATUS_UPSTREAM_REFRESH_INTERVAL` is 15 s ([S25] 130); the per-mode intervals weren't found by name |
| 7 | **Timings:** `vcs.refreshStatus` 27–56 s, queued up to 100–130 s (agento, everix4); single git calls 10–13 s with at most 6 at once, so machine load is the cause; plain `git status`: everix4 2.8 s, agento 0.6 s (helper) | not re-measured; consistent with the CPU load seen throughout this spike (part 2) |
| 8 | **T3's store** is now 3.3 GB; `subscribeThread` up to 7.5 s; the server stalls up to about 5.8 s between finished operations (helper) | not re-measured. Event-loop stalls go to a log of their own ([S26] `observability/EventLoopMonitor.ts` 136–158) |
| 9 | **fsmonitor:** `C:\code\everix4\.git\config` sets `core.fsmonitor=true`, shared by its 82 worktrees, so a git run there that doesn't override it starts a daemon; T3 always passes `-c core.fsmonitor=false` (helper) | read: T3 passes it ([S28] `vcs/GitVcsDriver.ts` 600, 1285, 2180). **braid's own git calls don't override it**: `rg fsmonitor src` finds nothing, and braid runs git from `src/braids/gitio.ts`, `gitbranch.ts`, `branches.ts`, `src/commands/{board,clean,coordinate,done}.ts` and `src/board/done.ts` |

**What settling saves in the PR sweep** (measured: `sweep.mjs`, one read-only select at about 10:00; inferred from [S27]):
- After the PM's settling, **47 threads** in all projects are swept: unsettled, unarchived, not subagents, with a branch. That is 22 in one project, 14 in agento (on 3 branches), 9, 1 and 1. Of the 47, 35 have braid titles (worker, review, coordinator).
- The sweep groups by project, cwd and branch, so its lookups per minute are at most the number of distinct groups: at most 47 now, and fewer where threads share a cwd and branch.
- Before the settling, agento alone had 448 top-level threads, 12 of them unsettled (the PM's numbers). So the 436 settled agento threads were already outside the sweep. What settling buys now is the 35 braid threads still unsettled. Those are at most 35 lookups a minute, each a `git` call plus a share of a batched GitHub GraphQL query ([S27] 500), while a T3 window is in use.
- inferred, for 0080's strand that launches PM and coordinator threads with auto-settle off: a coordinator works on its own branch and worktree, so it stays one sweep group (one lookup a minute) for its whole life. That is cheap next to a worker's. The cost that grows is unsettled workers and reviewers left behind: keep auto-settle on for them, and settle a coordinator when its braid ends.

## Recommendation for braid

1. **Talk MCP from one long-lived process (0080), and keep one session** instead of one per call. That removes the 7–24 s process cost and the two session writes per call. It also stops `auth_sessions` from growing. This is the change that matters. Every other step is a few hundred ms at most.
2. **Per board read:**
   - one `t3_thread_list` with `includeSubagents: true` and the five live `statuses`;
   - one `t3_thread_read {limit: 1, runLimit: 1, maxCharsPerItem: 1}` per live thread that needs its worktree, branch or pending count;
   - recorded subagents and checkers resolved from the live list, with no per-record read.
   Expected: well under 1 s of server time per read here. Keep the 30 s cadence.
3. **Every few minutes, or on a `braids/` change, not every 30 s:** the full list (idle threads, idle coordinators, titles), with `settled: false` where settled threads don't matter.
4. **Cache in the board process:**
   - worktree and branch per thread id (they don't change for a thread);
   - finished records (0077/J, keep);
   - the full list between its refreshes;
   - the project id (resolve the path once).
5. **Until 0080, on the CLI** (0077 follow-ups):
   - cache worktree and branch by thread id, so a running thread is shown once and then only when its pending count matters;
   - don't show a parent per `clean` candidate when the same parent was shown in that run;
   - make sure only one board service reads a project. Two ran here (whether they serve the same projects wasn't checked).
   `--messages 1` doesn't help.
6. **For agents:** no change needed: the skills already wait for wakes. A PM's resume could use `t3_thread_list {titleContains: "coordinator", settled: false}` instead of paging all threads.
7. **For 0080's MCP approach:** the cheap MCP calls are `t3_thread_list` with live `statuses` (cost by live threads), `t3_thread_read` with `limit: 1`, `task_status` and `t3_thread_search`. The expensive patterns are an unfiltered list paged to the end, and a status filter that includes any non-live status (shells for every candidate). Reading a subagent from its parent thread acknowledges its result. The board isn't a thread, so this doesn't apply to it.
8. **Checkpoint refs** (part 5): prune settled, archived and finished-child refs by the rule above every so often. Never prune live threads, children of live parents, or `pre-rewind` refs. After a large prune, a `git gc` returns the space. A braid command could do this (`braid clean` already prunes braid's leftovers).
9. **Settle what braid finishes:** a worker's or reviewer's thread once its PR is merged or its review posted, and a coordinator's when its braid ends. Each unsettled thread with a branch is one PR-sweep lookup a minute while a T3 window is in use (part "What else loads the machine"). With auto-settle off for coordinators (0080), braid has to settle them itself.
10. **braid's own git calls in everix4:** pass `-c core.fsmonitor=false` (or set it per worktree), as T3 does, so they don't start fsmonitor daemons in its 82 worktrees.

## Things to ask T3 upstream (for the user; nothing was sent)

| Ask | Why | Evidence |
| --- | --- | --- |
| A light CLI path for `thread` reads: don't load ~10 MB of modules and open the database in the CLI process, and reuse a session | The process is more than 90% of each call's time | part 2; [S1] 252–295, [S3] 156–158 |
| `t3 thread list` flags: `--status`, `--subagents`, `--settled`, `--limit` | The CLI hard-codes `includeSubagents: true`, drops subagents on the client and pages to the end | [S1] 880–916, [S6] |
| `t3 thread show --messages 0` (or `--no-messages`) making one read | Status, worktree and pending need one `t3_thread_read {limit: 1}`; `show` makes 2 or more | [S1] 461–514 |
| `worktreePath`, `branch` and `pendingRequestCount` on list items | Then one list answers the board without per-thread reads | the list item fields (measured) and the read's fields (part 2) |
| A `threadIds` filter on `t3_thread_list` | One call for N known thread ids (braid's records) | [S6] has no such field |
| Prune revoked and expired `auth_sessions` | 405,159 rows, growing by one per CLI call | measured; no `DELETE FROM auth_sessions` in v0.1.12 [S4] |
| An optional retention policy: archive settled threads after N days | Active lists are filtered by `archived_at IS NULL`; 1,526 of 1,626 threads are active | [S8], [S12], measured |
| Prune checkpoint refs of settled and archived threads (after N days, keeping `pre-rewind`), not only of deleted ones | 5,643 refs in agento before the PM's prune; listings went from up to 2.2 s to under 0.1 s after it | part 5; [S22] 2006–2037 |
| A setting to turn off or thin per-turn checkpoints (per project, or for agent threads) | about 1,500 git processes in 31 minutes; capture-lock waits up to 294 s (PM) | finding 1; [S19] 40–43, 405–410 |
| A cap or a summary for submodule diffs in the Changes panel and in checkpoint scopes | `review.gitDiffPreview` past 15 s on about 1.4M deleted lines (PM) | finding 3; [S25] 118–129 |
| Size and age limits for `logs/provider/` event logs, as the traces have | 513 MB of the 726 MB in `logs` | finding 4 (measured); [S26] 246–247 |
| A PR sweep that skips threads without a PR more aggressively, or a way to leave agent threads out | at most one lookup a minute per unsettled thread with a branch | finding 5; [S27] 228–300, 609–620 |

## Proposed follow-ups

- **0077 follow-up (story, S):** the CLI-era savings in recommendation 5: cache worktree and branch per thread, one parent show per run, one board service per project. Update `docs/board.md` (what a read asks T3).
- **0080 (when unheld):** build its reader as recommendation 2–4: live-only list, `limit: 1` reads, a slow full list, one session. Its brief could quote this report's "cheapest call per need" table.
- **User decision (not an item):** whether to archive or delete braid's settled threads, by hand or with a policy, and whether to send the upstream asks.
- **braid prunes T3 checkpoint refs (story, S–M):** a `braid` command, or a step of `braid clean`, that applies part 5's rule: one live-only MCP list, the segment recipe, one `update-ref --stdin`, and an optional `git gc`. Dry run by default. Docs: `docs/cli.md`.
- **braid settles what it finishes (story, S):** settle worker and reviewer threads when their PR merges or their review is posted, and coordinators when their braid closes (`t3_thread_update` or the CLI). This bears on 0080's auto-settle strand.
- **braid's git calls set `core.fsmonitor=false` (task, S):** in braid's git runner (`src/braids/gitio.ts` and the other call sites), with a test.
- **For the PM now:** prune the 316 segments (938 refs) that part 5's rule marks safe in agento, and apply the same rule in everix4 (2,358 refs, its `repository:` scopes included).

**Against:** candidate A (store size drives cost) is very unlikely (5–20%). Every query read is indexed, the server spans are tens of ms, and the call that needs no database took 9–19 s. Candidate C holds only in a small way: the active-thread index is filtered in memory after its `WHERE`, so a project with many more active threads pays more per list page. The strongest evidence against the answer is noise: two runs per call on a machine at 70–100% CPU, with no CPU profile of the CLI. A profile could show that the database open or the session write, waiting on the server's writer (`busy_timeout` 5 s), is the larger share. That wouldn't change the recommendation (fewer processes), only the upstream ask's wording. The answer assumes the server trace spans cover the whole server-side cost. The trace times each tool call from request to response, so they do.
**Unknowns:**
- The exact split of a CLI call between module load, database open and session writes. A `--cpu-prof` of one call, or T3's CLI trace if it has one, would settle it.
- Whether the two board services served the same projects (`braid board` status would settle it).
- When most of the `auth_sessions` rows were made: not queried, to avoid another scan.
**Searched:**
- Upstream at v0.1.12: `cli/thread.ts`, `persistence/` (`Sqlite`, `DatabaseStorage`, `AuthSessions`, `Migrations`, `initializeV2Database`), `auth/EnvironmentAuth.ts`, `mcp/OrchestratorMcpService.ts`, `mcp/toolkits/{orchestrator,thread}`, `orchestration-v2/{ProjectionStore,ThreadManagementService,ProjectionMaintenance,ThreadSearch}`, `cli/doctor.ts`, `docs/user/project-settings.md`, `packages/contracts/src/orchestratorMcp.ts`.
- `rg` for `compacted-at`, `listProjectThreads`, `t3_thread_search`, `LIVE_LISTED_THREAD_STATUSES`, `DELETE FROM auth_sessions` (none), `archiveAfter|autoArchive|retention` (only worktree and usage retention).
- The bundle by `grep` of the same names.
- Upstream `main` (S14) for drift.
- T3 issues and discussions: not searched (no claim needs them, and the brief asks for no upstream contact). SQLite's docs: not needed; set aside (S16).

## How the live store was touched

- **Read-only CLI calls:** 18 `t3` calls (the tables above, plus one mistyped `--project` path, 26.6 s, and one first list, 18.2 s), sequential and spaced 20 s.
- **Read-only opens:** four, with `node:sqlite` `new DatabaseSync('file:///…/statev2.sqlite?mode=ro', { readOnly: true })`. They read the pragmas (`page_size`, `page_count`, `freelist_count`, `auto_vacuum`, `journal_mode`) and the schema (`sqlite_schema`), ran `EXPLAIN QUERY PLAN` for four queries, and ran small counts. The counts: `COUNT(*)` and a `GROUP BY project_id` over the 1,626 thread rows; the payload length of this project's 792 active rows; `MAX(sequence)` through its index; and one `COUNT(*)` of `auth_sessions`, which scanned that table's covering index (405,159 entries). That last one was more than the brief's "schema and plans only" intends. It was one call of about 60 ms, read-only.
- **No copy was made.** Free space on C: was 55.0 GB at the start (store plus WAL: 3.13 GB, so 3x is 9.4 GB). Two board services and other agents were running, so I measured on the live file, read-only.
- **No write by me** to the store, its WAL or its SHM: no read-write open, VACUUM or checkpoint, and no T3 maintenance command (`doctor`). What the `t3` CLI calls write by design (an `auth_sessions` row each, [S4]) is what every braid call does today. That was 18 rows, against 405,159.
- Also read: T3's own trace files (`~/.t3/userdata/logs/server.trace.ndjson*`), one pass each.
- **For question 5 and the PR sweep (2026-11-28, 09:40–10:00):** more read-only opens, the same way:
  - `seg.mjs --verify` and `find.mjs`: a `SELECT` of the checkpoint scope table (1,544 rows) joined to the thread rows;
  - `unmatched.mjs`: the same join with two `json_extract`s, plus `SELECT DISTINCT thread_id` of live runs through their covering index;
  - `sweep.mjs`: one `SELECT … GROUP BY project_id` over the unarchived thread rows, with `json_extract`s.
  Each is one query of under a second. Also two live-only `t3_thread_list` MCP calls, one `t3_thread_read {limit: 1}`, and `git for-each-ref` in `C:\code\agento` 12 times, 1–4 minutes apart. No ref was pruned or written by me: the prune was the PM's.
- Deleted at the end of the run: the extracted bundles (`apps/server` of `server.asar`, both versions) and the upstream clones (v0.1.12, v0.1.13) in the scratchpad. The scripts and raw timings are kept in `~/.braid/artifacts/agento/0083/`.

## What changed

- `braids/0083-how-braid-can-read-t3-lightly/report.md` (this) and `sources.md` (S1–S29); the brief's Plan, question 5 and Completion boxes. No product code, docs or skills.

## Why

The board's T3 read timed out at 60 s under load (0077). The user asked to research, in T3's code, whether reads are filtered in SQL or loaded and filtered in memory, before braid reads T3 more.

## Validation

- Every code claim is cited to upstream at the installed build's commit: v0.1.12 (`ca81b7b9`) for questions 1–4, v0.1.13 (`bc0f04da`) for question 5 and the log findings. Where the code runs here, it is also cited to the installed bundle's file and line.
- Timings were run here (commands, times and load above). Server costs come from T3's own trace.
- The checkpoint ref recipe was checked against every scope and ref in agento (part 5).
- Gate: the local `npm run verify` was stopped at its 1-hour limit on the loaded machine (typecheck and build passed; one timing test failed under load). The gate evidence is CI's braids-only fast path, green at d4621d95 (run 46133563913).

## Docs

None edited: a spike edits no docs. None is made untrue by this report. `docs/board.md` ("what a read asks T3") changes with the 0077 follow-up or 0080, not now.

## Open

- The CLI cost split is a two-run sample under load (Unknowns).
- Not checked in code:
  - the PR sweep's throttle for branches without a PR (finding 5);
  - the remote poller's per-mode intervals (finding 6);
  - the Changes panel's diff preview handler (finding 3);
  - whether the working-tree Changes panel reads checkpoint refs.
- `vcs.listRefs` inside T3 after the prune: not measured; only plain `git for-each-ref`.

For later items: (needs the user's go) none for skills. The PM resume step could use `titleContains`/`settled` (recommendation 6), a skill edit for the user to approve.

Needs the user: outward: whether to send the upstream asks listed above to T3 (nothing was sent). data: whether to archive or delete braid's settled threads in T3 (1,526 of 1,626 are active), which shortens T3's lists but deletes history if deleted.
