A merge the coordinator makes by itself can now be held to the braid's preset, and the `Decided:` lines made under a preset can be listed and land in the recap.

- `braid accept <id> --merge --preset` refuses, naming the preset and its `merge` value, unless the preset allows this PR: `strands` a strand's, `all` also a story's and a braid's final PR, `none` nothing. It also refuses when `ci` in `BRAID.md` is `none`, and `--preset` without `--merge` is a usage error. The check runs first and changes nothing; every other check of `--merge` stays, and `--merge` alone behaves as before (the skills keep calling it until 0040/E).
- `braid decisions <number> [--since <date or sha>]` (new, `src/commands/decisions.ts`) lists the `Decided:` entries of a braid and its strands, oldest first: date, item id, text on one line. A date keeps that day and later; a sha keeps entries after that commit's time. It reads this checkout.
- `braid recap` and `braid handover` print the item's own `Decided:` entries as lines under `Decisions:`; for a braid's final PR (no strand letter) also those of all its strands, read from the logs at the PR head.
- `src/braids/decided.ts` holds the one parser. A `Decided:` line is an ordinary `braid log` entry whose text starts with that word.
- Docs: `docs/cli.md`, `docs/braids-format.md`, `docs/autonomy.md` (new section "What the CLI enforces") and decision D69 in `docs/decisions.md`.

Validation: `test/done.test.ts` (steady merges a strand and refuses a story and a final PR naming `steady` and `strands`; free merges a story; careful refuses a strand; `ci: none` and `--preset` without `--merge` refuse; the existing `--merge` tests pass unchanged), new `test/decisions.test.ts` (parser, ordering, `--since` by date and sha, bad arguments), `test/facts.test.ts` (recap of a final PR with its strands' entries). `npm run verify` passes (326 tests).

Decisions:
- The preset is read as the braid resolves it (brief, else `BRAID.md`, else `careful`); a missing preset refuses the merge.
- `--since <sha>` compares with the commit time, strictly after, at minute resolution like the log headings.
- Under `--preset` the kind of PR is "final" when the braid has strands and the item is the braid, else "story".
- `braid decisions` reads the working tree, so a strand's entries show once its branch is merged into the checkout's branch.

For later items: 0040/E switches the skills to `--merge --preset` and to writing `Decided:` entries through `braid log`.
Needs the user: none
