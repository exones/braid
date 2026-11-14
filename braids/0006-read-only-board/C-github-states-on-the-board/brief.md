---
id: '0006/C'
title: "GitHub states on the board"
status: Done
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0006/B']
order: 30
---

Goal: the board shows what GitHub knows: a strand's PR in review, merged, or with failing checks.

Expected size: about 300 to 500 lines with tests.

Start here (read in this order):
- `archive/backlog/docs/doc-3 - TASK-2.2-report-the-boards-path.md`: derived states and their cost.

Change:
- One `gh pr list` call per refresh (head branch, state, checks); merged PRs cached.
- Open PR from a strand's branch → In Review; merged → Done; failing checks with no agent working → Waiting, reason "checks failed" (until TASK-6.4 knows about agents, treat failing checks as Waiting); an `ask:<key>` label on the strand → Waiting with that key.
- The braid page's details list also shows which branch the item's state came from (`/api/item` already has `branch`; the user approved this one line).
- The card links to its PR. Without `gh` or offline, the board says so and falls back to stored states.

Already decided (don't re-investigate): the parent TASK-6 and doc-5 (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`). Reuse the reader in `src/braids/` (`loadBraids`, `parseBrief`). Node.js 26, strict TypeScript, ESM; Windows and Ubuntu.

Out of scope: T3 (TASK-6.4).

## Acceptance

- [x] An open, merged and failing PR each put the strand in the right lane, covered by tests with gh output stubbed
- [x] An ask:<key> label shows Waiting with its key
- [x] Without gh the board still works and says why states are missing
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. src/board/github.ts: one `gh pr list --state all` per refresh (open-only after the first when no open PR vanished; merged PRs cached), PRs keyed by braid/strand number from head branch; checks from statusCheckRollup; gh missing/failing gives an "unavailable" note instead of an error.
