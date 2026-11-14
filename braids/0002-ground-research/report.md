What changed: the ground research for a new braid (a task tracker CLI, a board, later T3 automation), as four reports attached to the tasks in backlog/docs. doc-1 (TASK-2.1): Backlog.md 1.55.3 as braid's reference. doc-2 (TASK-2.3): how the braid CLI could be built, with estimates and a proposed UI stack and follow-up goals. doc-3 (TASK-2.2): starting and reading agents through T3's t3 CLI, derived states and the first read-only board. doc-4: the results and the user's decisions. docs/ and the roadmap are unchanged.
Why: to choose how braid gets its own tracker and board before planning the implementation.
User decisions (doc-4): rewrite a Node tracker compatible with Backlog.md's files, sized to braid's needs; lanes To Do, In Progress, In Review, Waiting (with its reason), Done; the first board reads T3; MIT.
Validation: npm run verify passes; each spike was independently reviewed (TASK-2.2 blocking once, fixed); the final PR #57 was reviewed, not blocking.
Open: the implementation plan, starting from doc-4; the MIT licence story on the user's go. The subtasks' original acceptance text still names docs/ files; their notes record the move to the reports.

## TASK-2 report: research results and the user's decisions

# TASK-2: research results and the user's decisions

> Outcome of TASK-2 (2026-11-13), the ground research for a new braid: a CLI that tracks tasks, a board, and later automation of T3. Start here when planning the implementation. The three spike reports below hold the evidence; this page holds what the user decided from them.

## The user's decisions

1. **Way: rewrite.** braid gets a new Node.js tracker that reads and writes Backlog.md's task files, built with Backlog.md's code and tests as the reference. It is a custom tool sized to what braid needs, with fewer features than Backlog.md; not a fork and not a wrap. `backlog` stays usable during the transition.
2. **Board lanes: To Do · In Progress · In Review · Waiting · Done.**
   - To Do: not started. A task whose dependencies aren't Done shows a badge; nothing is wrong.
   - In Progress: agents move it by themselves: the worker, CI, the reviewer agent, fix rounds after a red check or a review finding.
   - In Review: the user's normal step. The work is ready and the recap is handed over for the user's review and merge.
   - Waiting: stuck until the user acts, with the reason shown on the card: a stop case or a question; fixes still failing after two review rounds or a second red CI; an agent stopped with no PR; failing checks nobody is fixing. New reasons may be added later, not new lanes.
   - A goal is one card in the lane of its most urgent subtask, with a progress count, and expands in place to show its subtasks.
3. **The first board already reads T3** (read-only, through T3's `t3` CLI), so live agent states show from the start.
4. **Licence: MIT.** A `LICENSE` file and the `package.json` field come as a separate story, on the user's go.
5. **UI** (said earlier in TASK-2): modern UI libraries; minimal but functional, with the board as the main view.
6. **Later product** (said earlier in TASK-2): richer UI, checkpoints, reports, better resuming, several agents, running a task from the board. Work is planned as bigger stories with phases, which suit long unattended runs.
7. **Dismissed:** the current braid CLI (`src/`, the `.braid/` ledger) and the roadmap stages built around it; the new CLI starts fresh.

These replace the spike reports' open questions (fork, wrap or rewrite) and their lane options A, B and C.

## Research results (recommendations, not decided unless listed above)

- [TASK-2.1 report: Backlog.md as braid's reference](../../archive/backlog/docs/doc-1%20-%20TASK-2.1-report-Backlog.md-as-braids-reference.md): Backlog.md 1.55.3 is about 67k product lines and 88k test lines, Bun only, MIT, one maintainer in practice; braid uses a small part of it. How it stores tasks, IDs, subtasks and cross-branch reads (the working copy wins).
- [TASK-2.3 report: how the braid CLI could be built](../../archive/backlog/docs/doc-2%20-%20TASK-2.3-report-how-the-braid-CLI-could-be-built.md): a design sketch; about 5.1k-7.1k product lines for the compatible tracker, 7.5k-11.1k with the board, before trimming to braid's needs; a proposed UI stack (React, Vite, Tailwind, Radix, served on 127.0.0.1) and six follow-up goals with phases. The stack and the goals are proposals for the implementation plan to confirm.
- [TASK-2.2 report: the board's path](../../archive/backlog/docs/doc-3%20-%20TASK-2.2-report-the-boards-path.md): starting and reading agents through the `t3` CLI; where each state comes from and what a refresh costs; the first read-only board (about 5.5k-8.4k lines). Its lanes are superseded by decision 2.

## Still open

- The implementation plan: goals, order, sizes and the UI stack, starting from the TASK-2.3 and TASK-2.2 reports.
- The MIT licence story.
