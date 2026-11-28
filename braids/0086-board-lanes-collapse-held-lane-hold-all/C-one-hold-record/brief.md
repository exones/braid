---
id: '0086/C'
title: "One hold record"
status: To Do
labels: ["kind:story", "tier:L", "ask:data"]
dependencies: []
order: 20
---

## Goal

A deliberate hold lives in one place, `.braid/pauses.json`, and every part of the board and the CLI reads it through one function. A hold says why (its words), who held it (the user, the PM or a coordinator), since when and what it waits for. A programme's hold is recorded there per braid, so a hold set for a programme stops a board limit pause, a resume, a nudge and a wake like any other hold (leftover 2026-11-22-yd2t, idea 2026-11-24-4bwm). The plan file's `hold:` and `state: held` stop being a second source. No UI change here (D, E, F build on this).

Expected size: about 400 lines in 10 files, tests included.

## Start here

- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided" (the programme rules: no third store, no spaghetti states).
- `src/braids/pauses.ts`: `Pause`, `PAUSERS` (`coordinator`, `pm`, `board`), `REASONS` (`limit`, `hold`), `valid()` (a record with an unknown `by` or a hold without words is left out on read, with a note), `setPause`, `patchPauses`, `clearPause`.
- `src/commands/pauses.ts`: `braid pause <number> --hold "<words>" --thread <id> [--by coordinator|pm]`, `braid resume`, `braid resume --limit` (never clears a hold).
- `src/braids/plan.ts`: the plan file's `hold:` ("<ISO time> <words>") and `state:` (`held`).
- `src/board/programme.ts` `heldPauses` (a held plan's braids read as held, display only) and `src/board/inputs.ts:70`, where it is merged into the signals.
- The readers that must honour a hold: `src/board/steerer.ts` (step 3: braids with a record are skipped; it reads `loadPauses`, not `heldPauses`: the yd2t gap), `src/board/resume.ts`, `src/board/nudge.ts`, `src/board/remind.ts`, `src/board/wake.ts`, `src/board/pm.ts` `routeOf` (its `paused` flag), `src/commands/board.ts` (the `resume` action, around line 487, refuses a held braid).
- `docs/cli.md` "Pauses", `docs/board.md` (the pause mark), D90 in `docs/decisions.md`.

## Change

- A hold record gains two optional fields: what it waits for (`waitsFor`, free text, e.g. "the T3 restart", "the user's go") and the programme it was made for (`programme`, the slug), and records who held it in a way that keeps it a hold for older `braid` versions: an older reader drops a record whose `by` is not in its `PAUSERS` (`valid()`), so a new `by` value would lose the hold for them. Check what an older reader keeps, choose the shape (for example a new optional `who: user` beside an existing `by`), and say in `report.md` how an older reader reads the new record. Older records read unchanged.
- `braid pause <number> --hold "<words>" [--waits-for "<what>"] [--by user|pm|coordinator]` and `braid pause --programme <slug> --hold "<words>" [--waits-for "<what>"]`: one hold record per open braid of the programme (each plan row with a braid that isn't Done), tagged with the programme. `braid resume --programme <slug>` clears the holds made for that programme and leaves a braid's own holds alone. A function each for hold and go that the board's actions (0086/E) call, not only the CLI.
- One reader: a function (for example `holdsOf`) that gives every hold of a project from `.braid/pauses.json` and, for a plan file that still says `hold:` or `state: held` with no records, the same holds read from the plan (so older PMs keep working until 0086/H changes the skill). The board's display (`heldPauses`'s place), the steerer's limit pause, the resume, the nudge, the reminders, the wake and `routeOf` all read holds through it. Leftover yd2t is then fixed: a hold set only in the plan stops a limit pause.
- `braid check --plan`: a plan's `hold:` or `state: held` gets a warning naming `braid pause --programme`, not an error.
- Tests: a programme hold recorded and cleared; a braid's own hold survives a programme's go; the steerer skips a braid held only by its plan (yd2t); a nudge, a reminder and a wake skip a held braid; an older-shape record and a new one read; a record of the new shape read by the old `valid()` rules still reads as a hold (copy the old check into the test, or state the reasoning).

## Already decided

- `.braid/pauses.json` is the one record of a hold (4bwm: "derive one from the other, not add a third"). No new file, no new branch.
- A hold outlives a limit pause, as today (D90): `braid pause --provider` refuses a held braid, `braid resume --limit` never clears a hold.
- The plan's hold keeps reading as a fallback only; the PM skill change that stops writing it is 0086/H.

## Out of scope

- Any UI (0086/D, E, F, G). Sending hold texts to threads (0086/E).

## Completion

- [ ] A hold record carries words, who, since, what it waits for and an optional programme; older readers still read it as a hold (report.md says how)
- [ ] `braid pause --programme <slug> --hold` and `braid resume --programme <slug>` record and clear a programme's holds per braid
- [ ] The board's display, limit pause, resume, nudge, reminders, wake and `routeOf` read holds through one function; a hold set only in the plan stops a limit pause (yd2t), with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
