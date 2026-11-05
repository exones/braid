# Lightweight coordinator records gate

The user requested a small direct change in this thread, without a separate PR: `scripts/Test-CoordinatorRecordsGate.ps1` plus the maintained rule. I's worker was explicitly returned to its original PR-proof scope.

## What changed

The new wrapper requires an explicit pre-push comparison base. It checks committed base..HEAD changes, index changes, worktree changes and nonignored untracked paths, including both rename sides. Only paths under `epics/` pass. Outside paths are listed as quoted data and exit2 with a user-review requirement. Git errors fail closed. Successful scope checks invoke the existing offline Markdown/text gate and propagate its exit code. There is no full build/test/pack or network operation.

## Why

Coordinator records do not need the full product gate. The existing Markdown checker already provides links/anchors and tracked-text LF/whitespace validation; a small scope wrapper is enough for this stage. Individual-epic and thread ownership remain outside this guard, as agreed.

## Left for you

No action needed. The two outside-epics setup paths are the script itself and `docs/agile-workflow.md`, explicitly authorized here as a direct exception. Future outside-scope record attempts stop for user review. I continues original work without this helper assignment; its full implementation/CI/artifact requirements remain unchanged.

## Technical record

Usage: `pwsh -NoProfile -File scripts/Test-CoordinatorRecordsGate.ps1 -Base origin/epic/braid-003-worker-skill`. Stage intended new records before checking; the reused Markdown/text checker validates tracked/indexed files. Use the actual remote epic tip before the proposed push as Base; the helper does not fetch or choose it silently.

Nine focused disposable-repository cases passed: records-only Markdown including a filename with spaces (exit0); committed outside change in a clean tree, staged outside, unstaged outside, untracked outside and cross-boundary rename (exit2); broken Markdown link and trailing whitespace (exit1); invalid comparison base fails closed with the native Git error. Temporary fixtures removed after verified temp-root checks. The wrapper also rejected this actual bootstrap change with exactly the script/rule outside paths. Existing Markdown/text gate and scoped whitespace verification run before the direct push; no full suite or independent PR review is claimed for this user-authorized exception.
