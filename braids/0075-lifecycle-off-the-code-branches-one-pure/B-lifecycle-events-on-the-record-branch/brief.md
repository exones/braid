---
id: '0075/B'
title: "Lifecycle events on the record branch, Done from the merged PR"
status: Done
labels: ["kind:story", "tier:L", "ask:architecture", "ask:data"]
dependencies: []
order: 20
---

## Goal

Bookkeeping never moves a PR head. The lifecycle events (started, accepted at a head) are written to the record branch instead of the code branches, and Done is derived from the merged PR. `braid accept` then commits nothing on a story's or final PR's branch, and the special cases that exist only because the stamp moves heads go away. Briefs, reports and logs stay on the code branches. Old braids (stored `status: In Progress` or `Done`), here and in other projects such as Everix, keep reading right.

Expected size: about 600 lines in 12 files, half of them tests; it should remove more than it adds outside tests.

## Start here

- `docs/braids-format.md` 49-59 (front matter, `status`) and 148-183 (the record branch `braid-requests`); `docs/decisions.md` D96, D97.
- `src/braids/requests.ts` and `src/braids/gitbranch.ts`: how the record is written (`writeBranch`, lock, fetch, fast-forward push, retries), read (`loadRecord`) and migrated (`migrate`). Reuse them; don't write a second writer.
- `src/commands/done.ts`: `stamp`, `stampStrand` (strand: status Done plus the braid log entry on the braid branch after the merge), `stampBranch` (story and final PR: a status-only commit on the PR's own branch, which moves its head), `greenBelow` (126-144, a braids/-only commit inherits green; it exists for that stamp), `ready`.
- `src/board/model.ts` `derive` 386-461: the Done special cases (closed PR with stored Done, `heldReview`, stored Done with no open PR, stored Done counts as waiting, stored Done with an open PR reads "Merge PR #n").
- `src/braids/branches.ts` `winners` 255-266: newest copy of a brief wins; it decides status today.
- `src/commands/wait.ts` 44-66 and `.github/workflows/ci.yml` 27-35, 62-114: the other two copies of "braids-only commits inherit green".
- Inbox 2026-11-24-dsyv (an early PR from a braid into main merged; `braid status` says "run braid accept 0002" and accept refuses), 2026-11-23-k5d1, 2026-11-23-sqck.

## Proposed record shape (settled with the PM at the plan's approval; build what the braid's log says was decided)

- On the existing record branch `braid-requests`, a folder `lifecycle/` beside `requests/`, one file per item: `lifecycle/0075.json`, `lifecycle/0075-A.json` (`/` as `-`). Fields: `id`, and `events`, a list that only grows: `{"kind":"started","at","thread","branch"}` (written by `braid start`), `{"kind":"accepted","at","head","review","thread"}` (written by `braid accept`). Written and merged exactly as requests are (union of events); commit message `docs(record): <id> <kind>`.
- Done is no event: a strand is Done when its PR into the braid branch merged; a story when its PR into `main` merged; a goal when a PR from its braid branch into `main` merged with every strand Done at that head (an early PR such as 0075/A's, with strands still open, doesn't make the braid Done: the dsyv case).
- Reading, per item: the record's events and the PR's state first; the brief's stored `status` as the fallback, so stored `In Progress` and `Done` keep their meaning for old braids. `Outline` and `To Do` stay in the brief.
- Writing: the CLI stops writing `In Progress` and `Done` into briefs. `braid start` writes `started`; `braid accept` writes `accepted` (for a strand it still commits the braid's log entry on the braid branch after the merge, since logs stay). `braid edit --status` keeps working for any status, as a manual override that wins.
- An older CLI reading braids this CLI wrote sees started items as To Do and merged ones by their old stored status; the CLI is one install per machine, so the report says how a user upgrades, and nothing else is done for it.

## Change

- The record: a `lifecycle/` reader and writer on top of `requests.ts`/`gitbranch.ts`.
- `braid start`, `braid accept`: write events; `accept` no longer commits on the PR's branch (story, final PR) and no longer writes `status: Done` (strand); its checks (`ready`) stay.
- Status: one function gives an item's status from record, PR and stored status; `derive` drops the Done special cases that existed for stored Done on an unmerged PR; `winners` no longer decides status.
- "Braids-only commits inherit green": with no stamp on PR heads, `greenBelow` in `done.ts` goes, or `done.ts` and `wait.ts` share one helper; CI (`ci.yml`) is not loosened.
- `braid status`'s "run braid accept <id>" hint: gone where Done is now derived.

## Already decided

- The record branch is `braid-requests` (0070), not a new branch, unless the PM decides otherwise.
- Briefs, reports and logs stay on the code branches.
- The board's lane derivation is restructured in 0075/C; here only the status input and the Done special cases change.

## Failure modes and required regression tests

- Offline or a push race: the event commits locally and is pushed on the next write, as requests are (test: two writers, events unioned).
- An old braid with stored Done and a merged PR, and one with stored Done and no PR at all (merged long ago, branch deleted): Done (fixtures from this repo's `braids/`).
- An old braid with stored In Progress and no `started` event: In Progress.
- A strand merged, never accepted: Done, with no "run braid accept" hint.
- A story's PR merged: Done without any commit after the review; `accept` on an open story PR leaves its head unchanged (test compares heads).
- The dsyv case: an early PR from a braid branch into `main` merged while strands are open: the braid is not Done, and status gives no accept hint the CLI then refuses.
- A record `braid-requests` without `lifecycle/` (every repo today): reads as before.
- A fixture of another project's `braids/` (old format, stored statuses only) reads the same lanes before and after.

## Out of scope

- Moving briefs, reports or logs; the lane function's restructuring (0075/C); skill and docs text (0075/D) beyond `docs/braids-format.md` and the help text this changes.

## Plan

1. `src/braids/lifecycle.ts`: `lifecycle/<item>.json` on `braid-requests` (the shape decided in q-5asx). The record's `BranchSpec` gains the folder `lifecycle` (one spec, one lock and one replay for both folders; its `merge` unions the events of either kind of file); the request reader skips files outside `requests/`. `recordEvent` writes through `writeBranch`; `loadLifecycle` reads like `loadRecord` (local refs, cached by tips).
2. One status function, `statusOf(stored, events, pr)`: Outline stays; a merged PR is Done; a stored Done is Done, except next to a closed PR (To Do) or an open PR (old stamp before the merge: read as accepted at that head, In Progress); a `started` event or stored In Progress is In Progress; else the stored status. `accepted` at the open PR's head marks it waiting for the merge. A goal (braid with strands) is Done when its newest PR into main merged after every strand's Done (strand merged before it, or stored Done): the dsyv case.
3. `toCard` applies it to every item before `derive` (via `Signals.lifecycle`); `derive` drops `heldReview`, the closed-PR mapping, "stored Done counts as waiting" and "stored Done + open PR", and reads an `accepted` flag instead. `braid status` drops the "run braid accept" hint. `braid list/view`, `clean` (braid branch live until Done), `wake` (`braid:<n>` conditions), the board's Done dates and `winners` (no longer decides status) follow the same function.
4. `braid start` writes `started` (optional `--thread`); `braid accept` writes `accepted` and commits nothing on a PR's branch: story/final PR: checks, event, comment, optional merge at the reviewed head; strand: merge, event, and the braid log entry on the braid branch (no `status: Done`). `ready` reads strands' Done from the status function. `greenBelow` goes (no braids/-only stamp commit on PR heads any more); wait.ts keeps its copy as the one definition.
5. Tests per the brief's failure modes; docs: braids-format.md (status, the record), cli.md and the help text; decisions.md entry.

## Completion

- [x] `braid start` and `braid accept` write `started` and `accepted` events to the record branch in the shape the braid's log records as decided; nothing else writes lifecycle into briefs
- [x] `braid accept` on a story's or final PR leaves the PR's head unchanged (test)
- [x] Done of a strand, story and goal comes from the merged PR; the dsyv case reads right (tests)
- [x] Old braids with stored statuses read the same as before, here and in another project's fixture (tests)
- [x] One definition of "braids-only commits inherit green" in the CLI; `derive` has no stored-Done special cases left
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated (at least `docs/braids-format.md` and the help text), or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
