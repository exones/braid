# 0029 report

## What changed

1. **Fewer Git processes behind `braid list --open`, `braid view --links` and `braid check`** (leftover 2026-11-18-hr41).
   - Already covered by 0028: `loadLiveBraidsAsync` (board only) with one `git cat-file --batch` for the blobs. The synchronous readers these three commands use (`loadLiveBraids`, `loadKnownBraids`) still ran one `merge-base` per branch tip and one `cat-file blob` per brief.
   - `src/braids/gitio.ts`: 0028's batch output parser is now shared (`parseBatch`) by `catBatch` and a new synchronous `catBatchSync`. There is no second reader.
   - `src/braids/branches.ts`: the merge checks are one `git for-each-ref --merged=<HEAD>` over the braid and strand refs, one over the `plan/` refs, and one per braid branch tip for its strands (`markMerged`; the answers fill the existing `inHead` cache, which still falls back to `merge-base` if that call fails). Every `brief.md` of the branches read comes through one `cat-file --batch` (`prefetchBriefs`). The board's async prefetch uses the same `for-each-ref --merged` call.
   - `ls-tree -r` of `braids/` per branch stays: profiling showed three calls of about 50 ms each (46 KB), so splitting it into per-folder calls would add processes, not save time.
2. **`docs/cli.md`** (leftover r8xz) now lists `braid list [--open]`, `braid view <id> [--links]`, `--related` on `braid new` and `braid edit`, plus examples for `--open` and `--links`. `docs/braids-format.md` no longer says `--links` takes a few seconds.
3. **Brief template** (leftover 6pyw): the `related` line only points at the skill's "Plan" step 3 and says each link gets a line under "Already decided".
4. **Version** (leftover 5an0): `package.json` and `package-lock.json` are 0.2.0 (minor, since the `related` key is a format change an older CLI rejects); `docs/npm-distribution.md` says "This source is 0.2.0". Nothing is published; `scripts/Publish-Npm.ps1` still refuses anything but 0.1.0.

## Profile (this repository, 137 remote branches, Windows)

Git processes per command, measured with the `spyOnGit` observer, and in-process time; CLI wall time is the average of three runs of `node dist/cli.js`.

| Command | Before | After |
| --- | --- | --- |
| `braid list --open --no-fetch` | 90 processes (81 `merge-base`, 3 `ls-tree`, 2 `cat-file`, 2 `for-each-ref`, 2 `rev-parse`); 5.3 s | 10 processes (4 `for-each-ref`, 3 `ls-tree`, 1 `cat-file --batch`, 2 `rev-parse`); 1.0 s |
| `braid view 0029 --links` | 92 processes (81 `merge-base`); 5.9 s | 13 processes (6 `for-each-ref`, 3 `ls-tree`, 1 `cat-file --batch`, 3 `rev-parse`); 1.2 s |
| `braid check` (with a `related` in one brief) | 90 processes; 6.1 s | 10 processes; 0.9 s |

`braid check` with no `related` in any brief runs no Git, before and after. The output of all three commands is byte-identical before and after on this repository.

## Validation

- `npm run verify` passes.
- The tests of 0027 (`test/open.test.ts`, `test/branches.test.ts`, `test/braids.test.ts`) and 0028 (`test/board-cheaper-reads.test.ts`) pass unchanged.
- New test in `test/board-cheaper-reads.test.ts`: `loadKnownBraids` over a braid branch, a strand merged into it, a live strand, a braid merged into main and a `plan/` branch runs no `merge-base` and one `cat-file --batch` per kind of branch, with the expected copies.

## Open

- Keeping the version honest on future format changes (proposal, not built): give the CLI a format version (a constant next to the front-matter key list, printed by `braid --version` as `braid 0.2.0 (format 2)`), with a test that fails when the set of known keys changes without that constant changing; the change that bumps it also bumps the package minor version. `scripts/Install-Skills.ps1` could then record the format version in its stamp and warn when the installed skills expect a newer one. A rule in `AGENTS.md` alone ("bump the version with a format change") would be the light option.

For later items: `docs/cli.md` still lacks `braid title`, which `braid help` lists (not one of the four leftovers, so not added here).
Needs the user: none
