---
id: '0086/B'
title: "Limits as what is left"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0086/A']
order: 30
---

## Goal

The provider chips, the limits panel, `braid limits` and the `limits:` thresholds in `BRAID.md` speak of what is left, not what is spent, as the user asked and as 0086/A's approved mockups (frame 9) show: chips like "S 85% · W 20%", meters that start full and shrink from right to left to the threshold, thresholds like "session 3% left". Also fixes leftovers 2026-11-23-qap7 and 2026-11-22-7ija.

Expected size: about 350 lines in 10 files, tests included.

## Start here

- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided": the user's words on "left".
- `braids/0086-board-lanes-collapse-held-lane-hold-all/A-mockups-lanes-holds-programmes-and-what/mockups.html` frame 9 and its `report.md` and log: the approved design and the user's verdicts. Build what they show.
- `src/braids/limits.ts`: `Limits`, `DEFAULT_LIMITS` (session 90, weekly 90: percent used), `readLimits` (the `limits:` key of BRAID.md), `readUsage` (`over: usedPercent >= threshold`), the reason text ("is at 92%, threshold 90%"). `src/braids/percent.ts` (rounding).
- `src/commands/limits.ts`: the `braid limits` text and `--json`.
- `src/board/limits.ts`: `NEAR_POINTS`, `stateOf`, `buildView` (lines around `resumeAt` and `pauseWindow`: leftover qap7), `mergeLimits`; its module comment (leftover 7ija).
- `web/src/Limits.tsx`: the chips, meters and the panel. `src/board/steer.ts` and `src/board/pause.ts`: pause texts and lines that print a percent ("Session 92%").
- `docs/board.md` "Provider limits", `docs/cli.md` "Provider limits".

## Change

- `src/braids/limits.ts`: thresholds are kept as the share **left** at which agents hold. The new form in `BRAID.md` is `session: 3% left` (the number, `%` optional, then `left`). Defaults stay the same behaviour: session 10% left, weekly 10% left. The verdict is `pause` when the share left is at or below the threshold (decided on unrounded values, as today).
- The old form (a bare number, e.g. `session: 97`, percent used) still reads, as `100 - n` left, and `braid limits` prints one line saying the old form was read and the line to write instead (`session: 3% left`). No project's `BRAID.md` is edited by this strand.
- `braid limits` text: each window as left ("Session 85% left, holds at 3% left, resets 14:10"), the reason lines too. `--json` keeps every existing field with its meaning and adds the left values (e.g. `leftPercent`, `thresholdLeft`); don't change what an existing field means.
- `src/board/limits.ts` and `web/src/Limits.tsx`: chips "S 85% · W 20%" without the word "left"; the meter starts full and shrinks from right to left, with the threshold tick at its left share; near is within `NEAR_POINTS` above the threshold; the tooltip and the panel say "left". Pause texts, pause lines and pushes that print a percent say what is left.
- Leftover qap7: a chip with a weekly and a session pause record names the window and the resume time of the same record (today `resumeAt` takes the earliest record and `pauseWindow` the first with a window); also in `mergeLimits`.
- Leftover 7ija: the module comment of `src/board/limits.ts` says the board acts on limits in `src/board/steerer.ts`.
- `src/board/demo.ts`: demo readings show the new chips.
- Tests: the new form and the old form read; a bad value names the key; the verdict at, just above and just below the threshold; the chip text and meter share; qap7's case.

## Already decided

- How the old form is read (the coordinator's call, logged on 0086): a bare number keeps its old meaning, percent used, and is read as `100 - n` left with a note; only a value with `left` is the new form. Nothing changes for a project until it edits `BRAID.md`, and no reading is ambiguous.
- `BRAID.md` here has no `limits:` key; the defaults apply. Changing this project's `BRAID.md` is the user's.
- The user's words are binding: "You can even exclude the word "left" to not take space"; "we start with fully filled indicator and it goes from right to the left ... until it hits the pause threshold".

## Out of scope

- The pause and resume rules themselves (0074), the board's lanes and holds (other strands).

## Completion

- [ ] `limits:` reads `session: 3% left` and the old bare-number form, with the note for the old form, and `braid limits` prints what is left; `--json` keeps its fields and adds the left values
- [ ] The chips, meters, tooltip and limits panel show what is left as the approved mockups do
- [ ] Leftovers qap7 and 7ija are fixed, with a test for qap7
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
