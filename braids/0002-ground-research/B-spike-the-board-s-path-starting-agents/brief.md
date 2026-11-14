---
id: '0002/B'
title: "Spike: the board's path: starting agents, derived states, the first version"
status: Done
labels: ["kind:spike", "tier:M"]
dependencies: ['0002/A', '0002/C']
order: 20
---

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

## Acceptance

- [x] Each of the three questions is answered with evidence (commands run, files or docs read)
- [x] The roadmap section proposes the path, the first version with its size, and the follow-up goals
- [x] No product code or skill changes
- [x] The first version shows a goal as one top-level card that expands to its subtasks; the doc says what Backlog.md already offers for this

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. Q1 (starting agents): look at what T3 Code exposes on this machine (CLI, local server and its protocol, link scheme, the MCP tools this host gives agents), and the claude and codex CLIs as fallback; record commands and what each loses.
2. Q2 (derived states): for Running, In Review, Waiting for you and Done, pick the source (gh pr list/checks, T3 threads, ask:<key> labels, branches), time the gh calls on this repo, and write the rule table with reliability and cost per refresh.
3. Q3 (first version): read Backlog.md 1.55.3's board and task view (clone the tag into gitignored inspiration/) for parent/subtask display; propose candidate lanes, the read-only first version on TASK-2.3's way and stack with goal cards that expand, its size, and the follow-up goals.
4. Rewrite docs/roadmap.md "braid's own board" (about 30-60 lines, marked proposed), noting evidence in task notes; run npm run verify; final summary; Done.
