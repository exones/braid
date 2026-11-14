## What changed
- `braid status <number>`: one line per braid and strand with stored status, live lane and reason, branch (local/pushed), PR, each `ci` check from BRAID.md (passing/failing/pending), T3 thread; `note:` lines when GitHub or T3 can't be read; last line says how fresh remote branches are (FETCH_HEAD time; no fetch).
- `braid next <number>`: first stored-`To Do` strand in run order with Done dependencies, no running agent, no open PR, no pushed branch; Outline never picked; otherwise lists why each unfinished strand isn't ready, or says all are done.
- `numbers.ts`: history is read with `--branches --remotes` instead of `--all`, so T3 checkpoint refs no longer take numbers or letters.
- `PullRequest.runs` added in `src/board/github.ts` (per-check results).
- Help, `docs/braids-format.md`, README updated.

## Why
The coordinator replaces `braid view` + `git branch -r` + `gh pr list/checks` + T3 by hand with two commands.

## Validation
`npm run verify` passes; new `test/coordinate.test.ts` (gh and t3 stubbed: lanes, checks, thread, unreadable GH/T3, dependencies, Outline, PR, pushed branch, running, all done, usage) and a numbers test with a `refs/t3` ref in `test/edit.test.ts`.

## Open
Dependencies on other braids (e.g. `0007`) count as met when that item's lane is Done. Tags no longer count towards taken numbers (brief asked for branches and remote branches only).

For later items: `braid status`/`next` are async (T3 read) and handled in `main()` of `src/cli.ts`, not in `run()`; `coordinate.ts` exports `ciChecks`, `statusCommand`, `nextCommand` for 0008/B and C to reuse. Board JSON PRs now carry `runs`.
Needs the user: none
