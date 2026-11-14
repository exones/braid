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

- [x] braid done merges only the reviewed, green head and marks Done in the right place for a strand, a story and a final PR, refusing with the failed condition otherwise, covered by tests
- [x] The skills and template follow: workers don't set Done, the coordinator runs braid done
- [x] braid status hints at braid done for merged items not yet Done
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `src/commands/done.ts`: `braid done <id> [--head <sha>] [--merge] [--log <file>|-] [--thread <id>]`. Reads the world as `braid status` does, then the PR in detail with one `gh pr view --json` (base, head branch and commit, mergeable, checks).
   - Shared checks on an open PR ("ready"): base is the braid branch (strand) or `main` (braid); head is `--head`; each `ci` check of BRAID.md passing on it (with `ci: none`, no check failing or pending); mergeable; at the head commit (fetched from `origin`), no unticked box under Acceptance or Definition of done (a box naming CI is exempt: braid done checks CI itself), `report.md` present, and for a goal's final PR every strand stored Done; T3 readable and no running thread for the item.
   - Strand, PR open: needs `--merge` and `--head`; ready, then `gh pr merge --merge --match-head-commit`, then the merged path.
   - Strand, PR merged: this checkout must be on the braid branch with no tracked changes; `git pull --ff-only`, set Done, optional braid log entry, commit `docs(braids): <id> done`, push.
   - Braid (story or final PR), PR open: needs `--head`; ready, then in a temporary detached worktree at the head: set Done (plus the optional log entry), commit, push to the PR branch, print the new head. `--merge`: poll the PR until the `ci` checks pass on the new head (any failure refuses), then merge pinned to it.
   - Already Done (where the stamp would go): says so, changes nothing. A merged braid PR that isn't Done, a closed PR and no PR are refusals; every refusal names the failed condition.
2. `braid status`: `run braid done <id>` after a line whose PR is merged and stored status isn't Done.
3. CLI wiring and `braid help`.
4. Tests (`test/done.test.ts`): temporary repositories with a bare remote, `gh` and T3 stubbed (the merge stub merges in the bare remote).
5. Skills: worker stops at PR open, CI green and report, no Done and no commit after green; template drops the CI box and Done from "Work on it"; coordinator runs `braid done` in Accept and hand over, Merge on request, Auto mode (condition 2) and Finish; workflow "One writer per branch" and the cases table.
6. Docs: `docs/decisions.md` D43 and a log line, `docs/board.md` rule 1, `docs/braids-format.md` command entry and status hint.
