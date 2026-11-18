# 0027/B report

## What changed

- `related` front-matter key (`src/braids/brief.ts`): a list of braid ids, braids only. A strand that sets it, a strand id, or the braid's own id is a format error. `Brief.related` is empty for strands.
- Writing (`src/braids/write.ts`): `related: ['0025']` after `dependencies`, only when non-empty, so briefs without links keep their exact bytes.
- `braid new --related <ids>` and `braid edit <braid> --related <ids>|none` (`src/commands/edit.ts`): replaces the list like `--dep`, dedupes, normalises `25` to `0025`. An id found in no source is kept, with a warning on stderr.
- `src/braids/branches.ts`: `loadKnownBraids` (every source of 0027/A, Done included); `loadOpenBraids` now filters it. Behaviour of `loadOpenBraids` is unchanged.
- `braid view <braid>` prints `Related:` (id and title) and `Linked from:` (open braids whose `related` names it), each `none` when empty. `braid list --open` prints `  related: <ids>` under a braid with links.
- `braid check` gained warnings (`CheckResult.warnings`): an unknown `related` id prints `warning: <file>: related braid <id> is not ...` on stderr, exit 0.
- Docs: `docs/braids-format.md` (field, the older-CLI failure, options, view/list/check lines); `docs/decisions.md` D61 and its log line.

## Why

A link lives only in the brief that makes it, since the other braid's brief belongs to its own branch; back-links are computed from the 0027/A sources. Unknown ids only warn because the named braid may be on a branch this checkout hasn't fetched.

## Validation

- New tests in `test/open.test.ts`: back-links from a braid branch and a `plan/` branch, `list --open` lines, a malformed branch copy skipped; unknown id warns with exit 0; `--related` set/clear/dedupe, strand/self/strand-id refused, `braid new --related`; a brief without `related` is rewritten byte for byte. Parse cases in `test/braids.test.ts`.
- `npm run verify`: 258 tests pass.

## Open

- A braid CLI older than this change fails `braid check` and every read of a brief with `related` (`unknown key: related`). Fix: update the installed CLI before 0027/C's skills start writing links.
- Decision number D61, not D59: the open braid 0012 already uses D59 and D60 on its branch.
- `braid view` on a braid now runs the Git reads of `braid list --open` (no fetch) for `Linked from:`: on this repository `braid view 0027` went from about 0.4 s to 3.4 s, the same as `braid list --open --no-fetch`. A strand's view is unchanged.

For later items: a faster reader of the open braids' briefs (only `brief.md` per braid, fewer Git calls) would bring `braid view` and `braid list --open` back under a second.
Needs the user: none
