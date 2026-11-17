**What changed.** `braid start <story>` now makes the worktree on the story's existing branch (local or `origin/`, tracking when only the remote has it) when the story is `To Do` with no PR and no worktree; a strand, an open PR, an existing folder, a worktree already on the branch or another status still refuse. Where braid requires green checks on a PR head (`accept`, `accept --merge`, `handover`, `facts`), a head whose `ci` checks are missing or pending now passes when every commit since the newest all-green commit (read with `gh api repos/{owner}/{repo}/commits/<sha>/check-runs`, last 30 commits) changes only files under `braids/`; the output names that commit. A failed check on the head, a code change or a merge commit in between still refuses.

**Why.** The plan pushes a story's branch, so `start` refused and the coordinator built the worktree by hand; status, log and report commits never get CI, so acceptance waited for a run that never came.

**Validation.** `npm run verify` passes (184 tests). New tests: start on a pushed-only and a local-only branch, the refusals; accept with and without `--merge` and handover on a braids-only head, plus code-change and failed-check refusals (fake gh `api`). Docs: `docs/braids-format.md`, `docs/cli.md`, decision D49.

**Open.** `braid facts` applies the rule but prints no note. One test (overlapping writers) failed once under parallel load and passed on rerun.

Decisions: D49 added to decisions.md; the lookback is 30 commits, and a merge commit counts as a code change.
For later items: none
Needs the user: none
