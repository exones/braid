---
id: TASK-2.1
title: 'Spike: Backlog.md''s implementation as braid''s reference; fork or reference'
status: In Progress
assignee: []
created_date: '2026-11-13T12:37:00Z'
updated_date: '2026-11-13T12:57:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies: []
parent_task_id: TASK-2
ordinal: 10
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: a lasting map of how Backlog.md is built, so the user can judge how complex braid's own tracker is, and a recommendation: fork Backlog.md and adjust it into braid, wrap its CLI or MCP server, or reimplement a compatible tracker using its code as a reference. Feeds the user's choice and TASK-2.2. Time box: about three hours of agent work; if it runs out, report what is known and what isn't.

Expected size: one new doc of about 200 to 300 lines.

Start here (read in this order):
- `docs/roadmap.md`: "braid's own board" (what braid keeps from Backlog.md and what it adds).
- `docs/decisions.md`: D01 and D30.
- `BRAID.md` and `.agents/skills/braid/assets/task.md`: which Backlog.md features braid uses today.
- The source: `git clone --branch v1.55.3 --depth 1 https://github.com/MrLesk/Backlog.md inspiration/backlog.md` in your worktree (`inspiration/` is gitignored; never commit it).

Change:
- `docs/backlog-md.md` (new): Backlog.md as a reference. Its parts (task file format and parsing, IDs and subtasks, cross-branch reads, config, CLI, MCP server, board and web UI, tests) with line counts and what each does; how it does what braid uses and what braid adds (goals nested, derived states, actions); the hard parts and known bugs braid has hit; runtime and build (Bun or Node; braid is Node.js 26, TypeScript, ESM); upstream health (release pace, contributors, open issues).
- The same doc ends with the three ways compared: size to own, upkeep against upstream, runtime fit, licence, what braid would drop or rewrite, and the path to the derived-state board. Recommend one, with the conditions that would change it.

Already decided (don't re-investigate):
- Backlog.md stays the store until braid reads the same files.
- The current braid CLI (`src/`, the `.braid/` ledger) and the roadmap's stages built around it are dismissed: the new CLI starts fresh and needn't fit them.
- Earlier count: about 68k lines at 1.55.3, 16k of them the web UI (verify with a per-folder count).

Out of scope:
- Starting agents, derived-state sources and the first board version (TASK-2.2).
- Product code, skill changes, and committing Backlog.md's source.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/backlog-md.md maps Backlog.md 1.55.3 by part with line counts, and names the parts braid uses
- [ ] #2 It compares fork, wrap and reimplement-with-reference on size, upkeep, runtime fit and licence, and recommends one with the conditions that would change it
- [ ] #3 Claims cite files, commands run or upstream pages
- [ ] #4 No product code or skill changes; Backlog.md source is not committed
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
