---
id: TASK-2.2
title: 'Spike: the board''s path: starting agents, derived states, the first version'
status: Done
assignee: []
created_date: '2026-11-13T12:37:00Z'
updated_date: '2026-11-13T15:05:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies:
  - TASK-2.1
  - TASK-2.3
parent_task_id: TASK-2
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the smallest path to braid's own board (roadmap "braid's own board") and how it can start agents, building on TASK-2.1's and TASK-2.3's recommendations. Feeds the follow-up goals. Time box: about two hours of agent work; if it runs out, report what is known and what isn't.

Expected size: an updated roadmap section of about 30 to 60 lines.

Start here (read in this order):
- TASK-2.1's and TASK-2.3's final summaries, `docs/backlog-md.md` and `docs/braid-cli.md`.
- `docs/roadmap.md`: "braid's own board".
- `.agents/skills/braid/references/workflow.md`: branches, statuses, what the board shows.

Questions:
1. Starting work from outside T3: can a local program start a T3 thread on a worktree, or send a message to an existing thread (API, CLI, link scheme)? If not, the fallback (for example the `claude` or `codex` CLI) and what it loses.
2. Derived states: for Running, In Review, Waiting for you (with the stop case) and Done, the source (`gh`, T3, task labels, branches), how reliable it is and its cost per refresh.
3. The smallest first version: a read-only local board with derived columns, where a goal is one top-level card that expands (or opens) to show its subtasks together, on the way and UI stack from TASK-2.3; propose candidate lanes for the user to choose later; its size, and the follow-up goals after it. Also say whether Backlog.md 1.55.3's own board or task view can already show a parent with its subtasks, and how.

Change:
- `docs/roadmap.md` "braid's own board": the recommended path, the first version and the follow-up goals, marked as proposed until the user decides.

