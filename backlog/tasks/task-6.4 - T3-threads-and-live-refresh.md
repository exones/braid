---
id: TASK-6.4
title: T3 threads and live refresh
status: Done
assignee: []
created_date: '2026-11-13T22:01:00Z'
updated_date: '2026-11-14T09:44:00Z'
labels:
  - kind:story
  - tier:M
  - ui
milestone: m-3
dependencies:
  - TASK-6.3
parent_task_id: TASK-6
ordinal: 40
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the board shows what the agents are doing: running, waiting with a question, or stopped; and it stays current by itself.

Expected size: about 500 to 800 lines with tests and sample data.

Start here (read in this order):
- `backlog/docs/doc-3 - TASK-2.2-report-the-boards-path.md`: the `t3` CLI, `list` vs `show` fields, how to join a thread to a strand, refresh cost.

Change:
- `t3 thread list --json` and `show --json`; join a thread to a strand by its linked PR, then by its worktree path matched to `git worktree list`; cache the join.
- Running thread → In Progress; a pending question → Waiting, reason "question"; an interrupted or cancelled thread with no PR → Waiting, "agent stopped"; failing checks while an agent is running stay In Progress. When T3 isn't running, the board says so.
- Refresh every 30 s while the page is open, at once when a file under `braids/` changes, and a Refresh button; push updates to the page.
- `braid board --demo`: serves built-in sample braids and strands, with faked GitHub and T3 results, so every lane and every Waiting reason (question, agent stopped, checks failed, ask:<key>) shows; it reads no repo, no `gh` and no `t3`, and never writes. Keep the sample data in one module the tests can reuse.
- `docs/design/board-screenshots/`: retake the screenshots from `--demo` so they show In Review, every Waiting reason, a running agent, the T3-down note and the Refresh button.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

UI: the Refresh button and the T3-down note follow the existing header style; anything else visible beyond the approved mockups, stop and ask the coordinator first.

Out of scope: starting or messaging threads (story 6).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Running, question and stopped threads put the strand in the right lane with its reason, covered by tests with t3 output stubbed
- [x] #2 The page updates by itself every 30 s and on a file change, and has a Refresh button
- [x] #3 Without T3 the board still works and says so
- [ ] #4 npm run verify passes; CI green on Windows and Ubuntu
- [x] #5 braid board --demo shows every lane and every Waiting reason without touching the repo, gh or t3; the screenshots are retaken from it
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. src/board/t3.ts: read `t3 thread list --json` (+ `show --json` for running threads and unjoined stopped ones, cached per thread id); join a thread to a strand by its linked PR (number/url against GitHub's PRs), else by worktree path matched to `git worktree list`, else show's branch. Async, shared for 3 s; T3 down gives a note, never an error.
2. model.ts `derive` takes T3: running thread -> In Progress (Waiting "question" if a request is pending, even with failing checks); open PR otherwise as before; interrupted/cancelled thread with no PR -> Waiting "agent stopped". BoardData gets `t3` status.
3. Server: async api, `/api/events` (server-sent events) pushing a refresh every 30 s while a page is open and when a file under braids/ changes; `?fresh=1` bypasses the 3 s share for the Refresh button.
4. Page: Refresh button and T3-down note in the header style; refetch on each event without flicker.
5. `braid board --demo`: src/board/demo.ts holds sample braids (in-memory Tree) with fake GitHub and T3 results covering every lane and Waiting reason; no repo, gh or t3 reads, no writes; tests reuse it.
6. Tests with t3 stubbed; retake screenshots from --demo into docs/design/board-screenshots/.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-14 Decisions: T3 ids come from the list's threadId; a thread joins by linked PR (number/url against GitHub's PRs, or head branch if given), else worktree path vs git worktree list, else show's branch; show runs per running thread (pending questions) and once per unjoined stopped thread (cached). Refresh is server-sent events on /api/events (30 s timer, fs.watch on braids/ debounced 200 ms); the Refresh button refetches with fresh=1. Added --demo-t3-down so the T3-down note can be screenshotted. Tests no longer reach real gh/t3 (board.test spawns with an empty PATH).

2026-11-14 Fix round (review + coordinator): PR join uses linkedPullRequest, else a pullRequests list of exactly one; thread list gets --project <main checkout>. AC 4 unticked until CI is green on the new head. History: first summary said the join used every pullRequests entry and thread list ran in the cwd.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: the board reads T3 threads (src/board/t3.ts: `t3 thread list/show --json`). A thread joins a strand by its `linkedPullRequest`, else by its `pullRequests` only when that lists exactly one PR (a coordinator lists many PRs that are not its own), else by worktree path vs `git worktree list`, else by show's branch; show is cached per thread. `thread list` is asked with `--project <main checkout>` (first `git worktree list` entry), so the board also works when started from a linked worktree. `derive`: running thread -> In Progress (Waiting "question" with a pending request; failing checks ignored while it runs); interrupted/cancelled thread with no PR -> Waiting "agent stopped". Without T3 the board works and the header says why. Refresh by server-sent events: every 30 s, 200 ms after a file under braids/ changes, and a Refresh button (fresh read). `braid board --demo` (src/board/demo.ts, reused by tests) serves sample braids with faked GitHub/T3, reads no repo, gh or t3; `--demo-t3-down` shows the T3-down note. Screenshots 08-10 from the demo.
Why: story 3 needs the board to show what agents do and stay current without reload.
Validation: npm run verify (65 tests; test/t3.test.ts stubs t3 output, including a coordinator-with-many-PRs case and a real linked worktree for --project); CI green on Windows and Ubuntu on the final head. Field names confirmed against real T3 data by the coordinator.
Open: none.
For later items: Sources, startBoardWith and demoSources in src/commands/board.ts; readT3/T3 in src/board/t3.ts; derive takes a T3; /api/events and ?fresh=1; strand rows in the card print the stored status (e.g. "In Progress" beside "Waiting: question") and a running agent has no marker beyond the lane: candidates for a UI mockup; --demo-t3-down is an addition for the screenshot.
Needs the user: none
<!-- SECTION:FINAL_SUMMARY:END -->
