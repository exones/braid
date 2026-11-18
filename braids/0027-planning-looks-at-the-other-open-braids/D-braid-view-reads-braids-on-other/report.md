# 0027/D report

## What changed

- `braid view <id>` (braid or strand) now shows the copy `braid list --open` shows: the working tree's, unless a braid, strand or `plan/` branch not merged into HEAD holds a newer one. When the copy comes from a branch, `Read from: <branch>` follows the fields (after `Order`/`Delivery`, before `Folder`). A braid that lives only on its braid or `plan/` branch no longer fails with `no braid <n>`.
- `src/braids/branches.ts`: `braidBranches`, `loadLiveBraids` and `loadKnownBraids` take an optional braid number. With it, `for-each-ref` lists only `braid/<n>-*` and `braid/<n>/*` (local and on any remote), so Git reads happen only for that braid's refs; the `plan/` branches are listed and read only when neither the working tree nor a braid branch has the braid (a `plan/` copy never overrides another source anyway). Winner and HEAD rules are the same code as `braid list --open`.
- `src/commands/braids.ts`: `viewItem` loads through `loadKnownBraids(root, number)`. `--links` is unchanged. Writers (`braid edit`, `brief`, `log`, `report`) still read only the working tree.
- Docs: Plan step 3 of the braid skill says `braid view` reads the brief where it lives; step 5 names `related` among the template's fields; `docs/braids-format.md` `braid view` entry; D61 notes that `braid view` reads the live copy.

## Why

The Look-around step (0027/C) reads overlapping braids with `braid view`, and those braids mostly live on their branches: from `main` the command failed or showed a stale copy (final review of PR #148).

## Validation

- `test/open.test.ts`: the old "braid view reads the working tree" assertion is reversed (0003 shows `Read from: braid/0003-b` and its `Related`), and a new test covers a braid only on a braid branch, one only on a local `plan/` branch, a working-tree braid with a newer copy on its branch (branch body and `Read from:`), a strand only on its strand branch, a working-tree strand whose braid branch carries it, and the braid branch merged into HEAD (working-tree copy, no `Read from:`).
- Timings on this repository (190 refs; Windows, one run each, `Measure-Command`):

  | `braid view` | before | after |
  |---|---|---|
  | 0027 | 296 ms | 589 ms |
  | 0027/D | 265 ms | 593 ms |
  | 0025 (only on its branch) | 296 ms (`no braid 0025`) | 510 ms |
  | 0012 | 262 ms | 608 ms |

  About 0.3 s more, for the branch reads of one braid number; well under a second.
- `npm run verify` passes.

## Open

- Strand A of a braid shows `Read from: braid/<n>-<slug>` when the braid branch carries it, even if its text equals the working tree's: that is the `braid list --open` rule (a braid branch not merged into HEAD supplies its strands' copies), kept as is.

For later items: none.
Needs the user: none.
