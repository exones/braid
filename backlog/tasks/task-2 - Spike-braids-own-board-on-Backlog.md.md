---
id: TASK-2
title: 'Spike: braid''s own board on Backlog.md'
status: To Do
assignee: []
created_date: '2026-11-12T20:01:00Z'
labels:
  - kind:spike
  - tier:M
dependencies: []
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Question: what is the smallest path to braid's own board (roadmap "braid's own board"), and how can it start agents?

Time box: about two hours of agent work; if it runs out, report what is known and what isn't.

Start here (read in this order):
- `docs/roadmap.md`: "braid's own board".
- `docs/decisions.md`: D01 and D30.
- `.agents/skills/braid/references/workflow.md`: branches, statuses, what the board shows.
- `BRAID.md`: how Backlog.md is called.

Questions:
1. Starting work from outside T3: can a local program start a T3 thread on a worktree, or send a message to an existing thread (API, CLI, link scheme)? If not, the fallback (for example the `claude` or `codex` CLI) and what it loses.
2. Backlog.md reuse: wrap its CLI (`--plain`) or MCP server, fork its core and Markdown code (MIT; about 68k lines at 1.55.3, 16k of them the web UI), or reimplement a compatible file format. Weigh size, upkeep and what braid actually uses.
3. Derived states: for Running, In Review, Waiting for you (with the stop case) and Done, the source (`gh`, T3, task labels, branches), how reliable it is and its cost per refresh.
4. The smallest first version: a read-only local board with derived columns and goals nested; its size, and the follow-up goals after it.

Out of scope: building the board; changing the skills.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the four questions is answered with evidence (commands run, files or docs read)
- [ ] #2 The final summary recommends a path, the first version's size and the follow-up goals
- [ ] #3 No product code or skill changes
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->
