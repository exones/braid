# 0027/B report

## What changed

- `related` front-matter key (`src/braids/brief.ts`): a list of braid ids, braids only. A strand that sets it, a strand id, or the braid's own id is a format error. `Brief.related` is empty for strands.
- Writing (`src/braids/write.ts`): `related: ['0025']` after `dependencies`, only when non-empty, so briefs without links keep their exact bytes.
- `braid new --related <ids>` and `braid edit <braid> --related <ids>|none` (`src/commands/edit.ts`): replaces the list like `--dep`, dedupes, normalises `25` to `0025`. An id found in no source is kept, with a warning on stderr.
- `src/braids/branches.ts`: `loadKnownBraids` (every source of 0027/A, Done included); `loadOpenBraids` now filters it. Behaviour of `loadOpenBraids` is unchanged.
- `braid view <braid>` prints `Related: <ids>` (or `none`) from its own brief, with no branch read. `braid view <braid> --links` adds `Linked from:`: the open braids whose `related` names it, with titles, read through the 0027/A sources. A strand refuses `--links`. `braid list --open` prints `  related: <ids>` under a braid with links.
- `braid check` gained warnings (`CheckResult.warnings`): an unknown `related` id prints `warning: <file>: related braid <id> is not ...` on stderr, exit 0.
- Docs: `docs/braids-format.md` (field, the older-CLI failure, options, view/list/check lines); `docs/decisions.md` D61 and its log line.

## Why

A link lives only in the brief that makes it, since the other braid's brief belongs to its own branch; back-links are computed from the 0027/A sources. Unknown ids only warn because the named braid may be on a branch this checkout hasn't fetched. The back-link read costs seconds, so it is opt-in with `--links` (user's verdict on the first version of this PR).

## Validation

- New tests in `test/open.test.ts`: plain `braid view` shows `Related:` and no `Linked from:`; `--links` finds back-links from a braid branch and a `plan/` branch, and a strand refuses it; `list --open` lines, a malformed branch copy skipped; unknown id warns with exit 0; `--related` set/clear/dedupe, strand/self/strand-id refused, `braid new --related`; a brief without `related` is rewritten byte for byte. Parse cases in `test/braids.test.ts`.
- `npm run verify`: 258 tests pass.
- Timings on this repository: `braid view 0027` takes 0.43 s with the installed CLI from before 0027/B and 0.42 s with this branch. `braid view 0027 --links` takes 3.8 s, about what `braid list --open --no-fetch` takes.

## Open

- A braid CLI older than this change fails `braid check` and every read of a brief with `related` (`unknown key: related`). Fix: update the installed CLI before 0027/C's skills start writing links.
- Decision number D61, not D59: the open braid 0012 already uses D59 and D60 on its branch.
For later items: a faster reader of the open braids' briefs (only `brief.md` per braid, fewer Git calls) would bring `braid view --links` and `braid list --open` under a second.
Needs the user: none
