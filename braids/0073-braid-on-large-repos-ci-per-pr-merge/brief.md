---
id: '0073'
title: "braid on large repos: CI per PR, merge gate, merge preconditions"
status: Outline
labels: []
dependencies: []
delivery: epic
---

## Goal

Programme pm/autonomous-dev-machine, row P20, from the Everix field report (a large polyglot monorepo; 2026-11-23). braid fits repos where CI and merging are more than "fixed check names green":
- CI that differs per PR: `ci: all` (wait for every check reported on the commit, with a start grace) or path rules (`<glob> → <names>`); BRAID.md can say CI on braid branches is partial or none, and then the worker's gate run (output and duration) is the strand's required evidence; existing review bots are named, as input to the braid reviewer or excluded from `ci` (inbox 2026-11-23-n1xv).
- A project merge gate: a `merge-gate:` command `braid accept --merge` runs with the PR and sha before any merge into main; project merge preconditions no preset overrides (a command answering "may I merge now?"); path-based forced stops (`code/finance/** → ask`) (2026-11-23-60mj).
- Path-scoped gates (`<glob> → <command>`, full gate as fallback), `braid doctor` (runs setup and a dry gate, reports environment failures as setup problems), a `cleanup:` field `braid clean` also removes, a disk-space check before `braid start` (2026-11-23-bbd3).
Projects with their own tracker (2026-11-23-gwwt) are out of scope: the user decided later.

This is an outline: its coordinator plans it fully when its turn comes, and may split it.

## Working at the end

A repo whose checks depend on paths and whose merge into main deploys: braid waits for the checks actually reported, runs the project's merge gate and its may-I-merge-now check before any merge into main, and stops for a finance path even under free.
