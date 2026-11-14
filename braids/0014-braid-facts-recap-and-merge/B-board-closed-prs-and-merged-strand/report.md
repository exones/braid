# 0014/B report: board, closed PRs and merged strand branches

## What changed

- `src/board/github.ts`: a PR closed without merging is kept (`state: "closed"`, cached like merged ones, dropped if it reopens). Priority per item: open, then merged, then closed.
- `src/board/model.ts` (`derive`): a stored `Done` next to a closed, unmerged PR doesn't count as Done. **It reads as To Do**: the state before `Done` isn't recorded, so the safe reading is "not started". Other stored states are unchanged; the closed PR still shows on the card.
- `src/braids/branches.ts`: a strand branch whose commit is an ancestor of its braid branch's tip is skipped, so the braid branch's copy wins from `main` and in `braid status`.
- Tests: `test/github.test.ts` (closed PR never Done, merged beats closed, closed cache and reopen), `test/branches.test.ts` (merged strand branch doesn't override the braid branch).
- Docs: `docs/board.md` (rule 1, GitHub cache), `docs/braids-format.md` (Branches).

## Why

Spike 0014/A follow-ups 2 and 3, which `braid done` (0014/C) relies on.

## Validation

`npm run verify` passes locally (115 tests, build, checks). CI pending at report time.

## Open

A closed PR with an agent thread and no other PR is no longer "agent stopped" only if the PR is missing; a closed PR counts as a PR there (unchanged from before for open/merged).

For later items: `PullRequest.state` gained `"closed"`; `braid status`/coordinate print it as `#N closed`. Otherwise none.
Needs the user: none
