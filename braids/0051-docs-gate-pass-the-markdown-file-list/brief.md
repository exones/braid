---
id: '0051'
title: "Docs gate: pass the Markdown file list without the command line"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

The docs gate fails on Windows once the repository's Markdown paths add up to more than the Windows command-line limit (32,767 characters): `scripts/Test-DocsGate.ps1` passes every non-`inspiration/` `.md` path to `node scripts/check-markdown-links.mjs` as arguments. Pass the list another way so the gate works however many Markdown files there are.

Expected size: about 15 lines in 2 files, plus one regression test.

## Start here

- The failure: PR #189's `verify (windows-latest)` on 8fe0252 (run 44746282022): "The filename or extension is too long" when `Test-DocsGate.ps1` starts `node.exe`. The list was about 32.6k characters.
- `scripts/Test-DocsGate.ps1`, `Get-LinkFindings` (the call near line 351 builds `$checker` and the argument list).
- `scripts/check-markdown-links.mjs`: how it reads its file list today.
- `test/fixtures/docs-gate/Test-DocsGateNegatives.ps1` and `test/pester/`: where gate tests live.

## Change

- `scripts/check-markdown-links.mjs`: read the file list from standard input (one path per line) when no path arguments are given; keep path arguments working.
- `scripts/Test-DocsGate.ps1`: send the list on standard input instead of argv.
- A regression test: the gate's link check handles a list longer than 32,767 characters (for example, many generated paths or a long padded list), on both Windows and Ubuntu.

## Already decided

- Prerequisite of 0050 (One braid per coordinator thread, PR #189), whose Windows CI fails on this; decided by the coordinator under the `steady` preset's scope row (a prerequisite of tier S). 0050 merges `main` after this merges.
- `main` itself is at risk: its newest Windows run was still pending when this was planned. Nothing in the gate's findings or exclusions changes; the checks are as strict as before.

## Out of scope

- Any change to what the link check reports, its configuration or exclusions.

## Completion

- [x] The gate passes the file list on standard input, and path arguments still work.
- [x] A regression test covers a list longer than 32,767 characters.
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

checker reads stdin (one path per line) when no path args; gate writes the list to stdin; Pester test with 700 long names (>32,767 chars) plus an args test.
