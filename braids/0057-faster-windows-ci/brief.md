---
id: '0057'
title: "Faster Windows CI"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
delivery: epic
---

## Goal

The `verify (windows-latest)` CI job takes about 8 minutes, against about 2 for `verify (ubuntu-latest)`. Every PR waits for the slower one, so workers and the user wait about 6 extra minutes per push. Find where the Windows time goes, then cut it without losing what the Windows job proves.

Strand A, a spike, measures the time and tries the candidate fixes on real Windows runners. Strand B, an Outline until A reports, applies what the user picks from A's report.

## Measured so far

Run 44905235633 (a PR from `braid/0054-…`, 2026-11-21), `verify:full` on both runners:

| Phase | Windows | Ubuntu |
| --- | --- | --- |
| Job setup, checkout, setup-node, `npm ci` | ~36 s | ~17 s |
| docs-gate and oidc-release | 12 s | 9 s |
| docs-gate negatives, install-policy and node-toolchain fixtures | 45 s | 26 s |
| Pester (`scripts/Test-Pester.ps1`) | 53 s | 20 s |
| typecheck and build | 3 s | 1.5 s |
| `node --test` (434 tests) | **300 s** | **41 s** |
| packed-install proof | 18 s | ~5 s |
| Whole job | 7 m 54 s | 2 m 0 s |

The tests that start `git` and `node dist/cli.js` many times run 6–8× slower on Windows. For example, inbox "take, pass, drop and reopen" takes 16.1 s on Windows and 2.0 s on Ubuntu. The per-test times add up to 785 s on Windows and 106 s on Ubuntu, so the Windows run gets only about 2.6× parallelism.

## Already decided

- The CI check names stay `verify (windows-latest)` and `verify (ubuntu-latest)`. They are BRAID.md's `ci` names, and BRAID.md changes only when the user asks. `main` has no branch protection, so GitHub doesn't enforce the names; BRAID.md and `braid accept` do.
- Windows keeps running the full `verify:full` on every PR. Running less of it on Windows (a subset, or only on push) loosens CI. Under the `steady` preset that is the user's call, so A may measure it but can only propose it.
- A paid larger runner is a paid service, so the user decides. A may price it.
- No product behaviour changes. A test may be restructured (for example, calling the CLI in-process instead of spawning it) only if it still proves the same thing.

## Out of scope

- The Ubuntu job, except where a shared change speeds up both.
- `release.yml`.
- The midnight-UTC flake in `test/done.test.ts` (inbox idea 2026-11-20-6ce8).

## Completion

- [x] A's report names where the Windows time goes and measures the candidate fixes on real runners
- [x] The changes the user picked from A's report are merged into the braid branch, with the before and after Windows job times on the final PR
- [x] `verify (windows-latest)` still runs `verify:full` on every PR, unless the user decided otherwise
