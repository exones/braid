# Report: 0020/B Sweep due in recaps, counts in braid list

## What changed

- `src/inbox/branch.ts`: `openCounts(root)` (open leftovers and ideas from the local refs, no fetch; zeros if unreadable) and `SWEEP_DUE = 3`.
- `braid recap` (and so `braid handover`) ends with `Sweep due: <n> open leftovers` at 3 or more open leftovers; otherwise nothing about the inbox. Never lists entries or ideas.
- `braid list` ends with `Inbox: <open> leftovers, <ideas> ideas`.
- `docs/cli.md`, `docs/braids-format.md` describe both. Existing exact-output list tests got the new line.

## Why

The inbox stays out of the way until a sweep is due; counts cover the whole project.

## Validation

- New tests: list counts before and after a take (`test/inbox-sweep.test.ts`); recap quiet at 2 leftovers plus an idea, `Sweep due: 3 open leftovers` as last line at 3, no entry text (`test/facts.test.ts`).
- `npm run verify` passes (224 tests).

## Open

- With no braids, `braid list` still prints only `No braids.`.

For later items: none
Needs the user: `none`
