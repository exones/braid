# Report: 0061/A Spike: scheduled resume, pause messages, and who pauses

**Research: what T3 gives a pause and a scheduled resume, and who should pause** — answered, except one point that needs a T3 restart (see Unknowns).

**Answer:** A coordinator or PM can schedule its own resume with `schedule_task`, but the installed T3 (0.1.6) has no one-shot schedule: use an `interval` task bound to the caller's own thread, delete it first thing when it fires, and expect it about 5 s late. A pause message sent with `t3_thread_send` `mode:auto` reaches a busy Claude worker or `delegate_task` child within about a second. It doesn't kill the running command: Claude Code moves it to the background. It also cuts a coordinator's blocking `t3_thread_wait`. The braid brief's recommendation stands: whoever launches the agents pauses them. The board can only queue messages and can't schedule anything. Confidence: high for the message and scheduling behaviour (code read at the installed version and runs here), medium for surviving a T3 restart (code read only, not run).

## Q1: `schedule_task`

- **One-shot: none in the installed build.** `measured` [S8]: `{type:"once"}` was rejected with "Expected interval | fixed_time | webhook". `read [S2]`: the 0.1.6 bundle has only `interval`, `fixed_time` and `webhook`. `read [S1]`: upstream main has added `once` (an ISO time with offset, which must be in the future), so a later T3 update brings it.
- **Usable today as a one-shot: `interval`.** `read [S2]`: the first run is at `now + max(everyMs, 60000)`, and later runs count from when the last run completed. `measured` [S8]: a 300000 ms task created at about 17:25:35Z got `nextRunAt` 17:30:35.87Z, fired at about 17:30:40Z, and its next run became 17:35:40.14Z. So the resume task must delete itself when it fires, or it repeats every period. `fixed_time` is the wrong tool. It takes `HH:MM` in the server's zone, repeats daily, and a run more than 10 minutes late is skipped as "missed" (`read [S1][S2]`). With T3 down at the reset, a `fixed_time` resume would be lost.
- **Waking a thread: only the caller's own thread, or a new thread.** `read [S6]`, `measured` [S8]: `bindToCurrentThread` (default true) posts each run into the thread that created the task, and `boundThreadId` was this thread. `false` gave `boundThreadId: null`, which means a new thread per run. No parameter names another existing thread. A coordinator or PM therefore schedules its own wake, and the woken thread messages the others.
- **How a run lands: queued, never steered.** `read [S1][S2]`: a bound run is sent with `mode: "queue"`. `measured` [S8]: the probe, due while this thread was mid-turn, became run 4 `queued` behind the active run. An idle thread (a paused coordinator that ended its turn) starts it at once (`read [S4]`: queue on an idle thread starts it). The run uses the thread's current provider, not a stored model (`read [S1]`).
- **Timing.** `read [S3][S2]`: the scheduler checks every 5 s. `measured` [S8]: one fire was 4.3 s late. Expect 0–5 s plus the time the thread takes to start, which doesn't matter against a 5-minute buffer.
- **List and cancel.** `measured` [S8]: `list_scheduled_tasks` shows `scheduledTaskId`, `boundThreadId`, `nextRunAt` and `lastRunStatus` (`succeeded` means the message was sent, not that the turn finished). `delete_scheduled_task` returned `deleted: true`. Deleting a task does **not** withdraw a message it already queued: run 4 stayed queued after the delete. `schedule_task` with `scheduledTaskId` and `enabled=false` pauses a task instead (`read [S6]`). The `t3` CLI has no scheduled-task command (`read [S7]`).
- **Survives a T3 restart: likely (55–80%) for `interval`, not measured.** `read [S1][S2]`: tasks are rows in the SQLite table `scheduled_tasks` with a stored `next_run_at`. Due work runs at activation, after startup recovery, then every 5 s (`read [S3]`). A due `interval` run is not "missed", so it runs late at the next start. Runs left `running` by a crash are reset. Deleting the bound thread deletes its tasks, and a send to an archived thread fails (`read [S1][S4]`). A restart test needs the user's agreement (see Needs the user).

## Q2: pause messages to running threads

