# 0009 Board actions: report

## What changed

The board can act, locally, behind a per-run session token:

- **Write path (0009/B, #117).** `POST /api/action/<name>` with a token made per run, passed in the URL fragment and sent as `x-braid-token`; `Host` and `Origin` checks; 64 KB body limit. D50.
- **Open thread (0009/C, #118).** A small icon button on cards and strand rows whose item has a running agent thread, and on a braid card for its running coordinator.
- **Merge on request (0009/C, #118).** The board never merges. After a confirmation (PR, head commit, target branch, checks) it sends the coordinator that handed the PR over `Merge #<n> at <head>, from the board.`; the braid skill's "Merge on request" treats that as the user's "merge it" for that head. D51. Also a lane fix: a braid In Progress, or with a strand Done, shows Working instead of To Do.
- **Start (0009/D, #119).** On a To Do braid card, Start launches a new coordinator thread with `t3 thread start`, with no model flags (the project default, Opus 5.5 medium). A planned braid starts on `coordinator/<n>-<slug>` and is told to resume and switch to the braid branch; an unplanned one starts on `plan/<slug>` from `main`. The card warns after the launch when the thread's provider or model differ from `BRAID.md`; Start is disabled with `Start: <reason>` when T3 is unreachable, the braid isn't To Do or a coordinator runs. `BRAID.md`'s coordinator effort is now medium. D52.
- **Mockups (0009/A, #116)** came first; the user approved them with icon-only buttons.

## Why

Story 6 of the braid plan: acting from the board without switching to a chat, and the base for the phone braid (0012).

## Validation

- `npm run verify` passes on the braid branch with `main` merged in (207 tests), including `test/board-merge.test.ts`, `test/board-start.test.ts` (fake `t3`), `test/lanes.test.ts` and the token and 413 tests.
- CI green on every strand PR and on the braid branch after each merge.
- Each strand had an independent review (grok-4.6, high); none blocking. Screenshots are in `docs/design/board-screenshots/` and the strand reports.

## Decisions

- Start launches a new coordinator thread per braid instead of messaging an existing one; no model flags, the project default is Opus 5.5 medium, and `BRAID.md`'s coordinator becomes effort=medium (High showed no visible advantage).
- Merge from the board only asks the coordinator, after a confirmation; it never merges itself.
- A small Open-thread button belongs in this braid.
- Run in auto mode; mockups approved with icon-only buttons.
- The skill's board case of "Merge on request" is its own sentence, and the lane fix went into 0009/C; the reviewer's wording fix ("your last recap's head isn't the message's … show what changed") was applied before the merge.
- The user merged the two process strands (#118, #119) on request.

## Anything open

- Start has run only against a fake `t3`. The reviewer confirmed the real `t3 thread start --json` shape (`{ threadId, projectId, runId }`) from T3's source; the first real Start is the live check.
- A second Start fails with T3's message if `plan/<slug>` or `coordinator/<n>-<slug>` already exists.
- Screenshots of 0009/C and 0009/D are light only: the app has no dark theme yet.
- For later items: pass the coordinator's settings explicitly once `t3 thread start` has `--option` (T3 nightly); starting a single strand from the board.
