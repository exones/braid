---
id: '0078/B'
title: "The release guard as a small Pester suite"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: []
order: 20
---

## Goal

The release workflow guard keeps its protection with a fraction of the code and no longer runs on every quick verify: test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1 (685 lines with a hand-written YAML reader over .github/workflows/release.yml) becomes a small Pester suite that checks the same release properties, run where release.yml changes or in the full gate. From idea 2026-11-24-l7dw (Fable's review). Tier L: it guards publishing.

Expected size: about 550 lines removed and 150 to 250 added in 3 to 5 files.

## Start here

- `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1`: every property it asserts about release.yml and how.
- `.github/workflows/release.yml`, `scripts/Publish-Npm.ps1`: what the guard protects (OIDC trusted publishing, permissions, triggers).
- `scripts/Verify.ps1`: where the guard runs today.
- `docs/npm-distribution.md`: the documented release rules.

## Change

- List the properties the guard asserts; keep every one that protects publishing (permissions, OIDC, no token, triggers, the job that publishes) as a Pester test, reading the YAML with a small parser or a module already available, not a hand-written reader, if one exists on both CI runners without a new dependency; otherwise keep the smallest reader that does the job.
- Decide where it runs (quick gate, full gate, or when release.yml or Publish-Npm.ps1 change) and say why in the report.

## Already decided

- No change to release.yml, Publish-Npm.ps1 or how releases happen. No publishing, tag or release.
- A new dependency (a PowerShell module or npm package) is a `dependency` stop: ask before adding one.

## Out of scope

- The other harnesses (0078/A). Repository settings.

## Failure modes and regression tests

- A release.yml edit that grants `id-token: write` to the wrong job, adds an npm token, or widens the trigger must still fail the suite: one negative test per protected property, on a modified copy of the workflow.
- A suite that silently passes because it read nothing (file moved, parse failure) must fail: a test for an unreadable workflow.

## Plan

1. Replace the 685-line script with `test/pester/Release-Workflow.Tests.ps1`: a small YAML reader (block maps, sequences, `|` scalars; anything else throws) and one findings function over the parsed workflow, keeping every property the old guard checked.
2. One negative `It` per protected property on an edited copy under TestDrive, the two positive Node.js variants, and throwing cases for a missing, empty, job-less, tab-indented or flow-style workflow.
3. Drop the guard from the quick gate in `scripts/Verify.ps1`; it runs in `verify:full` through `scripts/Test-Pester.ps1`.
4. Update `docs/development.md` and `docs/npm-distribution.md`.

## Completion

- [x] Each property the old guard asserted is either a Pester test or named in report.md with why it was dropped
- [x] Negative tests show the suite fails on each protected property, and on an unreadable workflow
- [x] The old 685-line script is gone and the quick gate no longer runs it
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/development.md, docs/npm-distribution.md), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
