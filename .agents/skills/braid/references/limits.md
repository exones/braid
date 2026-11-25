# Provider limits

How a braid's agents stop cleanly before a provider's usage limit and start again after the reset. [The skill](../SKILL.md) points here from each launch. `braid limits` and `braid resume --limit` are in the project's CLI docs (`docs/cli.md`); the board's side is in `docs/board.md`, "Provider limits".

**The running board pauses and resumes.** When a provider is over its threshold, the board claims a `by: board` pause record per braid, starts one 🚦 steering thread (the `models.steering` role in `BRAID.md`: a `first` line and a `fallback` line) and has it message every agent of those braids on that provider. After the reset plus the buffer it re-checks and sends each paused thread its resume message. Coordinators and PMs keep no limits check task, schedule no resume and run no `braid pause` for a limit. Only agents on the provider over its threshold stop; launches and agents on other providers go on. Hard stops (a limit already hit mid-turn) aren't handled here, and threads are never snoozed.

## Check before launch

`braid launch` checks the limits for the agent's model; a coordinator's launch is checked with `braid limits --role coordinator`. `unknown` (stale cache, an `unsupported` provider such as `cursor`) never pauses.

- Exit 3, `pause`: launch nothing on that provider. Say so once, with the provider, window and resume time it prints, and end the turn. The board's pause and resume messages take it from there; a PM-run coordinator also tells its PM ("Under a PM"). Don't poll, schedule a check or schedule a resume.

## The board's pause message

The board's steering thread sends each message with `t3_thread_send` `mode:"auto"` and tells you where to reply (`<steering thread id>`).

- **A worker, reviewer or researcher** gets `Pause for <provider> <window> until <resume time>. Finish or undo your current step; never stop mid-commit. A running command may already have moved to the background: let it finish. Commit and push your WIP, log a checkpoint (`braid log --checkpoint`), send `Paused: <id> at <sha>` to <steering thread id>, end your turn. Start no new work until a resume message; …`. `<id>` is the item id (`0064/D`), never a thread id. Start no new work until `Resume:`; if something wakes you meanwhile, note it, reply briefly only with your item's CI result if that is what woke you, and end your turn again.
- **A coordinator** gets `Pause for <provider> <window> until <resume time>: the board is pausing braid <number>'s agents on <provider> and has messaged them directly. Launch nothing on <provider>, schedule no resume and run no braid pause: …`. Message no worker yourself. Reply `Paused: <number>` to the steering thread and end your turn.
- **A PM** gets `Braids <numbers> are paused by the board for <provider> <window> until <resume time>; launch nothing on <provider> until the board's resume message. Reply Paused: pm to <steering thread id> and end your turn.` Launch no coordinator or other agent on that provider; reply `Paused: pm` and end the turn.

A wake meanwhile (a late reply, a PR watch) is noted, answered only as the pause text says, and the turn ends again.

## The board's resume message

- **A worker or reviewer:** `Resume: continue <id> from your checkpoint`. Read your last checkpoint (`braid view <id>` and your log) and go on from there.
- **A coordinator:** `Resume: <number> was paused by the board for <provider>; go on where you left off`. Check the state first (branches, worktrees, worker threads, `braid next`), then go on. The board sent your agents their own resume messages and cleared its record: run no `braid resume`.
- **A PM:** `Resume: <numbers> were paused by the board for <provider>; go on where you left off`. Check the plan file and `braid status`, then go on with "Running". Run no `braid resume`.

If a coordinator's or a PM's agents didn't get a resume (the board lists them under no answer), read their threads and send `Resume: continue <id> from your checkpoint` yourself.

## Without a running board

Nothing pauses and nothing resumes: no board, `--no-pause`, or no `steering` role in `BRAID.md`. The check before a launch still stops a launch on exit 3. An agent that runs on may hit the limit; the user decides. When the user says go on, or the reset has passed, `braid limits <instanceId>` exits 0: launch and continue. If a pause record is still there, `braid resume <number> --limit` clears the limit pause (a hold stays; plain `braid resume` lifts a hold and is the user's). When the user asks for a pause for a limit by hand ("pause, limit close"), send the worker pause text above to each agent on that provider, wait for the `Paused:` lines and end the turn; the user's go lifts it. A plain "hold" or "pause" with no limit in it is a hold ([autonomy](autonomy.md), "Hold").

## Weekly windows

Over a weekly threshold the board pauses the same way and shows the braid in Needs You (reason `limit`) until the reset. The coordinator or PM asks nothing and never switches providers itself. To change providers, the user edits the role in `BRAID.md` `models`, then says go: `braid resume <number> --limit` clears the pause and launches use the new provider.

## Under a PM

A PM-run coordinator ("Launched by a PM") keeps no limits check task and schedules no resume; it follows the board's messages as above. At the check before a launch with exit 3 it also sends the PM `<number>: <provider> <window> over its threshold, resumes <time>; launching nothing` once (not again for the same window) and ends the turn.
