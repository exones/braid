---
id: '0073'
title: "braid on large repos: CI per PR, merge gate, merge preconditions"
status: Outline
labels: []
dependencies: []
delivery: epic
---

## Goal

Programme pm/autonomous-dev-machine, row P20, from the Everix field report (a large polyglot monorepo where a merge into main deploys shared environments; 2026-11-23). Scope settled with the user: enforce in code only what is expensive to get wrong and what an agent could skip; everything else is a line in BRAID.md, AGENTS.md or a skill (the user: "ok, good, so no major overengineering").

First, and quickly (the user: "I need it quite quickly. Even make it first in P20"): fewer CI runs per strand. (1) No push CI on `braid/*` in .github/workflows/ci.yml: a strand's PR run already tests it merged onto the braid branch, and the final PR into main runs everything again; `main` keeps its push run. (2) The worker pushes all fixes from one review round in one push (a braid-worker skill line). (3) If P10's draft final PR lands first, CI skips draft PRs. Ship this as the braid's first strand, so it can merge into main early as a story of its own if the coordinator sees fit.

Enforced in code (small):
- `merge-gate:` in BRAID.md: one command (with `<pr>` and `<sha>` filled in) that `braid accept --merge` runs before any merge into main and that no preset skips; a failure refuses the merge with its output. The project's own script decides the rest (test counts, merge windows, a finance non-regression run). Inbox 2026-11-23-60mj.
- `ci: all`: wait for every check actually reported on the commit, with a short start grace, so `braid wait` and the merge condition "checks green" check something; today `ci: []` returns at once. Inbox 2026-11-23-n1xv.

Lines, not code (documented with BRAID.md examples, and a few skill lines):
- partial or no CI on braid branches: the strand's evidence is the worker's gate output and duration (n1xv);
- review bots named in BRAID.md; the worker waits for their reviews, triages each comment (fix, answer why not, or nit), replies and resolves, and the braid reviewer reads them instead of re-reviewing (2026-11-23-odxc);
- path-scoped gates live in the project's gate script; path-based "ask first" stops (e.g. code/finance/**) are an AGENTS.md line, and the merge gate blocks them for main; caches and disk space are a project script or a `setup` note (2026-11-23-bbd3).
Out of scope: `braid doctor` (P18), projects with their own tracker (2026-11-23-gwwt, the user decided later).

This is an outline: its coordinator plans it fully when its turn comes.

## Working at the end

On a repo whose merge into main deploys: braid accept --merge runs the project's merge-gate and refuses on failure, under any preset; with ci: all, braid wait waits for the checks actually reported; a worker answers and resolves the review bots' comments.
