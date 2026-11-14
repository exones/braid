---
id: TASK-6.5
title: Live lane in strand lists and a running-agent marker
status: In Progress
assignee: []
created_date: '2026-11-14T10:04:00Z'
updated_date: '2026-11-14T10:35:00Z'
labels:
  - kind:story
  - tier:S
  - ui
milestone: m-3
dependencies:
  - TASK-6.4
parent_task_id: TASK-6
ordinal: 50
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: everywhere a strand appears, it shows the same live state as the board, and you can see at a glance which braids and strands have an agent working right now.

Expected size: about 100 to 200 lines in 3 to 5 files, plus mockups.

Start here (read in this order):
- The parent TASK-6 notes: the 6.1 to 6.4 log entries name the files and helpers.
- `src/board/model.ts` (`derive`) and `src/board/t3.ts`: where the live lane and the running thread come from.
- `web/src/App.tsx`: the strand rows in an expanded card and the strand list ("table of contents") on the braid page; both print the stored status today.
- `src/board/demo.ts`: the sample data to mock and test on.

Change:
- Mockups first, then stop: show both changes on the `--demo` data (an expanded card and a braid page, with strands in every lane, a Waiting reason and a running agent), as images in `docs/design/board-mockups/` next to the existing ones. Report to the coordinator and wait; the user reviews them before you build.
- Strand rows in an expanded card and in the braid page's strand list show the live lane and its Waiting reason, like the board, instead of the stored status.
- A small marker on cards and strand rows when T3 reports a running thread for that braid or strand.
- Retake the affected screenshots in `docs/design/board-screenshots/` from `--demo`.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). The live lane and the T3 join from TASK-6.4 stay as they are. Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: new lanes or states, starting or messaging threads (story 6), any other UI change.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mockups of both changes were shown to the user and approved before the build
- [x] #2 Strand rows in expanded cards and on the braid page show the live lane and Waiting reason, covered by tests
- [x] #3 Cards and strand rows with a running T3 thread carry the marker, covered by tests on the demo data
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Mockups (docs/design/board-mockups/11-13, source live-lane.html) on --demo data; stop for the user.
2. After approval: add `running: boolean` to StrandCard/BraidCard/ItemDetail in src/board/model.ts (from T3 running threads, via a helper in t3.ts).
3. web/src/App.tsx: strand rows (expanded card) and Contents list show the live lane (dot colour, label) and Waiting reason; marker on cards and strand rows when running.
4. Tests on demo data for lane, reason and marker; retake screenshots 09 (and others affected) from --demo.
5. npm run verify, PR into epic/task-6-read-only-board, CI green.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-14 User decisions on the mockups: the board is an attention board (header "braid · attention board"; a braid sits in the lane of its most urgent strand). Lanes are To Do · Working · To Review · Needs You · Done (UI labels only; stored statuses stay To Do / In Progress / Done). Waiting reasons are icons with a hover and aria-label instead of text (question, checks failed, agent stopped, ask flag). Colours: To Do light grey, Working blue, To Review purple, Needs You amber, Done green; red only on checks failed and agent stopped. A running agent is a wrench; a strand in To Review has an eye (hover "PR #N to review"); a Done row has a green tick; the progress bar is green. Strand 0003/C (To Review, PR #17) is added to --demo.
<!-- SECTION:NOTES:END -->
