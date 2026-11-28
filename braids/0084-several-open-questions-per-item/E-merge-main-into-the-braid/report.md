---
id: '0084/E'
---

# 0084/E: Merge main into the braid

## What changed

`origin/main` at 397b2431 (with 0077, The board stays fast under load) is merged into the braid as 24d9eb9c, so 0084/C builds on the board's asynchronous reads and request-record writes. Nothing beyond the merge and its two conflicts changed.

## Conflicts

- **`docs/decisions.md`**: both sides added rows after D120. Both are kept: D121 and D122 (this braid), then D-board-async and D-running-count (0077). `main`'s two have slug IDs, so no number is used twice and none was renumbered.
- **`test/requests.test.ts`** (the imports): the line is now `main`'s without `handleOf`, and the `resetT3Memory` import is gone. 0077 removed `resetT3Memory` from `src/board/t3.ts`, and 0084/A removed the file's only use of `handleOf`. The brief expected both to stay; neither has anything left to import or use.

## 0084/A's rule

It survived 0077's change to the record writes. `openRequest` still withdraws only what `replaces` picks: a wait to the same braid (a timed wait being one to `self`) or an earlier `review`. A question withdraws nothing.

## Validation

- `npm run verify` on c7cca4dd: exit 0; 859 tests, 858 passed, 1 skipped, 0 failed; the tests took 14 minutes.
- `test/requests-several.test.ts`, `test/requests-record.test.ts` and `test/requests.test.ts` run together: 46 of 46.
- An earlier full run, with the machine loaded by other gates, had 856 passed and 2 failed on timing; both passed run alone and in the final run:
  - `test/inbox.test.ts` "the first note creates braid-inbox as its own history and pushes it": expected age `0m`, got `1m`.
  - `test/requests.test.ts` "the board's asynchronous wait outlasts a moving lock queue too": `q is locked` after its 2 s wait.
- Two further runs were killed unfinished, for the holds around a machine restart.

## Docs

Only the merge: no behaviour beyond what each side already documented.

Decisions: no decision renumbered, since `main`'s new ones have slug IDs; dropped both conflicting imports as dead.
For later items: 0084/C: `src/braids/requests.ts` now has asynchronous forms of the record's load and writes for the board (`loadRecordAsync`, `endRequestAsync`, `addEventAsync`, `markAnswerWokenAsync`); `resetT3Memory` no longer exists. Gap: the two timing tests above can fail on a loaded machine (an age asserted as `0m`; a 2 s lock wait).
Needs the user: none
