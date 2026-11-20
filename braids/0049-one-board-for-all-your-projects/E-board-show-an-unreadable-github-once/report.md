# 0049/E report

**What changed:** Unreadable GitHub is now one message in each place. The readiness problem (`not ready: GitHub can't be read (...)`) stays and now carries what the old note said: "until then PRs and checks are missing and lanes come from stored statuses" (`GITHUB_TODO` in `src/braids/readiness.ts`, also used by the demo). The board's header note for GitHub (`web/src/App.tsx`) and `braid status`'s `note: GitHub could not be read` line are gone. The T3 notes and `braid next`'s own note are unchanged. `docs/board.md` and `docs/cli.md` describe the single message.

**Why:** since 0049/A both the readiness problem and the older note showed (leftover 2026-11-20-2odh).

**Validation:** `test/coordinate.test.ts` (status: one GitHub line, with what it hides, no `note: GitHub`) and `test/github.test.ts` (board data: exactly one `github` problem with that text). `npm run typecheck`, `build` and `npm test` pass (396). `npm run verify` stops at its first step, the docs gate, on this machine: starting `node` fails with "filename or extension is too long", before any of my changes matter; the docs gate did not run, so CI is the check for it.

For later items: none.
Needs the user: none.
