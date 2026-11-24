---
id: '0075'
title: "Lifecycle off the code branches, one pure lane"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P22, from Fable's review of origin/main d130b6b9 (2026-11-24; inbox 2026-11-23-0a0a), placed right after P20 by the user: "this is most painful on large repos (bcs of constant moving of head)". Two parts, after one small fix that comes first:

- **The PM's checker counts as running** (inbox 2026-11-24-fwoa, the user: "it's already bugging us"). A PM whose only running work is its recorded live checker is nudged and then reads stalled, because the board drops the record the first time T3 says the checker's thread isn't running. 0075/A, merged into `main` early.
- **Lifecycle off the code branches.** Today `braid accept` commits the Done stamp on a story's or final PR's own branch, so the PR head moves and CI and reviews run again for bookkeeping. The lifecycle events (started, accepted at a head) move to the record branch, as 0070 did for answers, and Done is derived from the merged PR. Briefs, reports and logs stay where they are. 0075/B.
- **One pure lane derivation.** `derive` writes alarms while it derives, `toCard` re-implements request routing, the stall and limit steps, and the board, `braid status` and the Merge action pass it different inputs. One pure function, alarms as a separate step, the same inputs everywhere. 0075/C.

Programme requirement (the user): "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". This braid removes special cases; skill text gets shorter or stays the same size.

## Working at the end

`braid accept` no longer moves a PR's head, so CI and reviews aren't re-run for bookkeeping; `braid status` and the board show the same lane for every braid; a PM waiting on its checker isn't nudged.

## Already decided

- Placement right after P20 (0073), by the user.
- Lifecycle moves to the record branch; old briefs' stored `status` (In Progress, Done) keeps reading right in this and other repos (Everix). The record's shape is settled with the PM before 0075/B builds it (see that brief).
- 0075/A goes into `main` ahead of the rest: once it is merged into the braid branch, the coordinator opens an early PR from the braid branch into `main` and hands it to the PM for the user's merge.
- Related to 0074 (P21, board pauses and resumes by code; runs after this braid): both touch the board. This braid changes only the lane derivation and the checker count; 0074 starts after 0075 merges.
- Every merge into `main` is the user's.

## Out of scope

- Moving briefs, reports or logs off the code branches (lpz8's bigger cut).
- Board pauses and resumes (0074), new board views.

## Completion

- [ ] A PM whose only running work is its recorded checker is not nudged or shown stalled (0075/A).
- [ ] `braid accept` commits nothing on a PR's branch; Done of a story, strand or goal is read from its merged PR (0075/B).
- [ ] Braids written before this braid (stored In Progress or Done) read the same lanes as before, in this repo's `braids/` and in a fixture of another project's (0075/B).
- [ ] The lane is one pure function; `braid status`, the board and the Merge action give the same lane for the same braid; a braid with all strands Done, no final PR and a live coordinator does not read Done (0075/C).
- [ ] The braid skills' text about accepting and Done is no longer than before, and the docs are true (0075/D).

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
