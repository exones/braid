# 0026 report

## What changed

- `.github/workflows/ci.yml`: new `Decide fast path` step in the `verify` job (full checkout history, `checks: read` added). The heavy steps (PowerShell/Pester checks, Node, `npm ci`, Verify, upload) run only when `steps.fast.outputs.skip != 'true'`. The check names are unchanged, so both `verify` checks still report on every head.
- The step skips only on `pull_request`, when the whole PR diff (`base...head`) is under `braids/` or `epics/`, or when the action is `synchronize`, the files changed since `github.event.before` are all under those folders, and `before` has a successful check run named `verify (<os>)` (read with `gh api` and the workflow token). It prints why and which commit it relied on.
- `docs/decisions.md`: new D58 and a log line; D49 now says only push CI ignores `braids/`.

## Why

Each status, log, report or planning commit on a PR cost about 6 minutes of CI, and the merge rule waits for green.

## Validation

- `npm run verify` passes locally.
- Code commit runs the full suite: https://github.com/exones/braid/actions/runs/44334945975 (ubuntu 1m40s, windows 6m34s).
- Fallback: the decision runs in `try/catch`; a failing `git diff` (missing `before` commit, force-push), a failing `gh api` call or any exception prints "Full suite: could not decide (...)" and leaves `skip=false`. A non-synchronize action with code changes, and a `before` without a successful check, also run the full suite. Not exercised live; checked by reading the logic.
- Fast path run: FASTRUN

## Open

None.

For later items: none.
Needs the user: none
