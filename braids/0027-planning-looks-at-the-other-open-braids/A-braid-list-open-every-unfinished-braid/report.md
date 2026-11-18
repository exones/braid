**What changed.** `braid list --open` prints one block per braid that is not Done, in number order: id, status, title, `read from: <source>`, the first paragraph of `## Goal` (cut near 300 characters) and the strands as `braid list` shows them. `--no-fetch` skips the fetch; a failed fetch warns on stderr and goes on with local refs. `braid new` ends with `Open braids: <n> (braid list --open)`, the new braid excluded. Plain `braid list` is unchanged. `docs/braids-format.md` describes both; the README lists no `braid list` options.

**How.** `loadOpenBraids` (`src/braids/branches.ts`) is `loadLiveBraids` plus braids found only on local or remote `plan/*` branches not merged into HEAD (newest copy first, a local branch on a tie; a plan copy never overrides another source). `listOpen` and `openBraidsLine` are in `src/commands/braids.ts`.

**Validation.** `test/open.test.ts` uses a fixture repository: Done braid on `main` (hidden), Outline on `main`, a braid only on a braid branch, one only on a local `plan/` branch, plan never overriding a braid branch, a merged plan branch adding nothing, plain `braid list` unchanged, the `braid new` line, a failed fetch. `test/edit.test.ts` strips the new line from its `braid new` expectations. `npm run verify` passes.

**Open.** `read from:` shows `main` for the working tree even when HEAD is another branch, as the brief says.

For later items: none.
Needs the user: none.
