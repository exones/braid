---
id: '0074/D'
title: "Resume now, early resume and the PM-led resume"
status: To Do
labels: ["kind:story", "tier:L", "ui"]
dependencies: ['0074/C']
order: 40
---

## Goal

After a usage reset the board still waits for its old resume time, and the user's "unpause all" left the board's records behind (leftover 2026-11-23-apcr). Give one **Resume now** (a board button and the CLI), resume early on its own when a fresh reading shows the window back under its threshold, and make the resume of PM-run braids go through the PM, as the user decided.

Expected size: about 400 lines in 8 files.

## Start here

- `src/board/steerer.ts` `resume`: re-check, then `t3 thread send` per thread and `clearPause`.
- `src/board/steer.ts` `resumeMessage`; `src/board/programme.ts` (a programme's card, `holdOfPauses`); `src/board/pause.ts` (the paused box on a braid's card).
- `braid resume` and its `--limit` (`rg -n "resume" src/cli.ts src/commands`).
- How the board's clicks reach the server: `POST /api/action` in `src/commands/board.ts`, and an existing button such as Merge.
- docs/board.md "Provider limits"; the braid's brief (the user's words on the Resume button).

## Change

- **Mockups first** (`ui`): before building, show the Resume now button on a paused programme's card and on a paused braid's card, with realistic test data, in light and dark, and stop for the coordinator; build only after the verdict.
- **One resume path in code**, used by the board's timer, the buttons and the CLI. A braid without a PM: clear the board's limit record and send each recorded thread its resume text by code (as today). A PM-run braid: send the PM one message by code (the window is open, or the user asked to resume now; which braids are paused; `braid resume <number> --limit` resumes each, in the PM's order). `braid resume <number> --limit` clears that braid's record and sends its threads their resume texts by code; nobody retypes ids.
- **Resume now:** a button on a paused braid's card (PM-run: asks the PM to resume that braid; otherwise resumes it directly) and on a paused programme's card (asks the PM to resume its braids in its order), and `braid resume --limit --all` for every board pause of the repository. It runs on the acting board (0074/B).
- **Early resume:** at each refresh, a board pause whose provider's fresh reading (checked after the pause began) shows its window under the threshold resumes at once through the same path, without waiting for the resume time.
- **A pause whose window no longer applies** resumes early too: a record whose window is gone from the fresh reading, or no longer applies to the provider's models (the cursor "Other Models" pause from before #300, still shown as "paused · resumes Dec 3 09:53" for everix4 0011 while Cursor Models is at 67% of 97%). Its old steering banner ("0 of 2 agents answered", Claude_Everix, Nov 24 18:44) goes with the record.
- A hold (P5 of the programme: Hold and Go) is not built here; the button and its path take a reason so a later Go reuses them.
- Tests: Resume now on a braid without a PM sends each thread once and clears the record; on a PM-run braid the PM gets one message and nothing else is sent until `braid resume --limit`; a fresh reading under the threshold resumes early; a hold is never cleared.

## Already decided

- Direct pause plus PM-led resume: "PM is smarter on that how to restart" (the user, 2026-11-24). Braids without a PM keep the board's direct resume.
- The user, 2026-11-24: "would be nice if I could click 'Resume' button on the board for a program or a braid".
- One button and one path for any pause, so a later Go reuses it.

## Out of scope

- P5's holds and the Go button themselves; the stale-limits warning (0074/E).

## Completion

- [ ] Mockups of the Resume now buttons approved before building (log entry with the verdict)
- [ ] One resume path serves the timer, the buttons and `braid resume --limit` (with `--all`), with tests
- [ ] PM-run braids resume through one message to the PM and its `braid resume <number> --limit`; braids without a PM resume directly, with tests
- [ ] A fresh reading under the threshold resumes early, with a test
- [ ] A pause whose window no longer applies resumes at the next refresh and its old banner goes, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
