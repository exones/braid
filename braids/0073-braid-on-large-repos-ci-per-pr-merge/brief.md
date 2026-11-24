---
id: '0073'
title: "braid on large repos: CI per PR, merge gate, merge preconditions"
status: In Progress
labels: []
dependencies: []
related: ['0071']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P20, from the Everix field report (a large polyglot monorepo where a merge into main deploys shared environments; 2026-11-23). braid works on such a repo: fewer CI runs per strand, a project merge gate no preset skips, `ci: all` for CI that differs per PR, and the rest as documented lines. The user added one small board change at the end: a request code on the board copies itself on click. Scope settled with the user: enforce in code only what is expensive to get wrong and what an agent could skip; everything else is a line in BRAID.md, AGENTS.md or a skill (the user: "ok, good, so no major overengineering"). Inbox 2026-11-23-n1xv, 60mj, bbd3, odxc.

## Strands

- 0073/A Fewer CI runs per strand (first and fast; merges into `main` early, see "Already decided").
- 0073/B Merge gate: `merge-gate:` in BRAID.md, run by `braid accept --merge` before any merge into `main`.
- 0073/C `ci: all`: wait for every check reported on the commit, with a start grace.
- 0073/D Large-repo lines (partial CI on braid branches, review bots, path stops, caches) and the docs as a whole.
- 0073/E Board: click a request code to copy it (the user's addition, 2026-11-23).

## Already decided

- Order is binding (the user: "I need it quite quickly. Even make it first in P20"): 0073/A first, brought to the PM as soon as it is reviewed and green.
- 0073/A reaches `main` early through an intermediate PR from the braid branch into `main` once 0073/A is merged into the braid branch; the user merges it. That PR carries 0073/A and the briefs only; it is not the final PR, and `braid accept 0073` is not run for it. After its merge the braid branch merges `main` and goes on with 0073/B.
- In code only: `merge-gate:` and `ci: all`. Everything else is BRAID.md, AGENTS.md or skill lines with documented examples.
- Skill text gets shorter or stays the same size (programme requirement: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests"). Measured with `wc -w` on each skill touched, before and after.
- Everix runs on `steady` meanwhile.
- No docs strand: `docs.update` is `both`, so every strand keeps the docs it touches true, and 0073/D, whose content is documentation, also brings the docs up to date as a whole for the braid (the docs strand's duty).
- Related to 0071 (The board wakes, reminds and nudges, on `braid/0071-the-board-wakes-reminds-and-nudges`): 0071 changes the board and the braid and braid-pm skills (its strand D), not ci.yml or the braid-worker skill. This braid does not touch the braid or braid-pm skills; if a strand must, the coordinator tells the PM first. Whichever merges into `main` second merges `main` before its final PR.

## Out of scope

- `braid doctor` (P18); projects with their own work tracker (2026-11-23-gwwt, the user decided later).
- Path rules for `ci` (`<glob> → <names>`), `gate:` as a list, a `cleanup:` field, a disk-space check: lines instead (0073/D).
- CI skipping draft PRs (P10's draft final PR has not landed; whichever lands second adds it).

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

## Completion

- [x] A strand's PR run is the only CI run per push on a strand; the braid branch has no push CI, and `braid wait` still answers after a strand's merge
- [x] `braid accept --merge` into `main` runs the project's `merge-gate` command and refuses on its failure with its output, under any preset
- [x] With `ci: all`, `braid wait`, `braid accept`, `braid handover` and `braid recap` require every check reported on the commit (the start grace is `braid wait`'s only)
- [x] BRAID.md template and docs show, with examples, partial CI on braid branches, review bots, path stops and caches; the worker answers and resolves the review bots' comments
- [x] Skills touched are the same size or shorter
- [x] Every request code chip on the board copies its code on click, also over plain http and on a phone
- [x] The docs from BRAID.md `docs` are true for everything the braid changed

## Working at the end

On a repo whose merge into main deploys: braid accept --merge runs the project's merge-gate and refuses on failure, under any preset; with ci: all, braid wait waits for the checks actually reported; a worker answers and resolves the review bots' comments.
