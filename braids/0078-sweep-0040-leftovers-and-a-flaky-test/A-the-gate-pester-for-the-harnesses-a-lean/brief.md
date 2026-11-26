---
id: '0078/A'
title: "The gate: Pester for the harnesses, a lean docs gate"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 10
---

## Goal

The quick gate gets lighter and its PowerShell tests follow AGENTS.md: the hand-written harnesses under test/fixtures (docs-gate, install-policy, node-toolchain; the release guard is 0078/B) become Pester 5 suites under test/pester/, and the ~220-line CR and trailing-whitespace byte scanner in scripts/Test-DocsGate.ps1 gives way to something shorter (a tool already in the gate, such as the remark or link check, or a few lines). From idea 2026-11-24-l7dw (Fable's review), routed by the braid brief.

Expected size: large but mechanical; about 1,800 lines removed and 600 to 900 added in 8 to 12 files.

## Start here

- `scripts/Verify.ps1`: what the quick and full gate run, and in which order.
- `scripts/Test-DocsGate.ps1`: the byte scanner and what it guards.
- `test/fixtures/docs-gate/Test-DocsGateNegatives.ps1`, `test/fixtures/install-policy/Test-InstallPolicy.ps1`, `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`: the harnesses to convert.
- `test/pester/*.Tests.ps1` and `scripts/Test-Pester.ps1`: the existing Pester suites and their runner, the pattern to follow.

## Change

- Each harness becomes a `*.Tests.ps1` suite under test/pester/ with the same cases (none dropped without a line in the report saying why), using the fixture data that stays under test/fixtures; the old harness scripts and their calls in Verify.ps1 go.
- The docs gate checks CR and trailing whitespace with less code, the same files and the same failures.

## Already decided

- Behaviour of the gate stays: every check that fails today still fails, on Windows and Ubuntu.
- Keep cross-platform: CI runs both; no Windows-only paths or line-ending assumptions.

## Out of scope

- The release guard (0078/B). Product code under src/.

## Completion

- [x] The docs-gate, install-policy and node-toolchain harnesses run as Pester suites under test/pester/ with their cases, and the old scripts are gone
- [x] The CR and trailing-whitespace check is shorter and still fails on a CR and on trailing whitespace (a negative test shows it)
- [x] The quick gate is not slower than before (report the before and after time)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/development.md at least), or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Time the quick gate and the docs gate before any change.
2. Scanner: replace the cat-file reader and byte loop with `git grep` (`--cached` and worktree), `-I` for binaries, an `attr:-text` exclude pathspec; same finding lines.
3. Harnesses: one Pester suite each. `Install-NodeToolchain.Tests.ps1` already covers launcher shims, so the store fixture becomes `Install-NodeToolchain.Store.Tests.ps1`. Case bodies are carried over mostly as written (their assert helpers now call `Should`).
4. Parity: run the new docs-gate suite against the old script too.
5. Verify.ps1 and docs/development.md, gate, report, PR.
