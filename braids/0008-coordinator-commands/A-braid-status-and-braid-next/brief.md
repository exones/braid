---
id: '0008/A'
title: "braid status and braid next"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 10
---

## Goal

The coordinator sees a braid's whole state, and the next strand to run, from one command each, instead of combining `braid view`, `git branch -r`, `gh pr list`, `gh pr checks` and T3 by hand.

Expected size: about 300 to 500 lines with tests.

## Start here

- `.agents/skills/braid/SKILL.md` ("Resuming", "Run an item") and `references/workflow.md` ("Starting the next item"): the steps these commands replace.
- `src/board/model.ts` (`derive`), `src/board/github.ts`, `src/board/t3.ts`, `src/braids/branches.ts`: the sources, already used by the board.
- `BRAID.md`: the `ci` check names.

## Change

- `braid status <number>`: one line per strand (and the braid): id, stored status, live lane and reason, branch (local, pushed), PR number and state, the `ci` checks from `BRAID.md` (passing, failing, pending), and the T3 thread (running, stopped) when T3 is up. A note when GitHub or T3 can't be read.
- `braid next <number>`: the first strand in run order that is `To Do`, has all dependencies Done, and has no open PR and no pushed branch; prints its id and title, or why none is ready (running, blocked by, all done). `Outline` strands are never picked.
- Fix (found while planning 0008): `src/braids/numbers.ts` counts numbers and letters in `git log --all`, which includes T3's checkpoint refs (`refs/t3/…`), so a draft that only ever lived in a T3 checkpoint takes its number or letter forever. Count only branches and remote-tracking branches (`refs/heads`, `refs/remotes`) plus the working tree; test it.
- Tests with `gh` and `t3` stubbed; `braid help`, `docs/braids-format.md`.

## Already decided

- Plain text; reuse the board's readers; no `git fetch` (say how fresh remote branches are).

## Out of scope

- Changing anything; the skills (0008/E).

## Acceptance

- [ ] `braid status` shows each strand's stored status, live lane, branch, PR, ci checks and thread, covered by tests
- [ ] `braid next` picks the right strand or says why none, covered by tests (dependencies, running, Outline, all done)
- [ ] Numbers and letters ignore refs outside branches and remote branches, covered by a test
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
