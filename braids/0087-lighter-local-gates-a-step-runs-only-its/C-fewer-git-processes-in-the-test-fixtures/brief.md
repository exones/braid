---
id: '0087/C'
title: "Fewer git processes in the test fixtures"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: ['0087/B']
order: 30
---

## Goal

The test suite starts fewer git processes. While `npm run verify` runs, about 600 git.exe, 160 conhost and 77 sh start every 10 s, about 43% CPU from process starts alone, each scanned by Defender (PM's investigation, 2026-11-28). Batch git calls in the fixtures where it is cheap.

Expected size: about 300 lines across test/support and the heaviest test files.

## Start here

- Count first: which test files and helpers start the most git processes (for example wrap git through a counting shim on PATH for one full run, or count `execFile`/`spawn` of git per file). Work from the top of that list down.
- `test/support/start-fixtures.ts`, `test/support/done-fixtures.ts`, `test/fixtures/`: shared repo setup.
- Tests that run `git init`, `git config` and an initial commit per test.

## Change

- Where cheap: one repo per suite instead of one per test (a template repo made once and copied, or `git clone --local`), `git -c user.name=… -c user.email=…` or `GIT_CONFIG_*` instead of separate `git config` runs, one `git commit` instead of several setup commits.
- Stop when the next change would need a test rewritten around a new shape; list the rest in the report.

## Already decided

- Tests keep making real git repos and spawning the CLI; this strand trims setup, not what the tests prove. A test whose isolation needs its own repo keeps it.
- Runs after 0087/B, which owns the temp-dir cleanup and the pinned git settings; build on its helper.
- Related to 0077 and 0078/E (see the braid brief): merge main first if 0077 has landed; keep edits in shared files small.

## Out of scope

- Product code (`src/`): making the CLI itself call git less.
- The test picker: 0087/A.

## Completion

- [ ] report.md gives the git process count of one `npm run verify:full` before and after, measured the same way, and the full gate's time before and after
- [ ] The count is lower; report.md names the files changed and the heavy spots left, with why each was left
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
