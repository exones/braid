---
id: '0086/F'
title: "Hold all"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0086/E']
order: 60
---

## Goal

One Hold all, from the board's header and from the CLI, that really holds (idea 2026-11-25-b1yb): it records a hold per braid in every chosen project, reaches every working thread and child by code, counts the threads' own `Held:` replies, shows who still works, says "All held" only when no thread of those braids runs, and never lets the board resume or nudge a held braid. Go all lets them go. As 0086/A's approved mockups (frame 6) show.

Expected size: about 350 lines in 8 files, tests included.

## Start here

- Idea 2026-11-25-b1yb on branch `braid-inbox` (`ideas/2026-11-25-b1yb.md`): the audit of the 2026-11-25 hold, where about 10 threads kept working after every coordinator said "held", and its five causes.
- The parent brief `braids/0086-board-lanes-collapse-held-lane-hold-all/brief.md`, "Already decided".
- `braids/0086-board-lanes-collapse-held-lane-hold-all/A-mockups-lanes-holds-programmes-and-what/mockups.html` frame 6, its `report.md` and log.
- 0086/C's and 0086/E's `report.md`: the hold record, its reader, the hold action, the delivery seam, the texts and the count. This strand adds the scope "all", not a second mechanism.
- `src/board/combined.ts` (the board over several projects), `src/board/acting.ts` (which board acts for a repository), `src/commands/pauses.ts`, `src/cli.ts` (the command list and help).

## Change

- `braid pause --all --hold "<words>" [--waits-for "<what>"]` (in this repository) and the board's Hold all (the projects it serves, chosen in its confirm): a hold record for every braid that isn't Done and has a started item or a running thread, then 0086/E's sends to every target, counted.
- The progress view, per project: threads asked, answered `Held:`, still working (thread links), sends failed. "All held" only when every target answered or T3 shows none of those threads running; until then the board says who still works.
- Go all (`braid resume --all-holds`, or as your plan names it, and the board's button): clears the holds Hold all made, leaves other holds alone, sends go texts.
- The board never resumes, nudges, wakes or reminds a braid under these holds (0086/C's reader; add tests for the all case).
- Tests: Hold all over two projects records and sends to every working thread, child threads included; a thread that keeps working is listed; "All held" only after the last reply or no running thread; Go all leaves an older hold in place.

## Already decided

- The same record, reader, seam and texts as 0086/C and 0086/E; Hold all is their scope widened.
- Interrupting a busy turn through T3 is 0080's; with today's queued send, the progress view is what makes a thread that keeps working visible.

## Out of scope

- The skills' rule that a hold is stronger than queued or woken work (0086/H).

## Completion

- [ ] Hold all from the board and the CLI records a hold per open braid of each chosen project and sends every working thread and child its hold text by code
- [ ] The progress view counts the threads' own `Held:` replies, lists who still works and says "All held" only when nothing of those braids runs
- [ ] Go all clears only Hold all's holds; the board never resumes or nudges a held braid, with tests
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
