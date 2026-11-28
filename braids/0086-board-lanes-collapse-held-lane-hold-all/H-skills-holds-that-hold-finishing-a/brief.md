---
id: '0086/H'
title: "Skills: holds that hold, finishing a programme"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0086/C', '0086/E', '0086/F', '0086/G']
order: 80
---

## Goal

The braid skills match what 0086 built, in as few words as possible ("don't overblow skills, try to see how to make easier"): a hold text from the board is stronger than any queued or woken work, and every agent answers it with its own `Held:` line; the PM records a programme's hold where the board reads it (`braid pause --programme`), not in the plan file; and the PM asks once to close a finished programme, which the user closes.

Expected size: about 80 lines changed in 6 files.

## Start here

- Idea 2026-11-25-b1yb on branch `braid-inbox` (`ideas/2026-11-25-b1yb.md`): the five causes of a hold that didn't hold; causes 1 to 3 and 5 are what agents do with a hold.
- 0086/C's, 0086/E's, 0086/F's and 0086/G's `report.md`: the commands, the hold and go texts, the `Held:` reply, the close.
- `.agents/skills/braid/SKILL.md` and `.agents/skills/braid/references/autonomy.md` ("Hold"), `.agents/skills/braid/references/limits.md` (how the pause texts are handled: the hold texts follow the same pattern), `.agents/skills/braid-worker/SKILL.md` (the pause text), `.agents/skills/braid-reviewer/SKILL.md` and `.agents/skills/braid-researcher/SKILL.md` (whether they need a line), `.agents/skills/braid-pm/SKILL.md` and its references (holds: `hold:` and `state: held` in the plan; finishing).

## Change

- Coordinator, worker, reviewer, researcher: on the board's hold text, do what it says and end the turn with its `Held:` line; until Go, a wake (a PR watch, a queued message, a task result) is noted and the turn ends; Go is the board's go text or the user's own word. A hold from the user in chat is recorded with `braid pause --hold`.
- PM: a programme's hold is `braid pause --programme <slug> --hold "<words>"` and its go `braid resume --programme <slug>`; the plan's `hold:` and `state: held` are no longer written; row states are no longer hand-kept beyond `dropped` and `stopped`; when every row is done, ask the user once to close the programme (`braid ask pm/<slug>` with Close and Not yet), and the close is the user's.
- Keep each change to the lines that must change; remove rules these replace.

## Already decided

- Skill changes are made only because the user asked for them (this goal); the user merges them. This strand's PR into the braid branch goes to the PM and the user, not merged under the preset.
- Texts the board sends are self-contained; the skills only say to follow them.

## Out of scope

- Any product code. `AGENTS.md`, `CLAUDE.md`, `BRAID.md`.

## Completion

- [ ] The coordinator, worker, reviewer and researcher skills say that a hold text wins over queued or woken work and how to answer it
- [ ] The PM skill records programme holds with `braid pause --programme`, keeps no hand-kept row states but dropped and stopped, and asks once to close a finished programme
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
