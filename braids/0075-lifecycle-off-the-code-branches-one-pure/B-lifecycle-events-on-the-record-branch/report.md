# 0075/B report: lifecycle events on the record branch, Done from the merged PR

## What changed

- **The record (the user's shape, q-5asx "a").** `src/braids/lifecycle.ts` keeps `lifecycle/<item>.json` (`0075-A.json` for `0075/A`) on `braid-requests` beside `requests/`: `{ "id", "events": [...] }`, where `events` only grows, `{"kind":"started","at","thread","branch"}` from `braid start` and `{"kind":"accepted","at","head","review","thread"}` from `braid accept`, with commit messages `docs(record): <id> <kind>`. There is no second writer: the record's one `BranchSpec` (`REQUESTS`) now covers both folders, so lock, fetch, fast-forward push, offline replay and the event-union merge are shared. The request reader skips files outside `requests/`.
- **One status function.** `statusOf(stored, events, pr)`, with `braidStatuses` and `withStatuses` per braid, works like this: `Outline` stays; a merged PR is Done; a stored Done is Done, except next to a closed PR (To Do) or an open PR (an older CLI's stamp before the merge, read as accepted at that head); an `accepted` event at the open PR's head waits for the merge; a `started` event or a stored In Progress is In Progress; otherwise the stored status. A braid with strands is Done only when its PR into main merged no earlier than every strand's merge (`goalMerged`), so the dsyv case reads In Progress. Every reader uses it: the board (`toCard`, so `braid status`, `braid start`'s ready check and the accept and clean checks), `braid list` and `braid view` (with a lighter PR-state read), `braid clean`, a request's `braid:<n>` condition (`wake.ts`), the board's steering filter, and the Done date (the PR's `mergedAt` when no stored Done exists).
- **`braid accept`** commits nothing on a PR's branch. For a story or final PR it runs the checks (`ready`, unchanged except that strands' Done now comes from the status function), runs the merge gate, records `accepted` at the reviewed head, posts the comment and, with `--merge`, merges that same head. `stampBranch`, the temporary worktree and the 30-minute `waitGreen` poll are gone. For a strand it merges if asked, records `accepted`, and only with `--log` commits the braid log entry on the braid branch (`docs(braids): <id> accepted`). It no longer writes `status: Done`. `--log` on a story or final PR is refused. A merged story or final PR answers "is Done; nothing changed", and an early braid PR merged with strands open is refused, naming the open strands.
- **`braid start [--thread <id>]`** records `started`.
- **`derive`** takes the status from the status function plus an `accepted` flag. The stored-Done special cases are gone: closed PR → To Do, `heldReview`, stored Done counted as waiting, and stored Done next to an open PR reading "Merge PR #n" (now an `accepted` event at the PR's head). For a braid with strands, a merged PR that isn't the braid's merge doesn't count in the braid's own checks.
- **`braid status`** no longer prints `run braid accept <id>`.
- **"Braids-only commits inherit green"** now has one definition in the CLI: `ciCommit` in `done.ts` (the first-parent walk over `braids/` and `epics/` that `braid wait` used, 50 commits), shared by `braid accept`'s `greenBelow` and `braid wait`. `ci.yml` is unchanged. I kept `greenBelow` instead of removing it, because a worker's report or tick commit on top of green code is still a braids-only head.
- **`winners`** still picks the newest copy of a brief. Its stored status is now only the status function's fallback.

## Why

`braid accept` used to commit the Done stamp on a story's or final PR's branch, which moved the PR's head after review and re-ran CI and reviews for bookkeeping. The early PR from a braid branch (inbox 2026-11-24-dsyv) read as "merged, run braid accept", and accept then refused it. Writing the events to the record branch keeps code heads still, and deriving Done from the merge removes the stamp's special cases.

## Validation

- Gate (`npm run verify`, quick), run in its parts because the whole run takes over 10 minutes. I didn't run the script as one command; each step it runs passed on this branch: docs-gate passed; the OIDC guard passed; `npm run typecheck` passed; `npm run build` passed; `node --test` over every suite in `test/`, in two halves, 312 + 377 = 689 tests, 0 failures (about 4.5 and 9 minutes). All of it was run again on the final code (docs-gate, typecheck, build, both halves of the tests: 0 failures). CI runs the full gate on the PR.
- New tests (`test/lifecycle.test.ts`, 6 tests):
  - `statusOf` table: stored In Progress with no `started` event; stored Done with no PR and with a merged PR; closed PR; old stamp next to an open PR; `started`; merged but never accepted; accepted at the head and after the head moved; Outline.
  - The goal rule: the dsyv early PR, a strand merged after the early PR, the final PR merged after every strand, and a stored-Done strand.
  - The record: `started` and `accepted` written and read back next to a request; a record without `lifecycle/` reads the same; the requests reader reports no problems.
  - Two writers, one offline: events unioned in time order after the replay.
  - Another project's `braids/` fixture (`test/fixtures/old-project`, old format, stored statuses only) gives the lanes it gave before, with and without GitHub.
  - This repository's own `braids/`: every stored Done reads Done with no PRs and with merged PRs, and every stored In Progress reads In Progress.
- Rewritten accept tests (`done.test.ts`, `done-merge.test.ts`):
  - A story's `accept` leaves the PR's head and brief unchanged (the test compares heads), and `--merge` merges exactly the reviewed head.
  - A story merged reads Done in `braid status`.
  - A strand merged in GitHub's UI and never accepted reads Done with no hint.
  - The dsyv case in `braid status` and `accept`.
  - `--log` is refused for a story.
  - The merge gate and refusals record nothing.
- `braid start` writes `started` with the thread and branch (`start.test.ts`). The `lanes`, `pm-requests` (0069/A, rewritten to the accepted flow), `requests`, `start-clean`, `merge-gate` and `board-steer` expectations were adjusted to the new outputs.
- Live on this repository: `braid status 0075` shows `0075  In Progress  Working  … PR #296 merged`, with no accept hint (PR #296 is the early PR that carried 0075/A into main), and 0075/A reads Done.

## Docs

- `docs/braids-format.md`: `status` row, Branches, the new "Lifecycle" section under the request record (shape, rules, override, the record without `lifecycle/`, upgrading), `braid status`, `braid start`, `braid accept` (rewritten), `braid list`, `list --open`, `braid clean`, `braid:<n>` and the "the item is accepted" ending.
- `docs/board.md`: lane rules 1, 4 and 7, and the push list.
- `docs/cli.md`: `start` and `accept` rows.
- Help text in `src/cli.ts`: `start` and `accept`.
- `docs/decisions.md`: D105 and the log line for q-5asx.

## Open

- **Upgrading.** An older braid CLI reading a repository written by this one sees started items by their stored status (usually To Do) and merged items by their old stored status. braid is one install per machine, so update it on every machine that runs agents (`npm install -g @exones/braid`, or the project's install script). The braids-format docs say the same.
- **Size.** About 730 changed lines in `src` (+470/−262 over 16 files) and +517/−115 in tests, against the brief's estimate of about 600 lines in 12 files and fewer source lines than before. The new module is about 200 lines. The status function is also applied in readers the brief didn't list (`list`/`view`, `clean`, `wake`, the steering filter), which keeps them true.
- `braid view` on this repository now takes about 10 s, against 5 s for the installed CLI here: it reads PR states for derived Done (about 2.6 s for `gh pr list` without check rollups). The machine was loaded during these timings.
- C: had a few GB free during the gate (1.9 TB used). One run failed with "No space left on device" and passed on re-run. About 2000 `braid-*` folders are in `%TEMP%`; I left them alone, since other agents' tests may be using them.

For later items:
- 0075/D (skills text): `.agents/skills/braid/SKILL.md` and `references/workflow.md` still describe the Done stamp ("a story's PR … from your own commit on it (`braid accept`)", watching the new head after accept, "commits as `docs(braids): <id> done`", the stamp as the coordinator's one commit on a worker's branch); `references/resuming.md` still names the `run braid accept <id>` hint; `references/autonomy.md` says accept "stamps Done". With this change accept leaves the head as reviewed, so the story flow needs no second watch. `braid start --thread <id>` can be passed by the coordinator.
- 0075/C: a braid with strands still reads Done on the board once every strand is Done, without its final PR (`braidLane`); that is 0075/C's Completion box.
- Idea: `braid edit --status 'To Do'` on a started item can't override the `started` event; if resets matter, a `reset` event would make the override exact.

Needs the user: none
