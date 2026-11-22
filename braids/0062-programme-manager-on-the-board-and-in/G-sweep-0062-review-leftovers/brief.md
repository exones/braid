---
id: '0062/G'
title: "Sweep: 0062 review leftovers"
status: To Do
labels: ["kind:task", "tier:S", "sweep"]
dependencies: []
order: 55
---

## Goal

Clear the four leftovers from 0062's reviews. Their code exists only on this braid branch, so they are fixed here before the docs strand. The user asked for it on 2026-11-22, through the 0066 coordinator: "plan sweep in the same braid", choosing "Into 0062".

Expected size: about 150 lines in 6 files.

## Change

Each leftover's text, source and link, as captured:

1. **2026-11-22-fbjx** (from review 0062/B, https://github.com/exones/braid/pull/234#issuecomment-7072121129): `T3.states` is documented as keyed by lower-case thread id but is not. `src/board/t3.ts` (lines 55, 222–224) documents `T3.states` as keyed by the lower-case id, but stores ids as given. 0062/B's PM-thread lookup works only while the id in the brief matches T3 byte for byte, so a PM-run line in a different case reads the PM thread as gone and escalates falsely. Make the lookup and the doc agree; T3's ids are case-sensitive, so prefer exact keys and fix the comment, unless a lower-case key is needed somewhere.
2. **2026-11-22-kt83** (from review 0062/B, same comment): a need that has gone is not cleared on the phone when its item has another push in the same snapshot. `src/notify/notifier.ts` (lines 140–141) clears a gone need only when the same item has no other push in that snapshot. A Done push carries `sequence: null`, so it doesn't replace the need either. Clear every gone need by its own sequence ID, whatever else the item pushes.
3. **2026-11-22-lus4** (from review 0062/D, https://github.com/exones/braid/pull/240#issuecomment-7078603061): a braid held through a plan with `state: held` and no hold words shows `Held: “”` on its card. Show a line without empty quotes, for example "Held: the plan says held", as the programme card already reads.
4. **2026-11-22-m3pg** (from 0062/B, https://github.com/exones/braid/pull/234): check the ntfy push clear and the PM routing lines live.
   - Add to `braid notify test` a step that sends a push with a sequence ID and then clears it, so the clear can be checked on a real topic.
   - Run it once against the configured topic if `braid notify` is set up on this machine, and say in `report.md` what was seen.
   - View the board's PM lines (the teal "The PM is handling" line, 🧭, the "For the PM" box) in a browser on the demo board, and add a screenshot.

## Already decided

- The user chose this strand (2026-11-22). It runs before the docs strand F, which documents what it changes.

## Completion

- [ ] `T3.states` keys and their documentation agree, and a PM-run line whose thread id matches T3's reads the PM thread as running; a test covers it
- [ ] A need that has gone is cleared on the phone even when its item has another push in the same snapshot; a test covers it
- [ ] A braid held by a plan with no hold words shows no empty quotes
- [ ] `braid notify test` also sends and clears a push with a sequence ID; report.md says whether it was run live and what was seen
- [ ] A screenshot of the PM lines on the demo board is in the item folder
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
