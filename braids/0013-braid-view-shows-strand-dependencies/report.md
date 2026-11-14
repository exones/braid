# Report 0013

**What changed:** strand lines in `braid view <number>` end with `  (needs A, B)` when the strand has dependencies. `braid list` is unchanged. `strandLine` got a `withDeps` flag. One line in docs/braids-format.md.

**Validation:** `npm run verify` passes (85 tests). New test covers no, one and two dependencies and that `list` stays plain; one existing view expectation gained its `(needs 0002/A)`.

For later items: none
Needs the user: none
