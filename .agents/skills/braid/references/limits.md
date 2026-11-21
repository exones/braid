# Provider limits

How a coordinator stops its braid's agents cleanly before a provider's usage limit, and starts them again after the reset. [The skill](../SKILL.md) points here from each launch. `braid limits`, `braid pause` and `braid resume` are in the project's CLI docs (`docs/cli.md`). Under a PM, read "Under a PM" first.

Only agents on the provider over its threshold stop. Launches and agents on other providers go on, for example a Codex worker while Claude is paused. Hard stops (a limit already hit mid-turn) are not handled here, and threads are never snoozed.

## Check before launch

Before launching a worker, reviewer, researcher or spike, run `braid limits --role <role> --kind <kind>` (or `--tier <S|M|L>`) for the model that agent will use, as "Project facts" resolves it.

- Exit 0, `ok`: launch.
- Exit 0, `unknown` (stale cache, no numbers, an `unsupported` provider such as `cursor`): launch, and say so in one line. Unknown never pauses.
- Exit 3, `pause`: don't launch. Pause the braid ("Pause"), with the provider, window and resume time it prints.

## Check while agents run

While any agent of the braid runs, keep one check task in your own thread: `schedule_task` with `{type:"interval", everyMs:900000}` (15 min), bound to this thread (the default), title `braid <number> limits check`, and this prompt:

```text
braid <number> limits check. Run `braid limits <instanceId>` for each provider the braid's running agents use. Exit 3 on any: pause as the braid skill's references/limits.md "Pause" says. Otherwise end the turn at once, with no message to the user.
```

Create it when you launch the first agent. Delete it (`delete_scheduled_task`; `list_scheduled_tasks` finds it by title) when no agent of the braid runs, when you pause (the resume task takes over), and at "Finish". Under a PM, the PM keeps this check for all its braids instead; don't create one.

## Pause

1. **Tell the agents.** Send each running or idle agent of this braid on that provider (worker threads, and a running `delegate_task` child such as a reviewer or researcher, by its child thread id) this message with `t3_thread_send` `mode:"auto"`. Never `queue`: it arrives only after the whole turn.

   ```text
   Pause for <provider> <window> until <resume time>. Finish or undo your current step; never stop mid-commit. A running command may already have moved to the background: let it finish. Commit and push your WIP, log a checkpoint (`braid log --checkpoint`), send `Paused: <id> at <sha>` to <your thread id>, end your turn. Start no new work until a resume message; if something wakes you meanwhile (a background command, a PR watch), note it, include your item's CI result in a short reply if that is what woke you, and end your turn again.
   ```
2. **Wait for the clean point.** `t3_thread_wait` each paused thread, then read its last message for the `Paused:` line. A wait cut short by an incoming message is re-checked, not taken as the result. An agent that never answers (its thread ended, its session died): read its last message and its branch, record what is known in the braid log, and pause anyway.
3. **Schedule the resume** in your own thread: `schedule_task` with `{type:"interval", everyMs: max(60000, resumeAt − now)}` (`resumeAt` from `braid limits --json`, already reset plus buffer), bound to this thread, title `braid <number> resume <provider>`, and the prompt below. Never `fixed_time`: T3 skips a run more than 10 minutes late. If the `schedule_task` schema offers a one-shot `once` schedule, use it instead.

   ```text
   braid <number> resume <provider>. First delete this task: `delete_scheduled_task` with id <task id> (if unknown, find it by title with `list_scheduled_tasks`). Then follow "Resume" in the braid skill's references/limits.md.
   ```

   Fill in the task id with a second `schedule_task` call (`scheduledTaskId` and the new `prompt`) once the first returns it. Delete the limits check task.
4. **Record it:** `braid pause <number> --provider <instanceId> --thread <your thread id> --task <resume task id>`, so the board and `braid status` show the pause. Then end the turn with `⏳ Paused for <provider> <window>; resumes at <time>`.

## Resume

The scheduled run wakes your thread and its prompt deletes the task first. Then:

- **Not paused any more** (`braid status <number>` shows no `Paused:` line: the user resumed by hand, or a deleted task's run was already queued): end the turn.
- **`braid limits <instanceId>` exits 0** (`ok`, or `unknown`: a stale cache or a past `resetsAt` reads as go): send `Resume: continue <id> from your checkpoint` (`mode:"auto"`) to each paused thread, run `braid resume <number>`, create the limits check task again while agents run, and go on with the braid where it left off.
- **Exit 3** (still over): never resume into a limit. Schedule a new resume at the new resume time as in "Pause" step 3, and run `braid pause` again with the new `--task`.

## Weekly windows

Over a weekly threshold, pause and schedule as above, and also `braid ask <number> "<what is needed>" --kind decision` with the options *Wait for the reset* (recommended when it is near) and *Move <role> to another provider* (the user edits `BRAID.md` `models`). Never switch providers yourself. If the user moves the role, resume the braid by hand (`braid resume <number>`, delete the resume task) and launch on the new provider.

## The user asks for a pause

"Pause, limit close": the same steps. When `braid limits` doesn't say `pause` yet, take the resume time from its session window (`resetsAt` plus the buffer) and record it with `braid pause <number> --provider <instanceId> --thread <your thread id> --task <id> --until <that time>`. A plain "hold" or "pause" with no limit in it is a hold ([autonomy](autonomy.md), "Hold").

## Under a PM

A PM-run coordinator ("Launched by a PM") neither keeps a limits check task nor schedules its own resume; the PM does both for all its braids.

- **Launch check exit 3:** launch nothing, send the PM `<number>: <provider> <window> over its threshold, resumes <time>; launching nothing`, and end the turn. The PM pauses.
- **The PM's pause message:** do "Pause" steps 1 and 2 for your agents on that provider, then reply `Paused: <number>` to the PM and end the turn. The `braid pause --by pm` record is the PM's.
- **The PM's resume message:** send `Resume: continue <id> from your checkpoint` (`mode:"auto"`) to each paused thread and go on where you left off. `braid resume` is the PM's.
