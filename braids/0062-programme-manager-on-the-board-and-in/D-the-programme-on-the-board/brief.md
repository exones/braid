---
id: '0062/D'
title: "The programme on the board"
status: In Progress
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
- **From the 0062/C review** (PR #236): replace C's synthetic "Programme <slug>" card (its click opens details and `/api/item` answers 400 for `pm/<slug>`); decide the lane when a `--by pm` ask shares a card with a coordinator handover (today Needs You wins and Merge is hidden, while `docs/board.md` says To Review comes first), and keep the teal "The PM is handling" line when a `--to pm` request and a `--by pm` ask share a card.
- Tests, and `docs/board.md`.

## Already decided

- The user approved the left-panel design (2026-11-21) and the stall rule (2026-11-22), both logged on 0062/A.
- The mockups use grey for the paused mark; build it with 0061's sky mark and wording instead (report, question 6).
- Depends on B and C.

## Out of scope

- ntfy action buttons, per-programme charters, and a "what the PM decided" view (report, "For later items").
- Skill changes: strand E.

## Plan

1. **Plan file** (`src/braids/plan.ts`): `parsePlan` on the front-matter parser; required `programme`, `title`, `goal`, `state`; optional `thread`, `limit`, `hold` (`<ISO> <words>`), `next`, `digest`, `rows` (`P<n> | <number or -> | <title> | <state>`); unknown keys and bad values fail with their line. `braid check --plan <file>` in `src/cli.ts`.
2. **Reading** (`src/board/plans.ts`): `pm/*` refs (local first, then `origin/pm/*`) and their `pm/<slug>.md` through one `git cat-file --batch`; a `plans` source on `Sources`, read in `readSnapshot`; a failed read gives no programmes, never a failed board.
3. **Derive** (`src/board/programme.ts`): one `Programme` per plan: rows joined with the braid cards, section `needs` (programme request, or stalled) / `working` / none (done, stopped), status line, PM thread state and link. Stall clock `<repo>/<slug> pm` through `sig.alarm`; held (plan `hold`/`state: held`, or every braid not Done paused) never stalls; a held plan's braids without a pause record read as held. `programmes` on `BoardData`, keyed `<project>/<slug>` in `/api/board` and `/api/all`; `programme` (slug) on each braid card. C's `programmeCard` goes.
4. **Pushes** (`src/notify/message.ts`): programme requests and the stall pushed from `board.programmes`; a programme braid's Done push at `low`.
5. **Web** (`web/src/App.tsx`, `src/board/route.ts`, `src/board/filter.ts`): the left panel with Needs you / Working, the rail (local storage), Only these with `?programme=`, the filter bar, `#/programme/<project>/<slug>` details panel, 🧭 tags on cards and Done rows, the phone strip and chip. From the 0062/C review: Merge stays on a card whose PM ask moved it to Needs You, and the teal PM line shows next to a PM ask.
6. **Demo** with programmes in `demo` and `api`; screenshots in `docs/design/board-screenshots/`; tests; `docs/board.md`, `docs/braids-format.md`, `docs/cli.md`, `docs/decisions.md`.

## Completion

- [x] A plan with valid front matter shows as a programme in the panel: in Needs you while a programme request is open, in Working while its PM or one of its braids runs (including an idle PM whose braids work, and a running PM with no braid running); an unreadable plan shows "plan unreadable: <line>" and the board still works
- [x] A programme whose PM thread isn't running and none of whose braids is running reads Needs you `stalled` after ten minutes on its own clock and is pushed once; it clears when the PM or a braid runs again; a done, stopped or held programme never stalls, and one with an open PM request shows that request instead; tests cover each case
- [x] "Only these" filters the lanes to the programme's braids and back, keeps `?programme=<project>/<slug>` with `?projects=`, and survives a reload on desktop and phone
- [x] With several projects served, the panel lists every shown project's programmes with project tags; two projects with the same slug stay apart in the panel, the filter and the pushes
- [x] The panel collapses to the rail and back, and the board remembers the choice
- [x] A held programme shows the user's words on its card, and its braids show paused, not stalled
- [x] `braid check --plan` accepts the template and names the line of an error
- [x] Screenshots of each screen, matching the approved mockups
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
