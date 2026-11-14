---
id: '0006'
title: "Read-only board: braid board with live states"
status: Done
labels: ["kind:story", "tier:L", "ui"]
dependencies: []
order: 60
delivery: epic
---

Goal: story 3 of the new braid (plan: `archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md` ("Decided so far", story 3)). `braid board` opens a local page with the lanes To Do · In Progress · In Review · Waiting · Done; braid cards expand to their strands; states come from the stored status, the strand's own branch, GitHub PRs and T3 threads.

Strands, in order:
- TASK-6.1: board skeleton and `braid check`.
- TASK-6.2: live copies from branches.
- TASK-6.3: GitHub states.
- TASK-6.4: T3 threads and live refresh.

Already decided (don't re-investigate): doc-5 "Decided so far" and story 3's decisions: the five lanes and their meaning; branch names `braid/0006-<slug>` (a braid) and `braid/0006/A-<slug>` (a strand); the four Waiting reasons for now; refresh every 30 s, on file change and by button; tried in the playground repo and on fixtures; React, Vite, Tailwind, Radix; no drag and drop; agents may edit braid files directly, then `braid check`.

Out of scope: board actions (Start, Merge, Open thread are story 6), the import of `backlog/` and the skills switch (story 4), several projects.

## Acceptance

- [x] All four strands are Done on the epic branch
- [x] braid board shows the playground's braids in the five lanes, with a strand's state taken from its branch, its PR and its T3 thread

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open
