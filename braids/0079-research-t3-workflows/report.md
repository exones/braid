# Report: 0079 Research: T3 Workflows

**Research: which parts of braid could run as T3 Workflows (T3 v0.1.12, beta) instead of braid code, what would that simplify, and at what cost?** — answered.

**Answer: keep all six parts in braid.** No part gets simpler as a workflow without adding a second state machine next to braid's records, and three facts get in the way:

- A workflow can't steer braid's running threads. A workflow `agent` step sends with `mode: "queue"`, so it waits behind the whole turn, while the board's wake, pause and resume need a send now and no wait for the result.
- The threads a workflow starts are left out of every thread list, so the board wouldn't see them.
- The board's planned "Supervised" MCP sign-in (P27) can read runs but not start, answer, resume or cancel them.

Workflows went into a release two days after they merged, with 16 fixes in that same release. They sit behind a Labs switch that is off on this machine. Revisit when they leave beta, and only for a part that has no braid record today.

Confidence: high for the facts the verdicts rest on (read in T3's v0.1.12 code and docs, two independent sources each: the docs and the code, or a PR body and the code). Medium for the overall verdict: it is a judgement against the programme rule, and nothing was run.

Overall recommendation: **keep**. No follow-up braid now. The revisit triggers are under Q5.

## What was read and what was run

- **Read:** T3 at tag `v0.1.12`, a shallow clone outside the repository: the user docs for workflows and outside agents, the `t3-workflows` skill, and the workflow engine, store, migration, agent steps, MCP tool, access checks and CLI ([S2]–[S10]). Also the v0.1.12 release notes and four PR bodies ([S1], [S4], [S5], [S11], [S12]), braid's code and docs for the six parts ([S14], [S15]), P27's row ([S16]) and the 0061/0064 spikes ([S17]).
- **Run, read only:** `t3 --version` (v0.1.12), a search of `~/.t3/userdata/settings.json` for workflow keys (none, so `workflowsEnabled` is at its default, off), and `ls ~/.t3/workflows` (no folder) ([S13]).
- **Not done:** no Labs switch was enabled, no workflow was created, started or changed, and no scratch T3 was started. No live run would change a verdict: each verdict rests on access rules, where state lives and what the board can see, and those are fixed in the code.

## Q1: What a T3 workflow is at v0.1.12

- **Shape.** A workflow is a TypeScript file in `~/.t3/workflows/` (or `T3CODE_WORKFLOWS`). It registers `workflow(name, { version, payload, triggers?, asks?, onEnd? }, Effect.fn(body))`. The server watches the folder and reloads on save. `T3`, `Effect`, `Schema`, `Option`, `Duration` and `Schedule` are injected globals, and a file must not import `effect` (`read [S2][S3]`).
- **Steps.**
  - `step` and `step.try` run code once per run and journal the result.
  - `agent` and `agent.try` run an agent in a thread. They take an optional typed `returns` (up to 2 correction prompts), `workspace` (root or worktree), `model`, `runtimeMode`, `timeout`, and `quiet` for agents that wait across turns.
  - `ask` puts a multiple-choice question to a person (`Option`, with `timeout`, `kind`, `links`, and choices that require a reason).
  - `wait` sleeps until a signal arrives; `sleep` is a durable sleep; `invoke` runs a child run; `pullRequests.wait` polls about once a minute.
  - `stop`, `skip`, `title` and `tags` end or label the run.

  `store` (key–value, with transactions), `signal` and `signalAll` work only inside a step (`read [S3]`).
- **Triggers.** A run starts manually (`t3 workflow start <name> --input … --key …`, idempotent per key), or from `every` (at least 1 minute; downtime collapses into one run), `daily` (a run missed by more than 10 min is skipped), `webhook` (at most 60 runs a minute) or `issues.opened`/`pullRequests.opened` (polled about once a minute) (`read [S2][S3]`, `read [S1]` for #41989).
- **Durability.** Runs, steps, waits and buffered signals are rows in T3's `statev2.sqlite`, beside the journal of Effect's cluster workflow engine (single runner, SQL storage) (`read [S4][S9]`).
  - The body replays from the top after every wait or restart, and finished steps return their stored values. A step may run more than once, so side effects must be idempotent (`read [S3]`).
  - A T3 restart or crash: the run continues at the next start. A wait keeps its wake "so a wake lost to a crash is redone" (`read [S9]`).
  - A reboot or downtime: "Runs … only advance while it is running" (`read [S2]`).
  - An upgrade: a changed body needs a higher `version`, and the old one stays until its runs end. A run whose version was removed is `retired` and can't continue (`read [S3]`).
- **Failures.** A failed code step pauses the run and retries after 5, 20 and 80 min. An agent that gave up or timed out waits for a person (`read [S2][S3]`).
- **Run states.** `running`, `waiting`, `paused`, `completed`, `stopped`, `skipped`, `cancelled` (`read [S3]`).
- **Concurrency and rate limits.** Steps run in parallel through `Effect.all({ concurrency })`. There is a sweep every 15 s, timeouts can end up to 15 s late, and a hook starts at most 60 runs a minute. No limit on concurrent runs was found (`read [S3][S9]`, searched `WorkflowEngine.ts`/`WorkflowRuntime.ts` for concurrency and limit).
- **Logging and visibility.**
  - Web and desktop: a Workflows page with "Needs you", "Running" and "All", and the agent transcripts. The PR for web and mobile is #38884 (`read [S2]`, `read [S1]`; the mobile view itself was not read).
  - CLI: `t3 workflow list|show|questions` (`read [S2]`).
  - MCP: the `t3_workflow` tool, hidden from agents inside threads, which use the CLI (`read [S6]`).
  - MCP Events: `workflow.run_started`, `needs_input`, `input_resolved`, `run_paused`, `run_resumed`, `run_ended` (`read [S4][S8]`).
  - Agent-step threads are "never in thread lists", `t3 thread list` included (`read [S2][S10]`).
- **Access.**
  - Reading runs, questions and the store is open to any caller.
  - Starting, answering (`signal`), resuming, cancelling, withdrawing, changing the store and reading hook paths need a caller at the broadest mode: Full access, or a managed policy's maximum. The reason given is that a run's agent steps pick their own modes (`read [S5][S8]`).
  - The `t3` CLI on the host is a full-access client of its own and is not limited (`read [S5][S7]`).
  - **For P27:** the board's OAuth sign-in at "Supervised" ([S16]) can list and read runs and questions, but can't start, answer, resume or cancel one. Through the CLI it already uses (`src/board/t3.ts`), the board could do all of that as the owner, with no new sign-in (`inferred` from [S5][S7][S14]).
  - MCP Events for workflows need the OAuth path, like thread events (P27's first pass: "MCP Events usable only with OAuth (no CLI path)", [S16]).

## Q2: The six parts

Line counts are from `wc -l` at `c2b3aa7a` ([S14]).

### 1. The board's stall wake, reminders and nudges — **keep**

- **Today:** `wake.ts` 122, `remind.ts` 95 and `nudge.ts` 77 lines, plus the request record (S14).
  - After each 30 s read, the board closes a request whose "done when" holds (`pr:`, `braid:`, `time:`) as `met`, and sends the asking thread one `Wake:` through `t3 thread send`.
  - It reminds the addressee of an open wait at most hourly, and nudges a coordinator or PM that has stalled for 10 min (S14, D100 in [S15]).
  - It keeps no wake state of its own: it sends first, then records on `braid-requests`, and re-reads the record before each send (S14).
- **As a workflow:** one run per request. It would `pullRequests.wait` or `sleep` until the condition holds, then message the coordinator.
  - The only built-in way to message an existing thread is an `agent` step with `thread: <id>`. It sends with `mode: "queue"` and then waits for that turn's result (`read [S10]`). That is a queued turn the step watches, not a one-shot wake. A `node:child_process` call to `t3 thread send` from a step would work, but that is braid's CLI call moved into a T3 file.
  - The reminder needs the request's addressee and ETA, and the nudge needs the stall clock. Both are braid state (`braid-requests`, `broke.json`), which a step would have to read from git.
- **Simpler:** `pr:` waits would use T3's PR polling instead of the board's `gh pr list`.
- **Harder:** two sources of truth for one request (its JSON on `braid-requests` and a run in T3's SQLite). Wake runs would be one per request, keyed and versioned, and cancelled when the request closes in braid. The board still runs for everything else.
- **Verdict:** keep. The board already reads everything a wake needs every 30 s, and a workflow can't steer.

### 2. Scheduled steps and timed waits — **keep**

- **Today:** a timed wait is a request opened with `braid ask … --to self --done-when time:<iso>`. It has 2 states (open, met), the board's wake closes it, and it holds off the stall clock until its time (S14). The skills forbid T3's `schedule_task` ("schedule no resume"), and `waits.ts` (78 lines) is only the reminder helper (S14).
- **As a workflow:** `sleep("until", …)` and then a wake. This is the same "how to reach the thread" problem as part 1.
- **Simpler:** nothing. The request already holds the time, and the board already wakes.
- **Harder:** a second place where a wait lives, invisible to the board's stall logic.
- **Verdict:** keep.

### 3. Approvals and requests (`braid ask` / `answer`) — **keep**

- **Today:** `src/braids/requests.ts` 664 and `src/commands/requests.ts` 563 lines. A request is one JSON file per code on the `braid-requests` branch, with an event list that only grows (`opened`, `forwarded`, `answered`, `withdrawn`, `met`, `eta`, `reminded`). It has 4 states, 5 kinds and 4 kinds of "done when", and PM routing is worked out at each read (S14, D96 in [S15]). The answer reaches the agent in chat, and the agent records it with `braid answer` (D99).
- **As a workflow:** `braid ask` would also start a run that `ask`s the question, so it shows under "Needs you" on web and mobile with choices and a reason. The answer would come back as `answeredBy`/`answeredAt`, then be written to `braid-requests` and sent to the asking thread.
- **Simpler:** a native answer UI with choices, required reasons and a timeout.
- **Harder:**
  - The run and the request are two records of one question, and they can disagree: answered in T3 but not recorded, or withdrawn in braid while the run still waits.
  - The run still has to reach the thread (part 1).
  - Answering needs Full access or the CLI ([S5]).
  - The user decided against a question tool or dialog. D99 says: "No braid role asks with a question tool or dialog (… a pending request in T3) … the record … keeps every question and its answer with a code, so the dialog no longer adds anything, and a pending dialog held every wake" ([S15]).
- **Verdict:** keep. The programme rule's own example of a reliable call ("like with requests") is this record.

### 4. Provider-limit pause and resume — **keep**

- **Today:** `pause.ts` 179, `steer.ts` 240, `steerer.ts` 405, `limits.ts` 355 and `pauses.ts` 245 lines (S14).
  - The board reads T3's provider caches.
  - Over the threshold, it claims a `by: board` record per braid in `.braid/pauses.json` under a lock.
  - It starts a 🚦 steering thread that steers busy agents with `mode: "auto"` (about a second).
  - Once `resumeAt` passes and the limits are clear, it sends `Resume:` (up to 5 tries).
  - It tracks 2 reasons, 3 pausers, 4 steering outcomes and 3 phases (S14, D90 in [S15]).
- **As a workflow:** an `every("1 minute")` run whose step reads the caches, then an `agent` step for the steering thread, then a `sleep` until `resumeAt`, then the resumes.
- **Simpler:** the retry clock and `sleep` would be durable.
- **Harder:**
  - A queued send waits behind the whole turn, so it can't pause a busy agent. Steering needs `auto`, which only an agent's MCP call has ([S17], 0061/A S4).
  - The steering thread would be an agent-step thread that the board can't list ([S10]).
  - The step would run at the run's own mode, which needs Full access to start ([S5]).
  - The claim in `pauses.json` is what stops a second board. A workflow would need its own claim in `store`, a second lock on the same fact.
  - T3's own usage-limit auto-resume already clashes with braid's resume, per P27's first pass ([S16]). A third actor adds to that.
- **Verdict:** keep. Pause and resume are 0074's subject and already the board's one exception (D90).

### 5. The PM's digest — **keep**

- **Today:** there is no digest code. The digest is a PM habit (braid-pm skill). The PM sends one when three braids finished, after five decisions, or when nothing can run until the user acts. It goes out in chat plus one `braid notify send` push, and its one-line summary sits in the plan file's `digest:` front matter (S14). `pm.ts` (103) and `programme.ts` (242) derive routing and the programme panel, not the digest.
- **As a workflow:** a `daily` or `every` trigger and an `agent` step that writes a digest.
- **Simpler:** nothing to remove. A timed digest would replace an event-driven one and cost an agent turn per tick.
- **Verdict:** keep.

### 6. Coordinator, worker and reviewer launch — **keep**

- **Today:** `start.ts` 213, `coordinate.ts` 234 and `t3.ts` 378 lines. `braid start` creates the branch, the worktree and a `started` event, and launches no thread (S14).
  - Coordinators launch workers with `t3_thread_launch` and `t3_thread_send`, and reviewers and researchers with `delegate_task`.
  - The board's Start button runs `t3 thread start … --worktree`.
  - The board finds threads through `t3 thread list` and their titles or worktrees (S14, [S15] board.md 190–191).
- **As a workflow:** a run per item: an `agent` step for the worker (worktree, model, `returns: Report`, `quiet`, `timeout`), then `pullRequests.wait("checks")`, then an `invoke` of a review workflow. It reads well: typed reports would replace parsing the final message.
- **Harder:**
  - Agent-step threads are "never in thread lists" ([S10]), so the board, `braid clean` and the coordinator's own thread tools would stop seeing workers.
  - The models per role in `BRAID.md` would have to be copied into workflow code.
  - The item's state would live in a run as well as on braid's branches.
  - The user's T3 skills (`braid`, `braid-worker`) would split between agent instructions and a workflow file.
  - A failed agent step waits for a person to resume it ([S2]), not for the coordinator.

  This is a re-architecture, not a part.
- **Verdict:** keep.

## Q3: Costs and risks

- **Beta and churn.**
  - The feature PR merged on 2026-11-23 ([S4]) and the release shipped on 2026-11-25 with "Workflows (beta)", 16 workflow fixes and a test change ([S1]). One fix, #41751, was a core-engine change: saving a workflow file had stalled every workflow call for about 12 minutes on a nightly ([S11]). Another fixed Windows project paths ([S12]), and one changed who may control runs ([S5]).
  - Base rate: 19 workflow PRs (2 features, 16 fixes, 1 test change) in about two days. Treat the API and its behaviour as moving for at least a few releases (`inferred` from [S1]; the reference class is this one feature's first release, so the spread is wide).
- **Full access.** Every change to a run needs Full access over MCP ([S5]). The CLI path doesn't, because it runs as the owner ([S7]). So a workflow-based braid would either use the CLI, as today, or need a Full-access OAuth sign-in, which is wider than the user's "Supervised" choice for P27 ([S16]).
- **Lock-in.** Workflow files only run inside T3. They depend on injected `T3` globals and T3's Effect runtime, and runs "live on the server that started them" ([S2][S3]). The docs promise nothing for use without T3 (searched `docs/user/workflows.md`, the skill and `outside-agents.md`). braid today runs its records in Git and talks to T3 only through the `t3` CLI and MCP (S14).
- **Windows.** Supported. A Windows path bug was fixed in this release ([S12]), and backslash UNC paths stay unsupported ([S12]). The `t3` CLI wrapper on this machine is a `.cmd`, already handled by `t3.ts` (S14).
- **Persistence across restarts.** Good inside T3: SQLite, replay, redone wakes ([S9]). But runs only advance while T3 runs ([S2]). The braid board has the same limit (D95 puts it on a logon task), so neither is better here.
- **Two sources of truth.** Every part above has a braid record: `braid-requests`, `pauses.json`, `broke.json`, the plan files and the lifecycle. A run would hold a second copy in T3's SQLite with its own states (7 run states, plus wait and step states) ([S3]). That copy is the "second state machine" the programme rule warns against.
- **Showing on the board.** Runs are not threads ([S4]), and agent-step threads are hidden ([S10]). The board would need a new reader (`t3 workflow list --json`, or MCP Events through P27's sign-in) and a new mapping from run to item. Today it has neither.
- **Labs switch.** Off on this machine ([S13]). Turning it on is the user's call, and the T3 skill says not to edit the settings ([S3]).

## Q4: Fit with the programme rule

> "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests"

A workflow does make a single chain durable: its steps are journalled and its sleeps survive restarts. But each braid part is already a record plus one reader (the board) that acts on it. Moving a part would keep the record (the board, the PM and the user read it) and add a run that mirrors it. That is a second state machine for each part, the "spaghetti state" the rule names. The one reliability gain, durable timers, doesn't matter here: braid's timers are times in records, which the board compares on each read. For launch, workflows would also make the skills larger (a workflow file per role) rather than smaller. **Verdict: no part gets more reliable without a second state machine.** (`inferred` from Q2 and Q3.)

## Q5: Recommendation

**Keep. Don't plan a follow-up braid now.** No "try one small thing" is proposed. The nearest candidate was mirroring requests to the user as T3 `ask` questions, for the mobile "Needs you" view, and it runs straight into D99 and the two-records problem. The next nearest is a timed digest (part 5); it removes no code today, and revisit trigger 4 covers it.

**Revisit when** one of these holds; each would change a verdict above:

1. Workflows leave Labs and beta, and a release ships with no core-engine fixes to them.
2. A workflow can send to an existing thread with `auto`/steer delivery without waiting for its turn. That would reopen parts 1 and 4.
3. Agent-step threads can be listed (or `t3 thread list` gains an option for them). That would reopen part 6.
4. braid gains a part with no braid record of its own, for example a timed report that nobody else reads. A workflow would then add no second source of truth.

How the user would see the effect: nothing changes; the board, requests and pauses work as today.

## Against

- **Move requests to `ask` (unlikely, 20–45%, that it would be a net gain).** Best case: the user answers on the phone from a native question with choices and a required reason, and gets `answeredBy` for free. Against it: D99 rejected exactly this kind of pending question in T3, and the record would be doubled. What would change this: the user saying the chat-plus-board answer path is too slow on mobile.
- **Move the launch to a worker workflow (very unlikely, 5–20%, now).** Best case: typed reports and a durable worker → CI → review chain. Against it: hidden threads, models copied into code, Full access, beta churn, and a re-architecture rather than one part.
- **Try a timed wait as a workflow (very unlikely, 5–20%, to add value).** It is a 2-state record already.
- **Strongest evidence against "keep":** T3 is clearly investing in workflows (19 PRs in one release), and braid's board duplicates some of what they offer (PR polling, durable timers). If T3 adds steer delivery and listable agent threads, much of the board's steering could move, so revisit at the triggers above.
- **Assumptions:** (a) the board stays the one actor that acts without a click (D90, D100). (b) P27 keeps the "Supervised" sign-in. (c) The `agent` step's `thread` option keeps `mode: "queue"`. If (c) changes, parts 1 and 4 reopen.

## Unknowns

- How the mobile app shows workflow questions, and whether it notifies. Not read (#38884 was not opened). That matters only for the request mirror, which isn't proposed. Opening #38884's client code would settle it.
- Whether any limit caps concurrent runs. None was found in `WorkflowEngine.ts`/`WorkflowRuntime.ts`, but the search was not exhaustive. It isn't needed for "keep".
- How workflows behave across a T3 upgrade in practice. Settling it needs a live run on a scratch T3 (not proposed).

## Searched

- T3 clone at v0.1.12: `rg -l -i workflow` over `apps/server/src`, `packages`, `docs`, `skills`. Read the hits in `apps/server/src/workflows/`, `mcp/toolkits/workflow/`, `cli/workflow.ts`, `persistence/Migrations/110_Workflows.ts`, `docs/user/{workflows,outside-agents}.md` and `skills/t3-workflows/SKILL.md`.
- Searched `writesOwnerWork`, `assertBroadestAccess`, `clientModeCeiling`, `hiddenFromThreads`, `withThreadTools`, `workflowStep`, `launchOnContinue`, `input.thread`, and concurrency, limit and restart in the engine.
- GitHub: `gh release view v0.1.12`, and `gh pr view` for 38882, 41977, 41751 and 41456. The other fix PRs are known by title only and not cited for their content.
- Searched for "Supervised", which found `approval-required` labelled "Supervised" in `policyTemplates.ts` and `managedPolicy.ts`.
- Set aside: `ORCHESTRATION_V2_WS_METHODS.stopWorkflow`/`getWorkflowScript` in `RpcAuthorization.ts`, which concern agent workflow scripts in threads (the `t3_workflow_stop` tool), not T3 Workflows. The mobile client was also not read.

## Validation

- `npm run verify` (the gate), run locally: 705 tests passed and 2 failed, after 29 minutes (normally about 20 s). The two failures are both `test/requests.test.ts` "overlapping writers in separate processes lose no update" (plain, and "when they start on a stale lock"). Each spawns six writer processes that compete for one lock, and they failed after 150–170 s with the CPU at 100% and about 89 node/claude processes running. A re-run of only those tests failed the same way (371 s). This branch changes only files in `braids/0079-*`, and `main`'s CI passed at the commit it starts from (`90c3d68`). So the failure is lock contention under load on this machine, unrelated to a change that touches only `braids/`.
- The evidence that the gate passes: outside `braids/`, this branch is identical to `main` at `90c3d68` (`git diff --stat 90c3d681 HEAD -- . ':!braids'` is empty). `main`'s CI ran its Verify step (`npm run verify:full`, a superset of the gate) green there, on Windows and Ubuntu (Actions run on `90c3d68`). This PR's own CI passed, but by its fast path for `braids/`-only changes, which skips the Verify step, so it doesn't count as gate evidence. The machine was still at about 91% CPU, so I didn't re-run the gate locally.
- `braid check` prints `braids OK`.

Docs: none affected. This spike changes no product behaviour, and the brief rules out docs changes before the user decides.

Decisions: none from the user. Mine:
- (a) I proposed no "try one small thing". The nearest candidate (the request mirror) conflicts with D99.
- (b) I didn't start a scratch T3, because no live run would change a verdict.

For later items:
- `docs/board.md` line 192 still says requests and review threads live in ".braid/ of the main checkout". Since D96, requests are on the `braid-requests` branch. The fix is one line, in a docs item.
- If P27's MCP Events reader is built, the same subscription can carry `workflow.*` events at no cost. That is only worth doing if a revisit trigger above fires.

Needs the user: none
