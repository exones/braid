# Report: 0014/E final review fixes

## What changed

- `braid recap` draft has a `**Screenshots:**` line: an `<edit: ...>` placeholder for `ui` items, `none` otherwise.
- The drafted braid log line follows the `assets/brief.md` template (`<id> merged: PR #<n>, <sha>. Done: ... For later items: ... Plan changes: ... User decided: ...`), with `<edit: ...>` for what it can't know.
- `idOfBranch` dropped; `keyOfBranch` from `src/board/github.ts` is reused.
- Needs the user keeps the full case name (`quality or scope (facts)`).
- `docs/decisions.md`: dated D44 line in the Decision log.
- Review fix: `expectedSize` takes the number directly before "lines" (the upper bound of `N to M` / `N-M`), else null; it no longer picks the file count ("about 40 to 80 lines in 4 files" is 80, not 4). The doc comment and `docs/braids-format.md` say so.

## Validation

`npm run verify` passes; tests cover the Screenshots line (ui and non-ui), the log line shape, the full case name and `expectedSize` for ranges, "in K files", "with tests", a plain count and no "lines".

For later items: none
Needs the user: none
