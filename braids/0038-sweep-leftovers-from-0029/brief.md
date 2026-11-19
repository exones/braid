---
id: '0038'
title: "Sweep: leftovers from 0029"
status: To Do
labels: ["kind:task", "tier:S", "sweep"]
dependencies: []
delivery: epic
---

## Goal

Clear the two leftovers 0029 (Sweep: leftovers from 0027, PR #158) left in the inbox: the CLI page gets its missing `braid title` entry, and `catBatchSync` gets failure tests. Runs after 0037 (Coordinator asks with the question tool and set options).

Expected size: about 80 lines in 3 files, tests included.

## Start here

- `docs/cli.md` and `braid help`: the page says it mirrors help.
- `src/braids/gitio.ts`: `catBatchSync` and the async `catBatch` (which takes a command override to inject a hang); `src/braids/branches.ts`: `prefetchBriefs`, `gitTree.read`.
- The existing tests of `catBatch` under `test/`.

## Change

- **docs/cli.md lacks braid title** (leftover 2026-11-19-8nw9, from 0029, https://github.com/exones/braid/pull/158): docs/cli.md says it mirrors braid help, but it has no entry for braid title (the command that prints thread titles such as "💻 braid 0021 worker: ..."). Add it so the CLI page matches help.
- **catBatchSync has no failure test** (leftover 2026-11-19-u94h, from review 0029, https://github.com/exones/braid/pull/158#issuecomment-7016854656): catBatchSync (src/braids/gitio.ts, added by 0029) has no test for a Git failure, a missing object or a hung process, and unlike the async catBatch it takes no command override to inject a hang. On a non-zero exit it returns nulls, prefetchBriefs does not cache them, and gitTree.read falls back to `git cat-file blob` with no timeout. A test for each case would lock the fallback behavior of braid list --open, braid view --links and braid check.

## Already decided

- `catBatchSync` may take a command override like `catBatch`, for tests only; its behaviour stays as it is (nulls on failure, no caching of nulls).
- Runs after 0037; no shared files.

## Out of scope

- Changing the fallback itself (for example a timeout on `git cat-file blob`); if a test shows it is needed, propose it under "For later items".

## Completion

- [ ] `docs/cli.md` has a `braid title` entry matching `braid help`
- [ ] Tests for `catBatchSync`: a Git failure, a missing object, and a hung process (through an injected command)
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
