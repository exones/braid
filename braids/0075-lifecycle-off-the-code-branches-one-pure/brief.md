---
id: '0075'
title: "Lifecycle off the code branches, one pure lane"
status: Outline
labels: []
dependencies: []
delivery: epic
---

## Goal

Programme pm/autonomous-dev-machine, row P22, from Fable's review of origin/main d130b6b9 (2026-11-24; inbox 2026-11-23-0a0a). Placed right after P20 by the user: "this is most painful on large repos (bcs of constant moving of head)".
(1) Lifecycle off the code branches: status, the Done stamp and late box ticks are committed on the branch under review, so they move PR heads. Move only the lifecycle events (started, accepted at a head) to the record branch, as 0070 did for answers, and derive Done from the merged PR; briefs, reports and logs stay. That removes the four Done special cases in `derive` (src/board/model.ts:355-422), the accept/re-watch dance in the skill, the three disagreeing "braids-only commit inherits green" copies (done.ts:133 vs wait.ts and ci.yml), k5d1/sqck-style problems, and "newest copy wins" in branches.ts.
(2) One pure lane derivation, with alarms (sig.alarm writing .braid/broke.json) as a separate step; toCard (model.ts:585-620) stops re-implementing request routing, stall and limit steps; the board, `braid status` and the Merge action pass the same inputs. Fix by test: a braid with all strands Done, no final PR yet and a live coordinator must not read Done (docs/board.md:9).

This is an outline: its coordinator plans it fully when its turn comes.

## Working at the end

accept no longer moves a PR's head, so CI and reviews aren't re-run for bookkeeping; braid status and the board show the same lane for every braid.
