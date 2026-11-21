# 0061/D report

## What changed

- **New `.agents/skills/braid/references/limits.md`** ("Provider limits"): `braid limits --role --kind|--tier` before every launch (exit 0 `ok`/`unknown` launch, `unknown` said in one line; exit 3 pause); while agents run, a 15-minute `interval` task `braid <number> limits check` in the coordinator's thread for when its turn has ended (created at the first launch, deleted when none runs, on pause and at Finish), and, since a scheduled run only queues during an active turn, a worker wait in 10-minute `t3_thread_wait` slices with the same check on each timeout; the pause: the exact `mode:"auto"` pause message, `t3_thread_wait` for the `Paused:` line (re-check a cut-short wait; an agent that never answers is logged and paused anyway), a self-deleting `interval` resume task `braid <number> resume <provider>` with `everyMs = max(60000, resumeAt − now)` (never `fixed_time`, `once` when offered), `braid pause … --thread --task`, and the `⏳ Paused for …` line; the resume (not paused any more: end; exit 0 incl. stale/past reset: `Resume:` messages and `braid resume`; exit 3: reschedule and `braid pause` again); weekly windows also `braid ask --kind decision` (*Wait for the reset* / *Move <role> to another provider*); the user-asked pause with `--until`; and the PM-run coordinator's part.
- **braid skill:** the reference is listed with the others and named at each launch point (worker, reviewer, researcher), in the worker wait (`timeoutMs: 600000`, the check on each timeout), "Launched by a PM", "Finish" (step 0 deletes a leftover check task) and "Say waiting".
- **braid-pm:** the check before launching a coordinator, and a "Provider limits" section: one PM-level 15-minute check task (the PM waits by ending its turn, so a queued run starts at once), pausing every braid on the provider (steer, `Paused: <number>` replies, delete the check task, one resume task with its own prompt, `braid pause --by pm` each), its own resume steps (not paused any more: end; still over: reschedule and `braid pause` again; go: `braid resume` each, tell each coordinator, recreate the check task), digest line. "Hold" points to it.
- **braid-worker "Habits":** what to do on a pause message and on `Resume:`.
- **workflow.md** failure-mode row; **autonomy.md** "Hold" and **resuming.md** one line each (a limit pause isn't a hold; a new coordinator re-owns a paused braid's resume task).
- **docs/decisions.md** D87.

## Why

The braid's goal: agents stop cleanly before a provider's limit and resume by themselves. 0061/A measured the mechanics, 0061/B and C built `braid limits`, `braid pause` and `braid resume`; this puts the steps where coordinators, PMs and workers read them.

## Validation

- `npm run verify` passed (docs gate for links, 464 tests).
- Tool parameters checked against the installed T3 schemas: `schedule_task` (`interval` min 60000, no `once` today, `bindToCurrentThread` default true, update by `scheduledTaskId`), `delete_scheduled_task`, `t3_thread_send` modes, `t3_thread_wait`.
- Not exercised live: the 15-minute check task and the PM path. The coordinator path was exercised by hand during 0061/C.

## Docs

- `docs/decisions.md`: D87 added (the user's decisions: 15-minute check, weekly ask, no snooze).
- `docs/cli.md`, `docs/board.md`, `docs/braids-format.md`, README and getting started: checked, still true ("the coordinator or PM schedules its own resume"). The user-facing overview is strand 0061/E's.

## Open

- The resume task's prompt holds its own id, filled in by a second `schedule_task` call after the first returns it; when that update fails, the prompt falls back to finding the task by title with `list_scheduled_tasks`.
- A PM-run coordinator's own launch check sends the PM a line and launches nothing; the PM then pauses. This path wasn't in the brief's wording; it follows from "the PM decides".

For later items: none.
Needs the user: process: this PR changes braid skills (the user asked for it in this braid); under `steady`, ask at the final PR.
