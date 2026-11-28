---
id: '0086/E'
title: "Hold and Go on cards and programmes"
status: To Do
labels: ["kind:story", "tier:L", "ui"]
dependencies: ['0086/C', '0086/D']
order: 50
---

## Goal

The user holds a braid or a programme from the board, with a reason, and lets it go again with Go. The hold is recorded where the board reads it (0086/C), and the board tells every thread that must know by code: the hold text goes to each thread of the braid that works now and to its coordinator (for a programme, also its PM), and the board counts each thread's own `Held:` reply and shows who still works. Go clears the hold and sends each its go text. As 0086/A's approved mockups (frames 4 and 5) show.

Expected size: about 550 lines in 12 files, tests included.

## Start here

- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided": "A Hold button with a reason, and Go, on a braid's card and on a programme; the board tells the coordinator or the PM (idle: `t3 thread send`; busy: 0064's steering)", the seam for 0080, the programme rules.
- `braids/0086-board-lanes-collapse-held-lane-hold-all/A-mockups-lanes-holds-programmes-and-what/mockups.html` frames 4 and 5, its `report.md` and log: the approved design.
- 0086/C's `report.md`: the hold record and the hold and go functions.
- The board's pause by code, which this reuses (0074/C, D108): `src/board/steer.ts` `targetsOf` (the threads a braid's pause reaches: workers, every recorded thread, the coordinator; today filtered to one provider), the pause texts and how a `Paused:` reply is read; `src/board/steerer.ts` (the sends, the 10-minute count, `Replies`, the no-answer list); `src/braids/pauses.ts` `Replies`, `NoAnswer`.
- `src/commands/board.ts`: the actions (`POST /api/action/<name>`), the `resume` action around line 487 ("A later Go (P5's holds) reuses this action with its reason"), the demo board's fake actions.
- `web/src/App.tsx`: `Actions`, `BraidResume`, `PauseLine`, `ProgrammeCard`.
- `docs/board.md` "Actions and the session token", "The board pauses and resumes".

## Change

- One delivery seam: a function that delivers a hold or go text to one thread (today `t3 thread send`; a send to a busy thread queues behind its turn). 0080 replaces its body by an interrupt; nothing else calls `t3 thread send` for a hold.
- Hold texts, self-contained like the pause texts: for a worker or any recorded thread "Hold from the user: <words>. Stop at a clean point: finish or undo the current step, commit and push, log a checkpoint, start nothing new, and end the turn with `Held: <item> <head>`. Until Go, note any wake and end the turn."; for a coordinator the same with `Held: <number>`, start and merge nothing; for a PM one text naming the braids. Go texts like the resume texts. Wording final in your plan; keep them short.
- Targets: as `targetsOf` gives them, for every provider (not one), plus the coordinator even when idle, and for a programme its PM.
- Actions `hold` `{ braid | programme, words, waitsFor? }` and `go` `{ braid | programme }` (or `go` as the `resume` action with its reason, as its comment planned): record through 0086/C's functions, then send by the seam and count the `Held:` replies as the limit pause counts `Paused:` (sent, answered, still working with thread links). A refused or failed send is shown, never hidden. Go on a braid held for its programme says so and offers the programme's Go.
- The card and the programme card: Hold (icon-only, tooltip; a small form: reason required, waits for optional), the holding progress, Go on a held card. As the mockups show.
- The board never resumes, nudges or wakes a held braid (0086/C's reader), and Go is the only board action that clears a hold.
- `--demo`: the buttons work on fake data.
- Tests: the targets of a braid's hold across providers; the texts; a `Held:` reply counted; a thread still working listed; a failed send shown; Go clears only that hold and sends go texts; a programme Hold records each open braid and tells the PM; the seam is the only sender.

## Already decided

- One mechanism for Hold and the limit pause's sends and counts (0074/C's code), not a second one (the programme rules: "lean more to reliable calls").
- Interrupting a running turn through T3's API is 0080's; here a busy thread gets the text at its next turn, and the board says it still works.

## Out of scope

- Hold all across projects and its summary (0086/F). The programmes panel's groups (0086/G). The skills' rules for a hold (0086/H).

## Failure modes and required regression tests

- A send fails, or T3 is down: the hold is still recorded and the card says which threads weren't told (test).
- A thread never answers `Held:`: it stays listed as still working with its link (test).
- Go while the holding count runs: the count stops, the record is cleared, go texts go to those already told (test).
- A braid with a limit pause and a hold: Go clears the hold only; the limit pause stays (test).

## Completion

- [ ] Hold with a reason and Go on a braid's card and on a programme card, as the approved mockups show
- [ ] The hold is recorded through 0086/C and every working thread of the braid, its coordinator and (for a programme) the PM get the text by code through one seam; `Held:` replies are counted and who still works is shown
- [ ] The failure modes above each have a regression test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
