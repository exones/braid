# 0077/E: The programme card counts every live braid as running

## What changed

- The programme card's "N running" (`runs()` in `src/board/programme.ts`) counts a braid that is started and not Done, with any of: an agent running, checks pending, its coordinator running, its coordinator idle and neither failed, in error nor archived, or the PM handling one of its requests (open, not forwarded to you).
- "Dead" uses the same thread states as a gone PM (`GONE` in `src/board/pm.ts`: `archived`, `failed`, `error`, `errored`).
- The programme's stall keeps the old test (`busy()`: an agent, a running coordinator or pending checks).
- Tests: one in `test/programmes.test.ts` covering running, idle on a PR, failed, error, archived, no coordinator, Done, not started, PM handling (with none and with a failed one), forwarded, and the stall next to a waiting coordinator.

## Why

The card showed only the braids whose coordinator was running that minute (idea 2026-11-25-1r0o: "2 running" with five braids in progress).

## Deviation from the brief

The brief counts a braid whose plan row says `running`. The plan row's state is not read (the coordinator's decision, 2026-11-26): "the PM is handling it" means an open request of the braid the PM handles now. Every launched row says `running`, so reading it would count dead braids, against the user's rule that dead means a failed or archived coordinator, or none.

## Decided

- The stall is not widened with the count: with idle coordinators counting there, a stopped PM whose braids all wait would never read stalled or be nudged. So a card can read "2 running" while its stall says "none of its braids is running".
- A braid that reads To Do is not started, so a leftover idle coordinator or a request there doesn't count.

## The merge of origin/main (0072), commit 0a5a2d8c

Conflicts and how they were resolved:

- `src/board/wake.ts`: 0072's answer wake runs on 0077/B's asynchronous paths: the record is read with `loadRecordAsync` (also right before each send), a met request ends with `endRequestAsync`, and an answer is marked woken with the new `markAnswerWokenAsync`. `braid:` conditions still use `braidsDoneOn`.
- `src/braids/requests.ts`: both sides kept: `writeRecordAsync` (B) and `newRecord` with `words` (0072). `markAnswerWoken` is now one change with a sync and an async driver, like the other writes, so it goes through H's fast-import writer too.
- `src/board/remind.ts`: asynchronous calls with 0072's `handleOf`.
- `test/board-promote.test.ts`: 0077's reader type (no `ttlMs`) with 0072's `noSignals`.
- `docs/decisions.md`: both sides kept (`D-gate-slots`, then D110–D116); no number is used twice.

## Validation

- Gate (`node dist/cli.js gate`) on the merge: passed, 794 tests, 793 pass, 1 skipped (about 17 min). `test/board-async.test.ts` is in it and green.
- Gate with E: passed, 795 tests, 794 pass, 1 skipped (about 23 min).
- Not checked live on a running board; the count is covered by tests on the derivation.

## Docs

`docs/board.md`, "Programmes": the done bar's "running" and a new "N running" paragraph. No other doc or help text is affected.

## For later items

- The stall's words "none of its braids is running" now use "running" in a narrower sense than the card's count. A later UI pass could say "no braid is working".

Needs the user: none
