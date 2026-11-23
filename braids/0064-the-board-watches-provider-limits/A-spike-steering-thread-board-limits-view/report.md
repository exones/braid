# Report: 0064/A Spike: steering thread, board limits view and pushes

**Research: can the board pause busy agents through a steering thread it starts, and what does it do and show?** — answered. Two points are open: steering from Codex and the cost of a run in the 3% margin.

**Answer:** Yes. A haiku thread that the board starts with `t3 thread start --provider --model` has T3's MCP tools. Its `t3_thread_send mode:"auto"` steered a busy worker, a coordinator blocked in `t3_thread_wait`, and a `delegate_task` child within the same half second. All three answered `Paused:` 4–8 s later, and the whole steering run took about 30 s. The steering thread found the child itself, because the CLI's thread list shows no children. Resume needs no steering thread: a plain `t3 thread send` from the board starts every idle paused thread at once, a child included. The board should record the pause itself and run the resume clock in code. The steering thread only sends, collects the replies and settles: archiving itself fails its run. Confidence: high for reach and resume (measured here, matching 0061's runs); medium for the design choices (reasoned from those runs and the code); low for Codex as the steering provider (not run).

## Q1: the steering thread, live

- **It reaches all three kinds of agent.** `measured` [S4]: the board-style start `t3 thread start <project> - --provider Claude_Everix --model claude-haiku-5-5 --title … --json` gave a thread with the T3 MCP tools. Its three `auto` sends at 10:01:35.08–.57Z all returned `steered`.

  | Target | Steer to effect | `Paused:` received |
  | --- | --- | --- |
  | Busy worker (180 s foreground `node`) | command moved to the background in 0.66 s | 7.9 s after the send |
  | Coordinator in `t3_thread_wait` on its child | wait cut in 0.23 s | 4.4 s |
  | `delegate_task` child (same busy command) | (same as the worker) | 7.1 s |

  This matches 0061/A, which steered from a worker's own thread, not a CLI-started one (`read [S1]`).
- **Run length.** `measured` [S4]: start 10:01:13Z, tools loaded +10 s, targets listed +16 s, sends +22 s, last reply +30 s. A real pause also waits for each worker's commit and push, so expect 1–3 minutes, bounded by a 10-minute limit (Q2).
- **Children are found by the steering thread, not the board.** `measured` [S5]: `t3 thread list` returned 351 threads and none with a `parentThreadId`, so the board can't see reviewers or researchers that were launched as `delegate_task`, nor 0060's child workers. `measured` [S4]: the steering thread found the child with `t3_thread_list includeSubagents:true, allProjects:true, statuses:["running"]` by `parentThreadId` and provider. The board passes top-level targets, and the steering thread adds their running children on the same provider.
- **Model and provider: a new `models` role `steering`, with an ordered fallback.** `inferred` from [S6][S7][S8]: every role here runs on Claude_Everix, so when Claude is over, the steering thread must run elsewhere. Proposal for the user's `BRAID.md` (a user edit):

  ```yaml
  steering:
    first: Claude_Everix / claude-haiku-5-5 / effort=low
    fallback: codex / gpt-6-luna / effort=low
  ```

  The board takes the first line whose provider is under its threshold. `readModelLines` already reads nested keys (as `worker.story`), so `steering.first` and `steering.fallback` parse today (`read [S8]`). `assumed`: Codex threads get the same T3 MCP tools and steer the same way. T3 says Codex supports active steering (`read [S1]`, S5 there), but no Codex steering thread was run (Unknowns).
- **When every steering provider is over: steer from the over provider anyway, with the small model.** `inferred`: at 97% a session still has 3% left. A haiku run of about 30 s with a dozen tool calls is a small fraction of that (`assumed`: not measured as a share of the window). Not pausing lets every agent run into the hard limit mid-step, which is the failure 0061 exists to avoid. The board uses `steering.first` then, and pushes "no provider to steer from" (mockup 6). If the provider is already at 100% (a hard stop), nothing can steer, and the push says so.

## Q2: its job and messages

- **First message: self-contained, built by the board's code from a template.** It is no skill. `inferred` from [S4]: the probe's 20-line message was enough for haiku. A skill would have to be installed in every project the board lists, and it would drift from the board's version. The message holds the provider, window, usage and resume time, the target list (id, kind, braid or strand), the literal pause message and the reply format.
- **Targets: the board passes them from its snapshot.** Per braid on the board's projects, these threads on the provider over its threshold:
  - the running or idle (not archived) coordinator;
  - workers that are running or idle, such as one on a PR watch, whom CI would wake;
  - recorded reviewers;
  - PM threads (`🧭 … pm:`, 0062, `read [S9]`).

  `t3 thread list` gives `providerInstanceId` per thread (`measured` [S5]); the board's `T3Thread` keeps it only for coordinators today (`read [S8]`), so B adds it for workers. The steering thread adds the running children of each target on that provider.
- **The pause message: limits.md's text unchanged** (`read [S8]`). Its `<your thread id>` is the steering thread's id, so the `Paused: <id> at <sha>` lines come back to the thread that collects them. A coordinator gets the PM variant ("Under a PM"), with the note that its agents were messaged directly: it launches nothing, replies `Paused: <number>` and ends its turn. A PM gets "braids <list> are paused by the board; launch nothing on <provider> until the board's resume message", and replies `Paused: pm`.
- **Collecting replies.** `measured` [S4]: each reply arrives as a message that cuts the steering thread's own `t3_thread_wait`. The model sees the reply text but not the sender, so the id inside the `Paused:` line is what matches a reply to a target. That works for real items, whose lines carry the id. The probe's identical lines confused it. The steering thread waits until every target answered, re-waiting after each interruption, for at most 10 minutes. Then it reads each silent target's thread (`t3_thread_read`, last message and status) and reports it as `no answer`.
- **Its result: one machine-readable last line** that the board parses with `t3 thread show --messages 1` (`read [S2]`):

  ```text
  Steering: Claude_Everix paused 4/5; children: <id>,<id>; no answer: 0026/A
  ```

  The board stores the child ids so it can resume them (Q3).
- **Who records the pause: the board, before it starts the steering thread** (a change from the braid brief's "that agent … records the pause"). It calls `setPause` with `by: "board"` and the steering thread id, in code. Why (`inferred`):
  - the record is the lock that keeps a second board from steering again (Q5);
  - the paused state shows at once;
  - a steering thread that dies doesn't leave agents told to stop with no record.

  `PAUSERS` gains `board` (`read [S8]`), and the record gains `threads` (every paused thread id) and `steering` (thread id and outcome). This is the user's call (Needs the user).
- **Title and emoji.** The title is `🚦 <repo> steering: pause Claude_Everix Session 97%`, with a new role `steering: "🚦"` in `ROLES`. 🧪 is taken by research (`read [S8]`). The title regex needs a 4-digit id, so B or C adds a steering pattern that no item reads as an agent.
- **Ending: settle, not archive.** `measured` [S4]: archiving itself mid-turn ended the run as `failed` ("provider event stream closed unexpectedly"). `settle` with no `threadId` applied at turn end, and the run completed cleanly. The CLI can do neither (`read [S2]`). So the steering thread settles itself as its last call, and the user or a later cleanup archives it. A late `Paused:` that arrives after it ended starts one more short turn. Its first message says to end such a turn without acting.

## Q3: resume

- **The board's clock.** At each refresh (every 30 s), for each `by: board` pause whose `resumeAt` has passed, the board runs `braid limits <provider>` (code: `readProvider`):
  - `ok`, or `unknown` (a stale cache or a past `resetsAt` reads as go, as in 0061): resume.
  - `pause`: keep the pause with the new `resumeAt` (`setPause` again) and push "still over" (mockup 6).
- **The resume message: a plain CLI `t3 thread send`, no steering thread.** `measured` [S4]: sent to an idle worker, an idle coordinator and an idle `delegate_task` child, each returned `delivery: started` in under 2 s and replied. A target that something woke in the meantime is busy, and then the CLI send queues: it gets the message after that turn (`read [S2]`), which is fine for a resume. Messages:
  - workers and children: `Resume: continue <id> from your checkpoint` (unchanged, `read [S8]`);
  - coordinators: `Resume: <number> was paused by the board for <provider>; go on where you left off`;
  - PMs: the same with the list of braids.

  Then `clearPause` (the `braid resume` code). A send that fails keeps the pause and is retried at the next refresh.
- **A resume missed while the board was down.** It is the same rule: the first refresh after the board starts finds `resumeAt` in the past and resumes. While no board runs, today's "resume was due" (amber after 15 min) and "stalled" (25 min) marks still apply (`read [S8]`, board.md "Paused"). The resume push says "was due 12:40".
- **Weekly window.** The board pauses as usual. The weekly reset can be days away, so the paused braid reads Needs You with a derived reason `limit`, like the broke alarms: no file and no `braid ask`. The line reads "Weekly limit: <provider> <n>% until <time>. Wait for the reset, or move <roles> to another provider in BRAID.md models", and the board pushes it once at high priority. Waiting is doing nothing: the board resumes at the reset. Moving a role is the user's `BRAID.md` edit plus `braid resume <number>`; the coordinator then launches on the new provider.

## Q4: who else checks

- **Coordinators keep only the check before a launch** (`braid limits --role …`, which costs nothing). They drop the 15-minute check task, the wait-timeout check, the resume task and `braid pause`. On exit 3 a coordinator launches nothing, says so once (`⏳ <provider> over its threshold; launching nothing until it resets`) and ends its turn. With a board running, the board pauses its running agents and resumes the braid. A PM-run coordinator tells its PM once, as today.
- **No board running: nothing pauses and nothing resumes.** Running agents work on into the hard limit, where T3 stops their turns mid-step. A coordinator still never launches into a limit, but it isn't woken at the reset, so the user says "go on" (or starts the board) afterwards. The board prints this at its start ("Limits: watching Claude_Everix, codex; pauses through a 🚦 steering thread") and docs/board.md states it. That is the trade the braid accepted: one watcher, no per-braid tasks.
- **A PM** keeps the check before launching a coordinator, acts on the board's pause and resume messages for its programme, and keeps no check or resume task.

## Q5: rules

- **The click-only rule gets one listed exception.** For provider limits only, the board may:
  - start a 🚦 steering thread;
  - send resume messages with `t3 thread send`;
  - write `.braid/pauses.json` (`by: board`), next to `broke.json` and `notified.json` (`read [S8]`, board.md "Refresh").

  Everything else stays click-only. `--demo` never acts. A `braid board --no-pause` flag turns the exception off for one run (the board still shows limits), and the start line says which mode is on.
- **Two boards.** The pause record is the claim. The board checks and writes it under the existing `locked()` lock, and a braid that already has a record (any `by`) is no target. A second board, or a later refresh, finds the record and starts nothing. One board serving several projects starts one steering thread per provider for all of them (targets span projects; `allProjects` lists their children). For resume, clearing the record is the claim. A race can send a duplicate resume, which only queues a no-op turn.
- **A steering thread that fails.** The board reads its status at each refresh. It counts as failed when:
  - its status is `failed` or `interrupted` without the `Steering:` line;
  - no `Steering:` line came within 15 minutes;
  - `t3 thread start` itself failed.

  Then the pause record stays, the braid reads Needs You "Pause failed" with the targets that didn't answer, and the board pushes it at high priority (mockup 4, 6). There is no automatic retry beyond trying the fallback steering line once when the start itself fails, so a broken provider isn't hammered every 30 s.

## Q6: the board and the phone

Mockups on the demo data: [mockups/limits.html](mockups/limits.html), rendered as [mockups/limits-full.png](mockups/limits-full.png).

1. **Header strip:** one chip per provider (every instance in `BRAID.md` `models` of the listed projects, plus any provider a running thread uses), with Session and Weekly meters and the threshold as a tick. The chip states:
   - grey: ok;
   - amber: near (within 10 points);
   - red: over, "pausing… 2 of 3";
   - sky: "paused · resumes 13:55";
   - dashed: unknown ("no reading for 14 min") or "not measured" (cursor).
2. **While pausing:** the affected cards carry a spinner and a sky line, "Pausing for Claude_Everix Session 97%: 1 of 2 agents answered". A braid on another provider keeps going.
3. **Paused by the board:** "paused by the board 6 min ago · 2 of 2 agents answered". It turns amber when an agent didn't answer, and amber "resume was due" when no board ran at the time. The **limits panel** opens from a chip and shows, per provider: the windows with bars and reset times, the roles, the agents paused or running on it, and the last steering thread with its outcome and an Open thread button.
4. **Needs You:** only the weekly window and a failed pause.
5. **Phone:** the chips move into a strip under the header, and the panel opens full-screen.
6. **Pushes:** one per event and provider, never one per braid, with keys in `notified.json`:

   | Event | Title | Tag | Priority |
   | --- | --- | --- | --- |
   | Paused, all answered | `Claude_Everix paused until 13:55` | ⏸️ | low |
   | Paused, one didn't answer | `Claude_Everix paused; 1 agent didn't answer` | ⚠️ | high |
   | Pause failed | `Claude_Everix: pause failed` | ❌ | high |
   | Resumed | `Claude_Everix resumed` | ▶️ | default |
   | Still over at the resume time | `Claude_Everix still over: resumes 18:55` | ⏸️ | default |
   | Weekly window | `Claude_Everix weekly limit: needs you` | ⚖️ | high |
   | No provider to steer from | `Claude_Everix over, steering from it` | ⚠️ | default |

   Each body names the braids and strands and nothing else from the repository. The full bodies, clicks and keys are in mockup 6. Recommended: send "pausing" only when a pause hasn't completed within a minute, so a normal pause and resume is two quiet pushes.

## Against

- **The steering thread records the pause itself** (the braid brief's wording): unlikely to be better (20–45%). It keeps the board a pure reader, but it puts a state write behind an LLM step that can fail, and it leaves no lock against a second board.
- **No steering thread: the board queues the pause with `t3 thread send`:** very unlikely (5–20%). A worker's turn can last most of an item, so the pause would arrive only after that turn (`read [S1]`, queue timing).
- **A resume through a steering thread:** very unlikely to be needed (5–20%). The resumed threads are idle, and the CLI starts them (`measured`).
- **The answer rests on these assumptions:**
  - Codex steering works like Claude's.
  - A haiku run fits in the 3% margin.
  - Agents put their id in the `Paused:` line.
  - If Codex steering fails, a Claude-only setup can only steer from the over provider; it would then always be the "no provider" case, which still works at 97%.

## Unknowns

- **Steering from Codex.** Settled by one probe in C on the `codex` instance (haiku-sized model, `🧪 … probe` title): start a thread with `--provider codex --model gpt-6-luna` and steer a busy Claude probe.
- **The share of a session window one steering run uses.** Settled by reading `usedPercent` of the instance before and after one run on a quiet provider.
- **How a steer lands in a Codex or Cursor target that runs a long tool** (0061/A: Cursor interrupts tools; Codex not run).
- **Whether `includeSubagents` lists children of children** (a worker's researcher). It wasn't needed in the probe. If not, the coordinator's or worker's own pause step covers its children.

## Searched

- `t3 … --help` for every `thread` subcommand.
- The T3 MCP tool schemas (`t3_thread_list`, `t3_thread_organize`, `t3_thread_update`, `t3_thread_read`, `t3_thread_wait`).
- `t3 thread list --json` fields and children.
- The provider caches (`usageLimits`, `models`) and `braid limits --json`.
- The repo: limits.md, docs/board.md and docs/cli.md sections, `src/braids/{limits,pauses,roles,title}.ts`, `src/board/t3.ts`, `src/notify/message.ts`, the existing paused mockup and screenshot.
- The 0062 brief on its branch.
- Set aside:
  - The T3 source: 0061/A's reading of `sendToThread` and the adapters is current for 0.1.6, and the runs here answered the rest.
  - The `t3_thread_update` tool: it only renames.

## Proposed strands B to D

- **B. The board reads and shows provider limits (M, ui, about 350 lines in 8 files).**
  - `readProviders` at each refresh for the providers of `models` and of running threads.
  - `providerInstanceId` on worker threads.
  - The header chips, the limits panel and the phone strip (mockups 1, 3, 5).
  - Demo readings, and the steering role emoji and title pattern.

  No pushes and no actions.
- **C. The board pauses and resumes through a steering thread (L, about 750 lines in 12 files).**
  - The `steering` model lines, the target list and the message template.
  - `t3 thread start`, parsing the `Steering:` line, and `by: board` with `threads` and `steering` in `pauses.json`.
  - The resume clock with the re-check, the CLI resume sends, the missed resume, failure detection, the two-board claim and `--no-pause`.
  - The weekly `limit` need, the limit pushes and keys, the pausing, paused and failed card lines, and the Codex probe from Unknowns.

  If C heads past about 900 lines, split the resume, the weekly window and the pushes into a strand of their own (M) after C.
- **D. Skills (M, not L, about 150 lines of text in 4 files).**
  - limits.md rewritten: the board pauses; coordinators keep only the check before a launch; the coordinator and PM variants of the board's pause and resume messages; no check task, resume task or `braid pause`.
  - The braid skill's launch steps, and braid-pm's.
  - braid-worker unchanged (the pause message stays), but checked.
  - The `models.steering` line, as a proposal for the user's `BRAID.md` edit.
- **E. Docs (S):** unchanged.

## What changed

`report.md`, `sources.md` and `mockups/` (`limits.html`, `limits-full.png`) in this item's folder. No product code, skills or docs.

## Validation

- The live runs are in S4 (haiku probes on Claude_Everix, all archived afterwards). The mockups render with headless Edge.
- `npm run verify` passed.

## Docs

None affected: no behaviour of braid changed. D87's replacement, the click-only exception and the `pauses.json` write belong in `docs/decisions.md` and `docs/board.md` once the user has decided, in C, D and E.

## For later items

- C could show a "Pause now" button on a provider chip, for the user's "pause, limit close" (limits.md). It would be a click action, so it stays within the click rule.
- A steering thread that finishes could archive older settled steering threads: archiving another thread is fine, only archiving itself fails.

## Needs the user

- **architecture: who writes the pause record.** The braid brief says the steering agent runs `braid pause --by board`. This spike recommends the board record it in code before it starts the steering thread, because the record is also the lock against a second board and survives a failed steering run. Needed: approve the board as the writer, or keep the agent.
- **architecture: steering when every provider is over.** Recommended: steer from the over provider with the small model in the 3% margin, and push that it did. The alternative is not pausing. Needed: pick one.
- **process: the `steering` role in `BRAID.md`.** Your edit: `steering: first: Claude_Everix / claude-haiku-5-5 / effort=low`, `fallback: codex / gpt-6-luna / effort=low`, or other models.
- **ui: the mockups and push texts** in `mockups/limits.html` (header chips, pausing and paused cards, the limits panel, the two Needs You states, the phone strip, nine pushes). Needed: approve or change them. Also choose whether the weekly window sits in Needs You until the reset (recommended) and whether to drop the "pausing" push in the normal case (recommended).
