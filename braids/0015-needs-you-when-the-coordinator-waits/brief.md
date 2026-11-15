---
id: '0015'
title: "Needs You when the coordinator waits"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
delivery: epic
---

## Goal

The board tells the coordinator's thread from a worker's, and shows a braid in Needs You when the coordinator has stopped to wait for the user (a stop case, a plan question, a merge request), preferably from T3's own thread state rather than a label someone must remember to set (user, 2026-11-14 and 2026-11-15).

## Working at the end

- While the coordinator waits for the user, its braid sits in Needs You with the reason; when the user answers, it leaves.
- The coordinator's own running thread never makes its braid read as Working (found finishing 0014: the coordinator's checkout is on the braid branch, so the board took its thread for a worker; `braid done` already skips the caller since 0014/F).

## Strands

- A. Spike: how the board sees the coordinator (M, Opus as researcher). Its report proposes the build strands.
- Build strands from A's report, created after the user decides.
