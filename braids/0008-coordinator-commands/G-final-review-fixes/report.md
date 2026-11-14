# 0008/G report

**What changed:** two CLI tests in `test/coordinate.test.ts` (`braid next` with a stored-Done strand that has an open PR; `braid status` printing `ask:<key>` after the lane). D40 now says an `ask:<key>` label is a flag only. workflow.md says a strand whose PR waits for merge shows To Review (Needs You on failing checks), not Done. docs/braids-format.md and `braid help` show `ask:<key>` after the lane and `clean [<number>|<id>]`. 0008/F's report box is ticked.

**Why:** the final review of PR #84 found the docs and help behind the lane rules 0008/F changed.

**Validation:** `npm run verify`; coordinate tests 10/10.

**Open:** CI on the PR.

For later items: none
Needs the user: none
