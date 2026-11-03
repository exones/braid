# B: TypeScript foundation and early CI

Status: done. PR #1 passed CI/review and was human-merged as `afc05074a27da2cb1a3c225bc9d42d10f184e504`; see `reports/bootstrap-delivery.md`. Depends on: A. One implementation agent.
Kind: enabler task. Epic: AGENTO-001. Feature: F1, verified manual tracking.
Value: developers can build and verify each subsequent story with the same PowerShell gate locally and in CI.

Storage naming note: `.crew/` below records this item's original assignment. D18 and task N supersede it with `.agento/` in the current candidate.

## Read first

`AGENTS.md`, `docs/decisions.md`, `docs/seed-contract.md`, epic/checkpoint, `reports/A.md`, and `reports/A-review.md`. The corrected contract takes precedence over the worker's original submission report.

## Outcome

Create the smallest buildable package and a verification path used locally and in GitHub Actions, before implementing the ledger.

## Work

1. Inspect existing changes and obtain/use the selected Node 26.x toolchain (`>=26.13.0 <27`); the observed default is Node 24. Prefer an isolated project/session toolchain over replacing the user's system installation. If still not a Git repository, initialize local Git with a main branch; do not overwrite existing configuration or create a remote. Preserve planning files and inspiration.
2. Create one npm package, lockfile, pinned supported toolchain, strict TypeScript/ESM setup, build output, and `agento` executable through the package `bin` entry. Implement help/version and clear failure for unsupported commands.
3. Establish `src/cli`, `src/core`, `src/storage`, and adapters only as needed. Do not create empty frameworks for future stages.
4. Add meaningful CLI/process smoke checks and the chosen test runner. Product tests use TypeScript tooling. Add Pester only if PowerShell behavior merits separate tests.
5. Add `scripts/Verify.ps1`, exposed through `npm run verify`, which invokes typecheck/build/tests and fails on the first failed native command. Use platform-independent paths and explicit argument lists; avoid recursive npm entry points.
6. Prepare Windows/Linux Actions using the pinned Node line, `pwsh`, `npm ci`, and the same verify entry point. Keep checks independent of T3, tailnet access, and registry credentials. Select current supported action revisions and record pins.
7. Add ignores for build artifacts, dependencies, temporary outputs, and `.crew/`. Document local setup. Do not ignore epic evidence.

## Acceptance

- A fresh dependency install builds, tests, and runs help/version.
- Verification failure propagates as a failed process/job; demonstrate with a controlled temporary failure that is removed before completion.
- Workflow files run the same local gate on Windows and Linux. Record actual CI links if the remote exists; otherwise state that only workflow preparation/local checks were possible.
- No ledger, T3 dispatch, registry deployment, publishing, or merge automation is included.

## Output and stop

Write `reports/B.md`, update checkpoint and epic row, and identify C as next. Keep commits/PRs scoped if GitHub setup is available and the task authorizes pushes; do not merge or publish. Do not start C.
