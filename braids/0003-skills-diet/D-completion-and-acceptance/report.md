# 0003/D: Completion and acceptance: report

## What changed

- **Briefs:** the template has one box section, `## Completion` (only what the worker can do and prove). `braid accept`'s box check reads `Completion`, and still `Acceptance` and `Definition of done` in old briefs (tested). No old brief was rewritten.
- **`braid accept <id>`** replaces `braid done` with the same checks, `--head`, `--merge`, `--log`, `--thread`, plus `--review <url>`. `braid done` is an alias that prints one line to stderr naming `braid accept` (tested).
- **Review fixes:** a brief with none of the three box sections is refused; every coordinator step that accepts passes `--review <link>`; the PR comment is posted right after the stamp, before the wait for checks; the report template has a Decisions line; the missing-braid error names `braid accept`.
- **Recording:** with `--log` the braid log entry ends with `Accepted: <id> at <head>; review: <link or "reviewed by the coordinator">; coordinator thread <id>.` The same line is posted as a PR comment on every accepted path (tested with a fake gh; a failing comment only warns, a refused accept posts none).
- **Skills and docs:** the worker ticks Completion; the coordinator accepts with `braid accept`; every `braid done` in the skills, README, board doc and format doc became `braid accept` (the decision rows keep the history). The "answer first" rule replaces the loose line in "Talking to the user"; the user's approvals are never boxes (`braid ask --kind decision`, then the log). `docs/braids-format.md` and decision D48 describe it.
- Skills word count (`.agents/skills`, all tracked files): 8623 before, 8661 after (+38, limit +40).

## Why

A worker ticking "Acceptance" looked like it accepted its own work, and a box needing someone else cost a worker round and a CI run to tick.

## Validation

`npm run verify` passes. New tests: Completion and old-section box check, the Accepted line and PR comment (with and without `--review`), no comment on a refusal, a failing comment as a warning, the `braid done` alias hint, a brief with no box section refused and not stamped, the PR comment posted even when the new head's checks then fail.

## Decisions (from the log)

- User, 2026-11-16: section `Completion` (folds Definition of done); `braid done` renamed `braid accept`; the acceptance goes to the log and a PR comment; user approvals go through requests to the log and are summarised here.
- User, 2026-11-16: approved the brief, added the "record the answer first" rule; the `braid done` alias stays.
- Worker: `--review <url>` supplies the review link (nothing finds the reviewer's comment on its own); a failed PR comment warns instead of refusing; the code stays in `src/commands/done.ts`.

## Open

None.

For later items: `braid accept --review` is new; the coordinator's skill passes the reviewer's comment link there. Installed skills in other projects still say `braid done` and keep working through the alias.

Needs the user: process: the PR changes the skills; the user reviews the wording.
