# 0053/A: board fixes

## What changed

- **Push titles.** With the project list, when two listed projects have the same repository name their pushes are titled with the project name (`work-app 0001/B: Needs You`); distinct names keep `<repo> <id>: <lane>`. The wrapper sits in `runBoard` (`src/commands/board.ts`); `src/notify/message.ts` is unchanged. Decision D80, `docs/board.md`.
- **Demo failed read.** `braid board --demo` serves a fourth project, `mail`: its first read works and each later one fails, so it shows its last good snapshot with the dashed card edge, ⚠ tag and the red notes. New screenshots 81 (all projects), 82 (Projects block opened) and 83 (a card's panel) in `docs/design/board-screenshots/`, listed in `docs/board.md`.
- **`close()`.** `Started.close()` now also waits for the server's `close` event (which stops the interval and watchers), failing after 10 s with a clear message.
- **Tests.** Every in-process board test (`board-actions`, `board-cheaper-reads`, `board-inbox`, `board-projects`, `board-snapshot`, `board-tailnet`, `github`, `notify`, `readiness`, `t3`) stops the board with `await close()`.

## Why

Leftovers of 0049 and 0052 (`2026-11-20-rxvh`, `-7pcs`, `-e5gb`, `-ftvw`): indistinguishable pushes across projects, an unseen failed-read state, and a Windows teardown race.

## Validation

- New tests: push repo names with clashing and distinct names (`test/board-projects.test.ts`), the close event, and the four-project demo with `mail`'s failure.
- The hung-read test in board-projects now releases its stuck read, because `close()` waits for reads to end.
- Screenshots taken from `braid board --demo` with Chrome.
- The gate (`npm run verify`) passes; CI status is in the PR.

## Open

- The `mail` failure appears from the second read on (a refresh or 30 s), so a page opened within the first seconds shows `mail` healthy.

For later items: none.
Needs the user: none.
