---
id: '0074/G'
title: "Docs: The board pauses and resumes reliably"
status: To Do
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0074/A', '0074/B', '0074/C', '0074/D', '0074/E', '0074/F']
order: 70
---

## Goal

Bring the docs up to date with everything 0074 changed, as a whole, and shrink the agents' limits prose: with the board pausing and resuming by code, the agents need only what to do on its pause and resume texts. The programme's rule: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to reliable calls like with requests". Skills must not grow; this strand makes them shorter.

Expected size: about 250 lines changed in 10 files, net fewer lines in `.agents/skills/`.

## Start here

- The braid's log and every strand's `report.md`, from 0074/A on; `git diff main...` on the braid branch.
- `.agents/skills/braid/references/limits.md` (43 lines: the steering thread, three quoted pause texts, replies to a thread id), the limits lines in `.agents/skills/braid/SKILL.md` ("Launched by a PM", "Provider limits"), `.agents/skills/braid-pm/SKILL.md`, `.agents/skills/braid-worker/SKILL.md`.
- docs/board.md "Provider limits", docs/cli.md (`braid limits`, `braid resume`), docs/decisions.md, docs/roadmap.md, README.md, docs/getting-started.md (the `steering` role).

## Change

- `limits.md`: no steering thread and no quoted pause texts (the board's texts are self-contained); keep the check before launch, what to do on the pause (finish the step, checkpoint, end the turn with the `Paused:` line) and on the resume, and the PM-led resume (`braid resume <number> --limit` per braid, in the PM's order). Aim for half its length.
- The braid, braid-pm and braid-worker skills: only the lines that change; each file ends no longer than it was.
- Docs from BRAID.md `docs`, as a whole: overview and README, getting started, docs/board.md, docs/cli.md, roadmap status, the decisions record, help text.
- Propose (don't make) the BRAID.md change: `models.steering` is unused after 0074/C. The proposal goes in `report.md` under "Needs the user" (process); BRAID.md is the user's.

## Already decided

- Skills are changed here because the user asked for it through the programme (no growth, shrink the steering prose); the user merges them with the final PR.

## Out of scope

- Product code; BRAID.md itself.

## Completion

- [ ] `.agents/skills/braid/references/limits.md` has no steering thread and no quoted pause texts, and is at most about half its length
- [ ] No file under `.agents/skills/` is longer than before this braid (line counts listed in report.md)
- [ ] Docs from BRAID.md `docs` brought up to date as a whole, each listed in report.md as updated or unchanged
- [ ] report.md proposes removing `models.steering` from BRAID.md under "Needs the user"
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
