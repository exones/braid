---
id: '0014/B'
title: "Board: closed PRs and merged strand branches"
status: In Progress
labels: ["kind:story", "tier:S"]
dependencies: ['0014/A']
order: 10
---

## Goal

Two board bugs found by spike 0014/A, which `braid done` relies on: a PR closed without merging can show Done, and a merged strand's branch left on the remote can override the braid branch's newer copy.

Expected size: about 60 to 150 lines with tests.

## Start here

- `braids/0014-braid-facts-recap-and-merge/A-spike-who-marks-an-item-done/report.md`, follow-ups 2 and 3.
- `src/board/github.ts` (`readGithub` drops closed PRs), `src/board/model.ts` (`derive`), `src/braids/branches.ts` (live copies).

## Change

- Keep closed, unmerged PRs in `readGithub`; a stored Done whose branch copy has a closed, unmerged PR doesn't count as Done (it reads as its stored state before Done would, or To Do if unclear: say which in report.md).
- Skip a strand branch whose commit is already in its braid branch's tip, so the braid branch's copy wins when the board or `braid status` runs from `main`.
- Tests for both; `docs/board.md` and `docs/braids-format.md` ("Branches") updated.

## Out of scope

- `braid done` (0014/C).

## Acceptance

- [ ] A closed, unmerged PR never makes its strand Done, covered by a test
- [ ] A merged strand branch no longer overrides its braid branch's copy, covered by a test
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

1. github.ts: keep closed, unmerged PRs (state "closed"), cached like merged ones until reopened; priority open > merged > closed.
2. model.ts derive: stored Done with a closed PR is not Done; it reads as To Do (earlier stored state is unknown).
3. branches.ts: drop a strand branch whose commit is an ancestor of its braid branch's tip.
4. Tests in github.test.ts and branches.test.ts; update docs/board.md and docs/braids-format.md.
