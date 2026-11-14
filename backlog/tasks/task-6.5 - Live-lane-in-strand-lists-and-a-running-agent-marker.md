---
id: TASK-6.5
title: Live lane in strand lists and a running-agent marker
status: Done
assignee: []
created_date: '2026-11-14T10:04:00Z'
updated_date: '2026-11-14T10:38:00Z'
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
- [x] #4 npm run verify passes; CI green on Windows and Ubuntu
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
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

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: the board is now an "attention board" (header "braid · attention board", subtitle "Each braid sits in the lane where it needs you most."). Strand rows (expanded card, braid page contents) show the live lane and icons instead of the stored status and reason text; cards show the distinct reason icons, the eye and the wrench in the header; the braid page header shows them too. `running` is on strand, braid and item data; open PRs carry `failed` check names; `--demo` has strand 0003/C (To Review, PR #17). Screenshots 08-10 retaken, 11-12 added. Why: story TASK-6 needs the live state wherever a strand shows, and agents visible at a glance. Validation: `npm run verify` passes; test/marks.test.ts covers lanes, reasons and tooltips, wrench, eye, tick and the no-T3 case on the demo data; CI green on Windows and Ubuntu (PR #69). Open: screenshots 01-07 (older stored-state boards) still show the old look.

BOARD RULES: a braid sits in the lane of its most urgent strand (Needs You > To Review > Working > To Do > Done; all strands Done -> Done; no strands -> its own state). Lane labels in the UI only: To Do, Working (internal "In Progress"), To Review ("In Review"), Needs You ("Waiting"), Done; mapped in one place, LANE_LABEL in src/board/marks.ts. Stored statuses in brief.md stay To Do / In Progress / Done.
LANE COLOURS: To Do light grey (slate-300), Working blue, To Review purple (violet), Needs You amber, Done green. Red only on icons of things that went wrong. The progress bar is green (done strands).
ICONS (rows and card header, order: reasons, eye, tick, wrench; each has a hover and an aria-label; rows show no lane or reason text): `?` amber circle = question ("Agent asked a question: waiting for your answer"); red circle with cross = checks failed (hover names the failing checks); red circle with stop square = agent stopped; amber flag = ask:<key> ("Needs your decision: <key>"); purple eye = strand in To Review ("PR #N to review"); green tick = Done row; blue wrench (gentle swing) = T3 reports a running thread ("agent running"). A card shows each distinct reason once, the first review eye, and the wrench if any strand runs. Logic in src/board/marks.ts (cardMarks, strandMarks); drawing in web/src/App.tsx.

For later items: `LANE_LABEL`, `cardMarks`, `strandMarks` in src/board/marks.ts; `running` on StrandCard/BraidCard/ItemDetail; `PullRequest.failed`; the braid page's "Status" row is now "Stored status". Screenshots 01-07 not retaken.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
