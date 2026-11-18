---
id: '0026'
title: "Fast CI for braids-only commits"
status: In Progress
labels: ["kind:task", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

Every commit pushed to an open PR runs the full `verify` suite on Windows and Ubuntu, which takes about 6 minutes. That includes commits that change only `braids/`: `braid accept` on a story or a final PR, planning PRs, and log or report commits. The coordinator waits for green before handing over or merging, so each status commit costs about 6 minutes. After this change, the `verify (windows-latest)` and `verify (ubuntu-latest)` checks still report on every PR head. When the code is identical to a commit that was already verified, they pass in well under a minute.

Expected size: about 60 lines in 3 files.

## Start here

- `.github/workflows/ci.yml`: the `verify` job, its triggers (push has `paths-ignore: ['epics/**', 'braids/**']`; pull_request has none) and the comment that explains them.
- `docs/decisions.md`: D43 and D49. D49 says the CI workflow ignores `braids/`. That holds only for push, not for pull_request.
- `scripts/Verify.ps1`: what `verify:full` covers. It doesn't validate `braids/` contents.

## Change

- `.github/workflows/ci.yml`: inside the `verify` job, add an early step that decides whether the run can skip the heavy steps (Pester, Node setup, `npm ci`, Verify, artifact upload). Keep the job and check names unchanged. The step skips only on `pull_request` events, when one of these holds:
  1. Every file in the PR's diff against its base (merge base to head) is under `braids/` or `epics/`.
  2. The event is `synchronize`, every file changed between `github.event.before` and the head is under `braids/` or `epics/`, and `github.event.before` has a successful check run with this job's exact name (`verify (<os>)`), read through the GitHub API with the workflow token.
  Anything else, and any error while deciding (a missing `before` commit, a force-push, an API failure), runs the full suite. The step prints why it skipped or didn't, naming the commit it relied on. Add the permission the API call needs (`checks: read`) and nothing broader. Update the workflow's comment.
- `docs/decisions.md`: a new decision for the fast path and its reason (status commits on PRs cost a full CI run each, and the merge rule waits for green). Fix D49's claim about CI ignoring `braids/`, or mark D49 as superseded where it is wrong.

## Already decided

- The checks keep reporting, and a coordinator still waits for green before handing over or merging. This item changes only how fast a braids-only run turns green. No skill or rule changes.
- `push` CI stays as it is.
- Only `braids/**` and `epics/**` count as braids-only.

## Out of scope

- The braid skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, and the `braid` CLI's own green logic (D49 in code).
- The release workflow.

## Completion

- [x] On this item's own PR, a commit that changes only `braids/` (for example the worker's `report.md` commit) after a green code commit shows both `verify` checks passing via the fast path. Record that run's link and duration in report.md.
- [x] A commit that changes code runs the full suite. This PR's code commits prove it; record the link.
- [x] Any failure while deciding falls back to the full suite. Show it in the step's logic and describe it in report.md.
- [x] docs/decisions.md has the new decision, and D49 is no longer wrong.
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `ci.yml`: add `checks: read`; add a `Decide fast path` step (after checkout, with full history fetch via `fetch-depth: 0`) that sets output `skip`; guard all heavy steps with `if: steps.fast.outputs.skip != 'true'`. Decision in pwsh with git and `gh api` (token via env), any error leaves skip false.
2. `docs/decisions.md`: D58 plus log line; correct D49.
3. Validate on this PR: code commit runs full; later braids-only commit takes the fast path.
