# 0078/P: Request codes never look like braid numbers

## What changed

- `newCode` (`src/braids/requests.ts`) draws again while the four characters hold no letter, so a new code never reads as a braid number. It is exported with an injected random source for the test.
- A request opened before this may have a four-digit code. `q-5732` and its name work as before. Bare `5732` now finds it too (`braid answer`, `withdraw`, `eta`, `requests`), through `digitCode` in `src/commands/requests.ts`, but only when no braid and no request's item has that number; otherwise the digits keep meaning the item.

## Why

About one code in 170 was all digits. Commands given its bare form read it as an item, which failed the tests that open requests at random (CI on PR #396) and would do the same to a user.

## Validation

- `test/request-words.test.ts`: a pinned random source draws four digits, then letters, and the new code is the second draw; an old `q-5732` record is read by `q-5732`, its name, its words and bare; `eta`, `answer` and `withdraw` take it; the digits of an existing braid (`0002`) still mean the braid.
- `test/request-gaps.test.ts`: the test that pinned the old rule (bare `0123` never names `q-0123`) now takes bare `0123`, as no item has that number, and checks that digits matching no request (`0124`) are refused.
- `npm run verify`: passed (876 tests, 875 passed, 1 skipped, 0 failed; docs gate passed). The first run failed only on the old-rule assertion above, which was then updated.

## Docs

`docs/braids-format.md`: the request code and how digits are read. The README, `docs/cli.md` and the help text are still true.

## Open

- The branch is for the braid branch; the coordinator ports it to main.

For later items: 0078/H: D96 in `docs/decisions.md` describes the code as "four lowercase letters or digits"; a new one now also holds at least one letter.
Needs the user: none
