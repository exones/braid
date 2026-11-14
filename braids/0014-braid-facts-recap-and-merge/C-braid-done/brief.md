---
id: '0014/C'
title: "braid done"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: ['0014/B']
order: 20
---

## Goal

The coordinator, not the worker, marks an item Done, with one checked command (user, 2026-11-14: option C of spike 0014/A; `braid done` is the only merge command for now, no `braid merge`).

Expected size: about 400 to 700 lines with tests, plus skill and doc changes.

## Start here

- `braids/0014-braid-facts-recap-and-merge/A-spike-who-marks-an-item-done/report.md`: the recommendation, the case table and follow-ups 1 and 4.
- `src/commands/coordinate.ts` (`status`, `next`, `ciChecks`), `src/commands/start.ts`, `src/board/github.ts`.
- `.agents/skills/braid/SKILL.md` (Accept and hand over, Merge on request, Auto mode, Finish), `references/workflow.md`, `assets/brief.md`, `.agents/skills/braid-worker/SKILL.md`.

## Change

- `braid done <id> [--head <sha>] [--merge]`, as the report recommends:
  - strand with an open PR and `--merge`: checks the base is the braid branch, the head is `<sha>`, the `ci` checks are green on it, mergeable, the boxes ticked, `report.md` present and no worker thread running; merges with `--match-head-commit <sha>`; then marks Done.
  - strand whose PR is merged (any way): on the braid branch in the coordinator's worktree, pulls, sets Done, commits `docs(braids): <id> done` (with the braid log entry from `--log -` if given), pushes.
  - story or the braid's final PR, open: the same checks, then a status-only commit on its branch, pushed; prints the new head for the recap; `--merge` (on request) waits for green and merges that head.
  - already Done: says so, changes nothing. Every refusal names the failed condition.
- `braid status`: for "merged, stored not Done", print `run braid done <id>`.
- Skills: the worker no longer sets Done and makes no commit after green; it stops at PR open, CI green, report written. The "CI green" box goes from the brief template. The coordinator calls `braid done` in "Accept and hand over", "Merge on request", "Auto mode" (condition 2 reworded) and "Finish".
- `docs/decisions.md` (a new decision), `docs/board.md` rule 1, `docs/braids-format.md`, `braid help`.
- Tests with `gh` stubbed and temporary repositories.

## Already decided

- Option C; only `braid done`, no `braid merge`; no new stored status (an open PR reads as In Review).

## Acceptance

- [ ] braid done merges only the reviewed, green head and marks Done in the right place for a strand, a story and a final PR, refusing with the failed condition otherwise, covered by tests
- [ ] The skills and template follow: workers don't set Done, the coordinator runs braid done
- [ ] braid status hints at braid done for merged items not yet Done
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
