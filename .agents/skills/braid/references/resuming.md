# Resuming a braid

How to rebuild a braid's state when you don't have it in your own conversation; [the skill](../SKILL.md) says when that is. Afterwards go back to the skill and continue with the next unfinished step.

Read `BRAID.md`, then:

- Run `braid status <number>` and `braid next <number>`, and `braid view <number>` on the braid branch for the plan and the braid's log. `git branch` shows local `plan/` and `braid/` branches not yet pushed.
- A running item: read its branch's copy (`git show <branch>:<path of its brief.md>`, and its logs) and its thread before relaunching anything; a checkpoint entry says where it stopped.
- A review that was running when the last coordinator was lost: its result won't reach you. Judge it by the PR's review comment at the head commit (`gh pr view <pr> --comments`); without one, start a fresh review task (the skill, "Accept and hand over" step 1). Never wait for a task you didn't start.
- A `braid status` line ending in `run braid accept <id>`: the item was merged but not stamped; run that.
- A closed, unmerged PR of a story whose braid now has strands: it grew; continue as phases.
- A strand whose folder is gone was dropped.
- Otherwise read the item's log on its branch, then relaunch or `braid ask`.
- The preset: `braid autonomy <number>` (the skill, "Autonomy").
- A paused braid (a `Paused:` line in `braid status`): the board resumes a limit pause itself ([provider limits](limits.md)). Otherwise it is a hold or a hand pause: the user says go.

Beyond the log, put notes on the braid only for what a fresh session couldn't work out from these.
