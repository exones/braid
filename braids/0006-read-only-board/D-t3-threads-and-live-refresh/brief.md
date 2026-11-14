---
id: '0006/D'
title: "T3 threads and live refresh"
status: Done
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0006/C']
order: 40
---

Goal: the board shows what the agents are doing: running, waiting with a question, or stopped; and it stays current by itself.

Expected size: about 500 to 800 lines with tests and sample data.

Start here (read in this order):
- `archive/backlog/docs/doc-3 - TASK-2.2-report-the-boards-path.md`: the `t3` CLI, `list` vs `show` fields, how to join a thread to a strand, refresh cost.

Change:
- `t3 thread list --json` and `show --json`; join a thread to a strand by its linked PR, then by its worktree path matched to `git worktree list`; cache the join.
- Running thread → In Progress; a pending question → Waiting, reason "question"; an interrupted or cancelled thread with no PR → Waiting, "agent stopped"; failing checks while an agent is running stay In Progress. When T3 isn't running, the board says so.
- Refresh every 30 s while the page is open, at once when a file under `braids/` changes, and a Refresh button; push updates to the page.
- `braid board --demo`: serves built-in sample braids and strands, with faked GitHub and T3 results, so every lane and every Waiting reason (question, agent stopped, checks failed, ask:<key>) shows; it reads no repo, no `gh` and no `t3`, and never writes. Keep the sample data in one module the tests can reuse.
- `docs/design/board-screenshots/`: retake the screenshots from `--demo` so they show In Review, every Waiting reason, a running agent, the T3-down note and the Refresh button.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

UI: the Refresh button and the T3-down note follow the existing header style; anything else visible beyond the approved mockups, stop and ask the coordinator first.

Out of scope: starting or messaging threads (story 6).

## Acceptance

- [x] Running, question and stopped threads put the strand in the right lane with its reason, covered by tests with t3 output stubbed
- [x] The page updates by itself every 30 s and on a file change, and has a Refresh button
- [x] Without T3 the board still works and says so
- [x] npm run verify passes; CI green on Windows and Ubuntu
- [x] braid board --demo shows every lane and every Waiting reason without touching the repo, gh or t3; the screenshots are retaken from it

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. src/board/t3.ts: read `t3 thread list --json` (+ `show --json` for running threads and unjoined stopped ones, cached per thread id); join a thread to a strand by its linked PR (number/url against GitHub's PRs), else by worktree path matched to `git worktree list`, else show's branch. Async, shared for 3 s; T3 down gives a note, never an error.
2. model.ts `derive` takes T3: running thread -> In Progress (Waiting "question" if a request is pending, even with failing checks); open PR otherwise as before; interrupted/cancelled thread with no PR -> Waiting "agent stopped". BoardData gets `t3` status.
3. Server: async api, `/api/events` (server-sent events) pushing a refresh every 30 s while a page is open and when a file under braids/ changes; `?fresh=1` bypasses the 3 s share for the Refresh button.
4. Page: Refresh button and T3-down note in the header style; refetch on each event without flicker.
5. `braid board --demo`: src/board/demo.ts holds sample braids (in-memory Tree) with fake GitHub and T3 results covering every lane and Waiting reason; no repo, gh or t3 reads, no writes; tests reuse it.
6. Tests with t3 stubbed; retake screenshots from --demo into docs/design/board-screenshots/.
