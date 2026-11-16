---
id: '0015/F'
title: "Fixes from the reviews"
status: In Progress
labels: ["kind:story", "tier:S", "ask:process"]
dependencies: ['0015/E']
order: 60
---

## Goal

The points left by the reviews of 0015/D, 0015/E and the final PR #100 are fixed before 0015 merges into `main` (user, 2026-11-16).

Expected size: about 60 to 120 lines in 8 files, with tests.

## Start here

- Review comments: PR #98 (E), PR #100 (final, https://github.com/exones/braid/pull/100#issuecomment-6919852281); `../D-board-lanes-from-requests-and-broke/report.md`.
- `.agents/skills/braid/SKILL.md`, `.agents/skills/braid/references/workflow.md`, `docs/board.md`, `src/board/model.ts` (wrap-up `toCard`), `src/commands/start.ts`, `src/board/t3.ts`.

## Change

Skills (the user asked for these in 0015's plan):

1. `braid/SKILL.md` story path: "hand over that head" names `braid handover`.
2. The three `braid ask` short forms (`--kind decision`, `--key scope`, `--key <case>`) include the required `"<what is needed>"` text.
3. Planning PR: the plan request stays open until the planning PR merges (or say `braid ask` for that merge), so the wait for the user's merge is covered.
4. `workflow.md` failure table names `braid ask` / `braid handover` instead of "ask the user".

Code and docs:

5. `docs/board.md` "Lanes": a braid with strands is not Done when every strand is; with its final PR open it reads To Review (or Working), Done after the merge. Also "Everything else is Working" ignores To Do.
6. The braid card in wrap-up (every strand Done, final PR open) shows the checks spinner while its PR's checks run.
7. `braid start <n> --review` accepts a braid with strands when its own (final) PR is open, making `<repo>/<n>-review`; `braid clean` removes it.
8. In wrap-up, the braid's card counts reviewer threads (`<n>-review`) as its agents (review activity, and they hold back "checks failed"); the coordinator still never counts.

## Out of scope

- Any other skill cleanup (0003). Words: the skills grow by at most 30 words.

## Acceptance

- [x] Points 1 to 4 done in the skills; word counts before and after in the report
- [x] Points 5 to 8 done, 6 to 8 covered by tests
- [x] `braid start 0015 --review` works on a braid with an open final PR

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Skill edits 1–4 in place; `toCard` wrap-up passes the braid's reviewer threads to its own derive (activity, running, held-back alarm); `startReview` allows a braid with strands when its own PR is open (clean already handled `<n>-review`); docs/board.md and braids-format.md; tests in lanes and start.
