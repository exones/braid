---
id: '0061/D'
title: "Pause and resume in the skills"
status: Outline
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0061/A', '0061/B', '0061/C']
order: 40
---

## Goal

The braid, braid-pm and braid-worker skills (and braid-reviewer and braid-researcher if the spike shows they run long enough to need it) carry the pause and resume protocol, so a coordinator or PM checks limits before every launch, pauses cleanly when over and resumes by itself.

## Working at the end

- **Check before launch.** Before launching a worker, reviewer, researcher or (PM) coordinator, `braid limits --role …` for the provider that agent will use. `ok` or `unknown`: launch (one line for `unknown`). `pause`: don't launch; pause.
- **Clean pause.** A message to each dependent running thread: finish or undo the current step, commit and push WIP on its own branch, log where it stopped, end the turn; never stop mid-commit. `braid pause <number> …` so the board shows why. A PM pauses every braid on that provider and tells each coordinator; a PM-run coordinator follows the PM.
- **Automatic resume.** A one-shot `schedule_task` at `resetsAt` + buffer that wakes the coordinator (or PM). It re-reads `braid limits`: `ok` sends "continue" to the paused threads and runs `braid resume`; still `pause` reschedules.
- **Weekly windows** (the user's choice): pause and schedule the resume as for a session window, and `braid ask --kind decision` so the user can move the role to another provider in `BRAID.md` `models`.
- Other providers keep running: only agents on the paused provider stop.

## Open questions (answered by 0061/A, then detailed here)

- Whether `schedule_task` wakes the coordinator's own thread, survives a T3 restart, and how to cancel a stale one.
- Whether a pause message reaches a running thread mid-turn or only at its end.
- Whether reviewers and researchers (short `delegate_task` children) need the pause message or only the launch check.
- The launch path after 0060, if 0060 merges first.

Plan it fully when its turn comes, asking the user if needed.
