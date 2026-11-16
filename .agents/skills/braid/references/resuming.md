# Resuming a braid

Resuming is recovery: you are to act on a braid whose state you don't have in your own conversation. Read this then, before acting:

- you are a new agent or thread given a braid someone else ran (the old one crashed, was closed, or the work moved);
- your conversation was summarized and lost the working details;
- your session starts on a braid you didn't plan.

Nothing detects this for you. The user's "continue" or "merge" in a conversation that still holds the work is not a resume, and neither is a failed worker ("Run an item" in [the skill](../SKILL.md)). When the state is rebuilt, go back to the skill and continue with the next unfinished step.

Read `BRAID.md`, then rebuild the state:

- Run `braid status <number>` and `braid next <number>`, and `braid view <number>` on the braid branch for the plan and the braid's log. `git branch` shows local `plan/` and `braid/` branches not yet pushed.
- A running item: read its branch's copy (`git show <branch>:<path of its brief.md>`, and its logs) and its thread before relaunching anything; a checkpoint entry says where it stopped.
- A `braid status` line ending in `run braid done <id>`: the item was merged but not stamped; run that.
- A closed, unmerged PR of a story whose braid now has strands: it grew; continue as phases.
- A strand whose folder is gone was dropped.
- Otherwise read the item's log on its branch, then relaunch or `braid ask`.
- An `auto` label on the braid: continue in [auto mode](auto-mode.md).

Beyond the log, put notes on the braid only for what a fresh session couldn't work out from these.
