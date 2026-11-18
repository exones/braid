---
id: '0024'
title: "Reviewer threads linked to their PR"
status: In Progress
labels: ["kind:task", "tier:L"]
dependencies: []
delivery: epic
---

## Goal

A reviewer thread is never linked to the PR it reviews, so T3 doesn't settle it when that PR merges and it stays open in the user's sidebar (example: the `openclaw 0002 review` thread, whose `pullRequests` was empty). The coordinator links the PR to each reviewer thread it launches, so the reviewer settles with the PR like the worker does.

Expected size: about 5 lines in 1 to 3 files.

## Start here

- `.agents/skills/braid/SKILL.md`, "Accept and hand over", step 1: where the coordinator launches the reviewer (M and L, and the L re-check).
- `.agents/skills/braid-worker/SKILL.md`, "PR" step 2: the worker links its own PR with `link_pull_request`; the reviewer has no such step.
- `.agents/skills/braid-reviewer/SKILL.md`: what the reviewer does; it should stay unchanged.

## Change

- `.agents/skills/braid/SKILL.md`: right after launching a reviewer (first review and re-check), the coordinator calls `link_pull_request` with the PR URL and `threadId` set to the reviewer's thread id. Keep it to one short clause in the existing step.
- Any doc that describes which threads link which PR (search `link_pull_request`, `settle`), if one does.

## Already decided

- The coordinator links, not the reviewer. The T3 host tells agents to skip linking PRs they only read or review, and the reviewer runs on another provider, so a reviewer-side step would be unreliable. `link_pull_request` with `threadId` links another thread: checked by the coordinator on 2026-11-18 by linking exones/openclaw#21 to that review thread (`alreadyLinked: false`, then linked).
- Workers already link their own PRs; no change there.

## Out of scope

- The `braid` CLI: `braid start --review` doesn't talk to T3.
- Research threads (no PR) and the final PR (the coordinator opens and links it itself).
- Settling or unlinking threads by hand after a merge.

## Completion

- [ ] `.agents/skills/braid/SKILL.md` tells the coordinator to link the PR to every reviewer thread it launches, first review and re-check, with `link_pull_request` and the reviewer's `threadId`
- [ ] No other skill or doc still says or implies reviewer threads stay unlinked
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
