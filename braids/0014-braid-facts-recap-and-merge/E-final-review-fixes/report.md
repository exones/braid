# Report: 0014/E final review fixes

## What changed

- `braid recap` draft has a `**Screenshots:**` line: an `<edit: ...>` placeholder for `ui` items, `none` otherwise.
- The drafted braid log line follows the `assets/brief.md` template (`<id> merged: PR #<n>, <sha>. Done: ... For later items: ... Plan changes: ... User decided: ...`), with `<edit: ...>` for what it can't know.
- `idOfBranch` dropped; `keyOfBranch` from `src/board/github.ts` is reused.
- Needs the user keeps the full case name (`quality or scope (facts)`).
- `docs/decisions.md`: dated D44 line in the Decision log.

## Validation

`npm run verify` passes (136 tests); new tests cover the Screenshots line (ui and non-ui), the log line shape and the full case name.

For later items: none
Needs the user: none