- **`mode:auto` steers a running turn and starts an idle one; `queue` waits for the turn to end.** `read [S4]`: `auto` gives `steer_active` when a provider turn is running, otherwise it starts or queues. `queue` is always a new turn after the active one. The result's `delivery` says which happened. Claude, Codex and Cursor all support active steering (`read [S5]`).
- **A steer reaches a busy Claude child in about a second, even mid-command.** `measured` [S8]: a child was 19 s into a 90 s foreground `Start-Sleep`. `auto` returned `steered`, the command returned 0.7 s later with a `backgroundTaskId`, and the model's next message quoted the pause. The command was **moved to the background, not killed**. When it finished, its completion notification started a new run on its own (run 3). T3 itself backgrounds only subagents on a steer (`read [S5]`), so `inferred`: Claude Code moved the shell command when the message arrived. One sample.
- **A steer also cuts a blocking MCP call.** `measured` [S8]: a child was blocked in `t3_thread_wait` (75 s timeout). A steer ended the call at once with "The tool call was interrupted before a result was received", and the model read the message in its next step. A coordinator waiting on its worker therefore gets a PM's pause right away, and has to handle an interrupted wait.
- **`queue` waits for the whole turn.** `measured` [S8]: the queued message became run 2. It started 1.8 s after run 1 ended and got its answer. A worker's turn can run for most of an item, so `queue` is too late for a pause.
- **`delegate_task` children behave like top-level threads here.** `measured` [S8]: both probes were `delegate_task` children (reviewers and researchers are launched the same way). `read [S4]`: top-level workers go through the same `sendToThread`. A send to a finished child starts a new run (`read [S9]`, 0060's runs). Cursor (the reviewer here) interrupts tools for a steer (`read [S5]`). Its usage is `unsupported`, so it is never paused for its own limit.
- **When the clean point is reached: T3 doesn't say. The agent must report it.** `inferred` from the above: a steer only delivers text, and the agent decides where to stop. A run's end shows on `t3_thread_wait` (it returns when the run ends, at once when idle) and in the thread's `status`. Only the worker's own message ("Paused: <id> at <sha>") says the WIP is pushed and logged. The agent can also be woken again after it stops, by its backgrounded command, a PR watch, or a queued scheduled run. The pause message has to tell it to stay paused on such a wake.

## Q3: coordinator/PM-driven or board-driven

**Confirmed: coordinator- or PM-driven, with the board only showing the pause.** What 1 and 2 add to the brief's reasons:

- The board reaches T3 only through the `t3` CLI (`read [S9]`). The CLI's `thread send` only queues ("nothing is interrupted"), so a pause from the board reaches a busy worker only after its turn ends (`read [S7]`, `measured` [S8] for queue timing).
- The board can't schedule a resume. The CLI has no scheduled-task command, and `schedule_task` binds only to the calling agent's thread (`read [S6][S7]`). A board-driven resume would need the board running at the reset time.
- The coordinator, and the PM, have both tools: an `auto` steer that arrives within seconds and a scheduled wake into their own thread (`measured` [S8]).
- The rule that the board acts only on the user's click stays intact (`read [S9]`, `docs/board.md`).

**Against:** the board sees every braid at once, which a user-run coordinator doesn't. That matters only when two user-run coordinators share a provider. Each reads the same cache and pauses itself, so they still agree. For the board-driven design to win, T3 would need a CLI send with steer and a CLI scheduler, and the board would need to run all the time. None of that is true today. Board-driven is very unlikely (5–20%) to be the better design.

## Proposed changes

For 0061/D (the skills):

1. **Resume task.** The pausing agent (the coordinator when the user runs the braid, the PM for PM-run braids) calls `schedule_task` with `schedule {type:"interval", everyMs: max(60000, resetsAt + buffer − now)}`, bound to its own thread (the default), title `braid <number> resume <provider>`. The prompt starts: "Delete scheduled task <id> with `delete_scheduled_task` first. Then re-check `braid limits`." If still over the threshold, it pauses again with a new task. Don't use `fixed_time`. When T3 offers `once` (it shows in the `schedule_task` schema), prefer it.
2. **Record the task.** `braid pause` keeps the `scheduledTaskId` and the owning thread. A manual `braid resume` (the user's) deletes that task, so it doesn't fire later. Deleting doesn't withdraw a run already queued, so a resume prompt that arrives when the braid is no longer paused just ends.
3. **Pause message**, sent with `t3_thread_send` `mode:"auto"` to every running or idle worker thread and every running `delegate_task` child on that provider: "Pause for <provider> <window> until <resume time>. Let a running command finish, commit and push your WIP, log a checkpoint (`braid log --checkpoint`), send `Paused: <id> at <sha>` to <coordinator thread>, and end your turn. Until a resume message, start no new work. If a background command, a PR watch or anything else wakes you, note what it says, and if it is your item's CI result, include it in the Paused message. Then end your turn."
4. **Waiting for the clean point.** After sending, the coordinator calls `t3_thread_wait` on each paused thread and reads its last message for the `Paused:` line. Then it ends its own turn. The scheduled run wakes it. A `t3_thread_wait` cut short by an incoming message is re-checked, not treated as a result.
5. **PM-run braids.** The PM schedules one resume in its own thread and steers each coordinator on that provider (`auto`). The coordinator pauses its own workers as in 3 and 4, then answers the PM, and doesn't schedule a resume of its own. On resume the PM tells each coordinator, and each coordinator sends `Resume: continue <id> from your checkpoint` to its workers.
6. **Resume message** to each paused thread: `mode:"auto"` (they are idle, so it starts a turn).

For 0061/C (paused state, board):

1. The pause record holds provider, window id, `resetsAt`, resume time, and the scheduled task id with its thread. The board shows them and doesn't call the braid stalled.
2. The board sends no messages and schedules nothing. It can't steer through the CLI and can't schedule through it either.
3. Show a resume time that has passed while the braid is still paused as overdue ("resume was due at <time>"). That covers a T3 that was down, a deleted task, or an archived coordinator thread.

## What changed

`report.md` and `sources.md` in this item's folder. No product code, skills or docs.

## Validation

- The T3 code was read twice: in upstream main (3b15a01) and in the installed 0.1.6 server bundle, which differ (`once`, thread modes).
- Measured on this machine on 2026-11-21, with probe tasks and probe children on claude-haiku-5-5, effort low. Commands, ids and timestamps are in `sources.md` S8. Both probe tasks were deleted.
- One leftover: the bound interval probe had already queued one message into this thread (run 4) before its delete. This worker answers it when its turn ends.
- `npm run verify` passed.

## Docs

None affected: no behaviour of braid changed. The decision belongs in `docs/decisions.md` when D or E documents the pause.

## Open

**Unknowns:**

- Restart survival is not measured. It is settled by creating an `interval` task 10 minutes out, restarting T3 before it is due, and checking that it fires. A second check is restarting T3 after the due time. This needs the user's agreement.
- How it behaves when the machine sleeps through `nextRunAt` is not checked. From the code, the 5 s loop picks the run up on wake (`inferred`).
- Codex steering wasn't measured. From the code it supports active steering (`read [S5]`).
- Only one sample each for the Bash backgrounding and the MCP interrupt, both on claude-haiku-5-5.
- Whether Claude Code backgrounds every kind of foreground tool on a steer is unknown. A tool it neither backgrounds nor interrupts would hold the steer until it returns (`read [S5]`).

**Searched:**

- T3 source: `rg` for `ScheduledTask`, `schedule_task`, `t3_thread_send`, `steer`, `supportsActiveSteering` and `BACKGROUND_MOVE` in a shallow clone of `pingdotgg/t3code`.
- `gh search code` in that repo, which found `docs/orchestration-v2/orchestrator-mcp-server.md`. It was set aside: the tool code and schemas are more exact.
- The installed bundle: `grep` for `once`, `isMissedFixedTimeRun`, `scheduled-task-message` and the 5 s sleep.
- `t3 --help` and `t3 thread send --help`.
- The 0060 brief and sources.

## For later items

- D could also cover a user-run coordinator that is asleep in a long wait when the threshold is crossed. The check sits at launch time, so a running worker can still run up usage until the next launch. A periodic check needs a scheduled `interval` task in the coordinator's own thread, which these results show works.

## Needs the user

none. One optional measurement is offered to the coordinator: whether a scheduled resume survives a T3 restart. The code says it does for the `interval` tasks D would use, but this was not run. The test needs one T3 restart, so it runs only if the user agrees. Without it, D relies on the code reading.
