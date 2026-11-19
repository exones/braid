# Report: 0037 Coordinator asks with the question tool and set options

## What changed

- `.agents/skills/braid/SKILL.md`, "Talking to the user": the one-line question-tool rule became three rules (when the tool is used, how options are offered, what counts as a reply) and four option sets, each answer tied to its next step:
  - Handover: *Merge now* ("Merge on request" with the recap's head), *I'll merge it myself* (end the turn, the user's "merged" or `gh pr list` starts "After the merge"), *Let me see the report* (show `report.md` and the PR link, ask again).
  - Plan: *Approve* (Plan step 7; for a go, start the first ready strand), *Change something* (one `amend` commit per round, ask again), *Show me the briefs* (link the briefs, ask again).
  - Planning PR (a goal's planning PR into its braid branch, Plan step 7): *Merge now* (a plain merge pinned to its head once checks are green), *I'll merge it myself*, *Show me the PR*.
  - Decision: the concrete choices, recommended first.
  - Stop case: the ways forward the case allows (go on, change the plan, stop here).
- The other stops in SKILL.md only name their set: Plan steps 6 and 8, a worker that fails twice (stop case `quality`), the converge loop, the mandate (`scope`, decision: absorb, prerequisite, phases), handover (step 5), "Merge on request" (now also reached from *Merge now*; a moved head becomes a decision *Hand over new head* / *Leave it*, the latter ending the turn with the request open), and the sweep (*Sweep as proposed*, *Change the list*, *Not now*, which only passes the leftovers). The stop-case set excludes growth beyond the mandate, which is a decision under `--key scope`.
- `.agents/skills/braid/references/auto-mode.md`: the sweep proposed while strands go on stays in chat with lettered answers, because a pending question would hold the next worker's report and PR wakes; an auto-mode stop asks with the stop-case options plus *Merge it*.
- `docs/decisions.md`: D66 and its log line.

## Why

The user answers most stops from the phone; one tap beats typing. The old line said only "use the question tool if it has one", without when, which options, or what each answer does. The "only when the turn waits for the user alone" rule comes from 0015/A option D: a held question blocks the turn, so wakes and worker reports queue behind it.

## Validation

- `npm run verify` passes (docs gate, typecheck, build, 300 tests).
- Walked each option against the skill: every answer leads to an existing step ("Merge on request", "After the merge", Plan steps 6 to 8, "Adjusting the plan", "Sweep" step 3); each `braid ask` in SKILL.md and auto-mode.md names its set.

## Open

- D66, not D65: braid 0034's branches already use D65. 0036's "decision numbers" strand is about this kind of clash.
- `references/workflow.md` ("Branch protection refuses a merge": `braid ask`) and `references/resuming.md` ("relaunch or `braid ask`") still say `braid ask` without a set. The workflow is read by every role and resuming leaves the case open; both fall under the general rule (a stop is a stop case). Left as they are to stay inside the brief's files.

For later items: 0036's "recaps lead with the action" can put the handover options' question right under the recap's first line.
Needs the user: process: the change edits the braid coordinator skill (`.agents/skills/braid/`); the user reviews and merges it.
