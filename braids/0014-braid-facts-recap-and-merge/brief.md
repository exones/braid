---
id: '0014'
title: "braid facts, recap and merge"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: ['0008']
delivery: epic
---

## Goal

The rest of story 5, after the user tries braid 0008: `braid facts <pr>` (the stop-case diff facts, each with the case it points to), `braid recap <id>` (a draft recap and braid log line from report.md and the PR), and `braid merge <pr> --head <sha>` (merge on request: refuses if the head moved, then `gh pr merge --merge --match-head-commit`).

## Working at the end

The coordinator gets the facts, drafts its recap and merges with one command each.

## Strands

- A. Spike: who marks an item Done (done; user chose option C).
- B. Board: closed PRs and merged strand branches (S).
- C. `braid done <id> [--head <sha>] [--merge]`, the only merge command; the skills follow (L).
- D. `braid facts` and `braid recap`; the skills call them (M).
## Open questions

- Auto mode's checks in `braid merge` (user, 2026-11-14: later, when unattended runs are wanted). Most are deterministic reads (CI checks, mergeable, base branch, the strand Done with boxes ticked, `ask:` labels, the diff facts, the pinned head); "the worker reported green" and "the review found nothing blocking" are the coordinator's judgments, passed in or read from the reviewer's PR comment.
- What the user learned trying 0008.

Plan it fully when its turn comes, asking the user if needed.
