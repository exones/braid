---
id: TASK-2.1
title: 'Spike: Backlog.md''s implementation as braid''s reference; fork or reference'
status: Done
assignee: []
created_date: '2026-11-13T12:37:00Z'
updated_date: '2026-11-13T13:03:00Z'
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
- [x] #1 docs/backlog-md.md maps Backlog.md 1.55.3 by part with line counts, and names the parts braid uses
- [x] #2 It compares fork, wrap and reimplement-with-reference on size, upkeep, runtime fit and licence, and recommends one with the conditions that would change it
- [x] #3 Claims cite files, commands run or upstream pages
- [x] #4 No product code or skill changes; Backlog.md source is not committed
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 The gate command from BRAID.md passes
- [x] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Clone Backlog.md v1.55.3 into inspiration/ (gitignored) and count lines per folder (non-test, tests, web UI).
2. Read the parts braid uses: task file format and structured sections, ID and subtask generation, cross-branch loading, config, CLI commands, MCP server, web server and board; note Bun-only APIs and the build.
3. Collect upstream health with gh api (releases, contributors, open issues) and the licence.
4. Write docs/backlog-md.md: parts with line counts, how it does what braid uses, what braid adds, hard parts and known bugs, runtime, upstream health, then fork vs wrap vs reimplement compared, with a recommendation and the conditions that would change it.
5. Run npm run verify; write the final summary; set Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Bun use is concentrated in tests: product code has 119 Bun.* calls in 23 files; tests have 922 more and 324 files on bun:test. Product total is 66,604 lines (web UI 15,800 TS/TSX + 375 CSS/HTML), tests 88,487.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
What changed: new docs/backlog-md.md maps Backlog.md 1.55.3 by part with line counts (66.6k product lines: core 11.1k, CLI 10.6k, TUI 9.8k, web UI 15.8k, MCP 4.5k, format 2.2k; 88.5k test lines), explains how it does what braid uses (file format and section markers, IDs and subtasks, cross-branch reads, statuses, readiness, boards, --json), what braid adds against it, the hard parts and the bugs braid has hit, runtime (Bun-only: 119 product Bun calls, 922 more in tests, compiled binaries), and upstream health (MIT, 206 releases, 21 in six months, one maintainer with 1,407 of the commits, 77 open issues).
Recommendation: reimplement a compatible Node tracker with Backlog.md as the reference, and wrap its CLI during the transition: braid's board reads tasks first and joins GitHub and T3 for derived states while writes go through backlog; then braid's CLI takes over the commands braid calls, proven by round-trip tests against Backlog.md-written files. Fork if the user wants most of Backlog.md's web UI or braid moves to Bun; wrap only if the board is all braid needs; revisit if the compatible subset is much larger than 8k lines.
Why: braid needs about a tenth of Backlog.md; a fork carries Bun (above all the test suite), UI braid would delete, and a fast single-maintainer upstream; derived states contradict Backlog.md's stored-status model.
Validation: counts and claims from the v1.55.3 source (wc, grep), gh api for upstream, epic 008 report A and trial; npm run verify passes.
Open: cross-branch read performance on large repos, --json schema stability across releases, and the content of open issues were not checked.
For later items: TASK-2.3 owns the CLI estimate; the doc's 5k-8k line range for the compatible subset is a rough bound for it to confirm or replace.
Needs the user: decision: choose fork, wrap or reimplement (recommended: reimplement with reference, wrapping during the transition).
<!-- SECTION:FINAL_SUMMARY:END -->