Already decided (don't re-investigate):
- The current braid CLI (`src/`, the `.braid/` ledger) and the roadmap's stages built around it are dismissed: the new CLI starts fresh and needn't fit them.
- The user leans to reimplementing (2026-11-13): a compatible Node tracker with Backlog.md as the reference, wrapping its CLI during the transition. The product will grow: richer UI, checkpoints, reports, better resuming, multiple agents, running a task from the board.
- UI: modern UI libraries; minimal but functional, the main view a board with several lanes (the lanes are defined later).

Out of scope:
- Re-deciding fork or reference (TASK-2.1) or the CLI's design (TASK-2.3), building the board, product code and skill changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each of the three questions is answered with evidence (commands run, files or docs read)
- [x] #2 The roadmap section proposes the path, the first version with its size, and the follow-up goals
- [x] #3 No product code or skill changes
- [x] #4 The first version shows a goal as one top-level card that expands to its subtasks; the doc says what Backlog.md already offers for this
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Q1 (starting agents): look at what T3 Code exposes on this machine (CLI, local server and its protocol, link scheme, the MCP tools this host gives agents), and the claude and codex CLIs as fallback; record commands and what each loses.
2. Q2 (derived states): for Running, In Review, Waiting for you and Done, pick the source (gh pr list/checks, T3 threads, ask:<key> labels, branches), time the gh calls on this repo, and write the rule table with reliability and cost per refresh.
3. Q3 (first version): read Backlog.md 1.55.3's board and task view (clone the tag into gitignored inspiration/) for parent/subtask display; propose candidate lanes, the read-only first version on TASK-2.3's way and stack with goal cards that expand, its size, and the follow-up goals.
4. Rewrite docs/roadmap.md "braid's own board" (about 30-60 lines, marked proposed), noting evidence in task notes; run npm run verify; final summary; Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence (2026-11-13): `t3 --help`, `t3 thread start|send|show|list --help` (t3 v0.1.6); `t3 thread list --project C:\code\agento --json` (72 threads, 1.2 s; statuses running/completed/interrupted/cancelled) and `t3 thread show --json` (fields incl. branch, worktreePath, pendingRequestCount, ~0.95 s). Timings: `gh pr list --state all --limit 100` with statusCheckRollup 3.5 s (55 PRs), lean 0.9 s; open with checks 0.8 s; `git ls-remote` 0.5 s; GraphQL budget 5,000/h. Backlog.md v1.55.3 cloned into gitignored inspiration/: src/ui/board.ts buildColumnTasks, src/web/components/TaskDetailsModal.tsx; web Board/TaskColumn/TaskCard have no parent grouping.
Decision: proposed moving the read-only T3 source into goal 1 phase (b), since the t3 CLI makes it cheap; actions stay in goal 4.

Review fixes (PR #56): list and show fields split (branch, worktreePath, pendingRequestCount are show-only; branch can be null); join key via list pullRequests, then show worktreePath against git worktree list, branch as fallback; refresh re-costed (list 1.3 s for 73 threads, show ~1 s per running thread of an open item, 1.5-2.5 s parallel); --wait exit codes and seen statuses added; goal 1 size 5,500-8,400 with module rows; Failed split into Failed (red checks) and Stopped (interrupted/cancelled, no PR).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Changed: docs/roadmap.md "braid's own board" gains a "Proposed path" section (marked proposed until the user decides): starting agents, derived-state rules with a thread-to-task join, what Backlog.md already shows, the first version with its size, candidate lanes and follow-up goals.

Answers:
1. Starting agents: yes. T3 Code ships a `t3` CLI (v0.1.6) over the running server: `t3 thread start <project> <msg> --worktree <base> --branch <item> --provider --model --json` starts a thread in a new worktree; `t3 thread send` messages an existing thread (queued as its next turn); `--wait` on both exits 2 when the agent waits for an answer. `list --json` gives status (seen: running, completed, interrupted, cancelled), link and linked PRs; only `show --json` gives branch (can be null), worktreePath and pendingRequestCount. Limits: needs T3 running; no flag for reasoning effort; ~1 s per call. Fallback `claude -p` / `codex exec` loses the visible, answerable thread, T3's MCP tools and live state.
2. Derived states: threads join to tasks through list's linked PRs, else show's worktreePath against `git worktree list` (cached), branch as fallback. Running from a joined running thread (or item branch without PR or thread, weak); In Review from an open PR on item/<id>-*; Waiting for you from pendingRequestCount (show), ask:<key> labels, the summary's Needs the user line, or a PR into main; Done from a merged PR; Failed = red checks; Stopped = interrupted/cancelled thread with no PR (T3 doesn't say who stopped it). Refresh: list 1.3 s + one show (~1 s) per running thread of an open item (1-3 with one item at a time), 1.5-2.5 s in parallel, 4-6 s sequential; acceptable with caching of worktree paths and merged PRs.
3. First version: read-only `braid board` (goal 1 of braid-cli.md, tier L, ~5,500-8,400 product lines, against braid-cli.md's 7,500-11,100 for tracker and board together; four phases); a goal is one card in the lane of its most urgent subtask, with progress and one dot per subtask, expanding in place to its subtasks. Lanes A (by state), B (by who acts), C (state with Ready split) for the user. Backlog.md 1.55.3: task view lists subtasks, task list -p filters; the TUI board puts a subtask after its parent only if same status; the web board is flat, only the task modal lists subtasks with "n of m complete".

Validation: commands and files in the notes; npm run verify passes (40 tests). No product code or skill changes.
Open: T3's effort setting on start; whether a question (not an approval) shows in pendingRequestCount; reading T3's local API directly instead of the CLI; whether the board could be a T3 panel.
For later items: goal 1 phase (b) also reads T3 (read-only) via `t3 thread list/show --json` with the join above; goal 4 Start uses `t3 thread start`, Open thread the thread's `link`.
Needs the user: scope: choose the lanes (A, B or C) and confirm moving the read-only T3 source into goal 1.
<!-- SECTION:FINAL_SUMMARY:END -->
