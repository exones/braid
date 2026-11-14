---
id: '0014/A'
title: "Spike: who marks an item Done"
status: To Do
labels: ["kind:spike", "tier:M"]
dependencies: []
order: 5
---

## Goal

Answer, for the user's decision: should the coordinator, not the worker, mark an item Done, and how? Today the worker sets Done in its last commit inside the PR, before review, and the item stays Done through fix rounds. The user's idea (2026-11-14): the worker stops at something like "ready for review"; only after the review passes, CI is green and the user accepts (or auto mode's conditions hold) does the coordinator stamp Done, for example with `braid done <id> [--merge]`, which checks the conditions, sets Done, commits and optionally merges the PR.

Time box: about 2 to 3 hours. Output: `report.md` only, no code. It feeds 0014's merge strand, where `braid done --merge` would live.

## Start here

- `.agents/skills/braid/SKILL.md` (Run an item, Accept and hand over, Merge on request, Auto mode, Finish, Resuming) and `assets/brief.md` (Work on it): who sets which status when today.
- `src/board/model.ts` (`derive`: an open PR wins over a stored Done, 0008/F), `src/commands/coordinate.ts` (`status`, `next`), `docs/board.md`.
- `braids/0008-coordinator-commands/log-*.md`: how this played out on real strands (Done shown while a PR was still in review).

## Cases to cover

- Where the Done commit lands: on the PR branch (changes the head after review, re-runs CI, breaks "merge exactly the reviewed head", and the coordinator writes to the worker's branch) vs on the braid branch after the merge (clean for strands, but a story's PR goes straight into `main`, so that would mean a commit on `main`).
- Whether strands should store Done at all, or derive it only from the merged PR (the file keeps To Do, In Progress, and maybe a new "Ready" or "In Review").
- Merges that bypass the command: the user merges in GitHub's UI, a squash merge, a PR closed unmerged, a reopened PR.
- Auto mode; a spike or doc item without code; the braid's own final PR; resuming after a crash; how the board, `braid status` and `braid next` read each state.
- What changes for the worker: its last step, the acceptance boxes, the "CI green" tick.

## Change

- `report.md`: a table of the cases above with how each option handles them; two or three options with their trade-offs; a recommendation, marked "research, not decided". No code, no edits to docs or skills.

## Already decided

- The user decides after reading the report; 0014's merge strand then builds the chosen option.

## Acceptance

- [ ] report.md covers every case listed, compares two or three options and recommends one

## Definition of done

- [ ] report.md written: answer, evidence, proposed follow-ups
