# 0073/C report

## What changed

- `ci: all` in BRAID.md (`ciAll` in `coordinate.ts`): every check reported on the commit must pass.
  - `braid wait` answers from the newest commit in its range that has any run, with every check it reports. It exits 1 as soon as all reported ones finished and one failed. It exits 0 only when all passed and a 2-minute start grace has passed since the first check started (`started_at` from GitHub; else since the call first saw them). The grace restarts when a new check appears. Exit 2 is "no check within the 5-minute start limit", as now; exit 3 names the grace when all passed but it has not ended.
  - `braid accept` (also `--merge`), `braid handover` and `braid recap` need at least one reported check and all passed (`checksProblem(..., all)`); none reported is pending, so the existing "only braids/ changed since a green commit" rule can still apply. `--preset` no longer treats `all` as no CI.
- Template and docs say exactly what `[]`, `all`, a list and `none` mean (the old line claimed `[]` was every reported check; it is not for `braid wait`).
- Absorbed leftover 2026-11-23-puxp: `braid clean` keeps a braid's own branch, with a reason line, while its braid is not `Done` on that branch, whatever PR from it merged. Strand branches, stories and reviewer checkouts keep today's rule.

## Validation

`npm run verify` passes (628 tests). New tests: `braid wait` with `ci: all` (green after the grace, one failed, one pending, none reported, a check appearing inside the grace); `braid accept --merge` (none reported, failed, pending, green); `braid recap` (none reported, green); `braid clean` (live braid branch with a merged PR into main is kept, naming why).

## Docs updated

Template line (`.agents/skills/braid/assets/braid-md.md`), `docs/braids-format.md`, `docs/cli.md`, `docs/getting-started.md` (the preset line), help text of `braid wait`, `docs/decisions.md` (D101 and a log line).

## Open

- `braid handover` shares `checksProblem` with `braid accept`; it has no separate test.
- The `ci: all` grace uses the first run's `started_at`, so a fresh short read after CI finished is green at once.

For later items: none.
Needs the user: none.
