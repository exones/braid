---
id: '0062/D'
title: "The programme on the board"
status: To Do
labels: ["kind:story", "tier:L", "ui"]
dependencies: ['0062/A', '0062/B', '0062/C']
order: 40
---

## Goal

The board shows programmes in a collapsible panel left of the lanes, as the user approved in 0062/A (mockup screens 60 to 67):

- **Two sections.** *Needs you* on top: a programme with an open PM request, or a stalled one. *Working* below: every other running or held programme.
- **Across projects.** One panel lists the programmes of every project served, each with its project tag.
- **Only these.** Each programme can filter the lanes to its own braids.
- **Plan.** Each programme opens a details panel.

Expected size: about 1,000 lines in 13 files.

## Start here

- `braids/0062-*/A-*/report.md`: question 1 (the programme model, the plan front matter, "A stalled programme"), question 9 (across projects) and "Strands, restated", D. The approved mockups: `docs/design/board-mockups/programmes.html`, screens 60 to 67, and the screenshots in the 0062/A folder.
- `docs/board.md`: "Lanes", "Broke" (the braid-level stall, D46), "Several projects", "On the phone". `src/board/` (`combined.ts`, `model.ts`, `signals.ts`, `t3.ts`, `filter.ts`), `web/src/App.tsx`, `src/board/demo.ts`.

## Change

- **The plan file:**
  - A front-matter format for `pm/<slug>.md`, using the brief's YAML subset: programme, title, goal, thread, limit, state, hold, next, digest, and rows such as `P2 | 0006 | Compare view | running`.
  - A reader for it, and `braid check --plan <file>`.
  - An unreadable plan shows "plan unreadable: <line>", and the board still works.
- **Reading programmes:** the board reads the `pm/*` branches per project. `programmes` is added to `/api/board` and `/api/all`, keyed `<project>/<slug>`.
- **The panel:**
  - It sits left of the lanes, with the Needs you and Working sections (screens 60 and 63).
  - « collapses it to a rail of icons, with programmes that need the user first, amber with a count (screen 61). The board remembers the choice.
  - Done and stopped programmes leave the panel.
  - A programme request (strand C) moves from its interim card in the lanes into the panel.
- **Working and stalled** (the user's rule, 2026-11-22):
  - A programme is Working while its PM thread runs, or while one of its braids runs: an agent thread of it runs (coordinator, worker, reviewer, the PM's checker), or a PR of it has checks pending.
  - Otherwise, after ten minutes on the clock `<project>/<slug> pm` in `broke.json`, it reads Needs you `stalled`: "Stalled: the PM stopped and none of its braids is running". It is pushed at high priority with ⏳, opening the PM thread.
  - Never stalled: a programme that is done, stopped or held (the plan's `hold`, or every braid that isn't Done paused). One with an open PM request shows that request instead.
  - Keep the programme-level and braid-level PM requests apart. Only a programme request (`pm/<slug>`) and the stall put the programme itself in Needs you. A `--by pm` request stays on its braid's card. (The reviewer asked for this to be made explicit.)
- **The filter:** "◎ Only these" filters the lanes to the programme's braids, and "Show all" returns. The address keeps `?programme=<project>/<slug>` alongside `?projects=` (screen 62).
- **Details:** "≡ Plan" opens the programme's details side panel: rows (P<n> with braid number), next, digest, limit, hold (screen 64).
- **Marks:**
  - The 🧭 programme tag on PM-run cards and Done rows; project colour tags on programme cards.
  - A held programme shows the user's words on its card, and its braids show paused (0061's mark), not stalled.
  - A PM-run braid becoming Done is pushed at `low` priority (added in B).
- **The phone:** a strip above the lane tabs that opens like a drawer, programmes needing the user first, with a filter chip (screens 66 and 67).
- **Demo:** sample programmes in two projects. Screenshots of each screen go in `docs/design/board-screenshots/`.
- Tests, and `docs/board.md`.

## Already decided

- The user approved the left-panel design (2026-11-21) and the stall rule (2026-11-22), both logged on 0062/A.
- The mockups use grey for the paused mark; build it with 0061's sky mark and wording instead (report, question 6).
- Depends on B and C.

## Out of scope

- ntfy action buttons, per-programme charters, and a "what the PM decided" view (report, "For later items").
- Skill changes: strand E.

## Completion

- [ ] A plan with valid front matter shows as a programme in the panel: in Needs you while a programme request is open, in Working while its PM or one of its braids runs (including an idle PM whose braids work, and a running PM with no braid running); an unreadable plan shows "plan unreadable: <line>" and the board still works
- [ ] A programme whose PM thread isn't running and none of whose braids is running reads Needs you `stalled` after ten minutes on its own clock and is pushed once; it clears when the PM or a braid runs again; a done, stopped or held programme never stalls, and one with an open PM request shows that request instead; tests cover each case
- [ ] "Only these" filters the lanes to the programme's braids and back, keeps `?programme=<project>/<slug>` with `?projects=`, and survives a reload on desktop and phone
- [ ] With several projects served, the panel lists every shown project's programmes with project tags; two projects with the same slug stay apart in the panel, the filter and the pushes
- [ ] The panel collapses to the rail and back, and the board remembers the choice
- [ ] A held programme shows the user's words on its card, and its braids show paused, not stalled
- [ ] `braid check --plan` accepts the template and names the line of an error
- [ ] Screenshots of each screen, matching the approved mockups
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
