---
id: '0005/C'
title: "Logs and reports: braid log, braid report"
status: Done
labels: ["kind:story", "tier:M"]
dependencies: ['0005/B']
order: 30
---

Goal: a strand's whole life can be recorded through braid: per-thread logs that also serve as checkpoints, and the report.

Expected size: about 250 to 450 lines with tests, in 3 to 6 files.

Start here (read in this order):
- doc-5 ""Decided so far"": logs and decision 4.
- `docs/braids-format.md` from TASK-5.1.

Change:
- `braid log <id> --thread <id> <text>`: appends a dated entry to `log-<creation date>-<short thread id>.md` (8 characters; `user` without a thread), creating it on first use, and stages it with `git add`; never commits. Settle the entry format and how a checkpoint entry is marked; add them to `docs/braids-format.md`.
- `braid report <id>`: write or append `report.md`; multi-line text from a file or standard input.

Already decided (don't re-investigate): doc-5 "Decided so far" (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`) and the parent TASK-5. Node.js 26, strict TypeScript, ESM; the skeleton from TASK-4 (`src/cli.ts` router, tests that run the built CLI). Cross-platform: Windows and Ubuntu.

Out of scope: the board, the import, resuming runs (story 8).

## Acceptance

- [x] braid log creates or appends the right per-thread file and stages it without committing, covered by tests
- [x] The entry and checkpoint format is in docs/braids-format.md
- [x] braid report writes and appends report.md
- [x] npm run verify passes; CI green on Windows and Ubuntu

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] Final summary written: what changed, why, validation, anything open

## Plan

1. src/braids/logs.ts: thread short id (first 8 letters/digits, `user` without), find-or-create log file (date from creation, UTC), entry format `## <YYYY-MM-DD HH:MM>Z` (+ ` checkpoint`), then text.
2. `braid log <id> [--thread <id>] [--checkpoint] (<text> | --file <path|->)`: appends, then `git add` the file; never commits; stops with a clear error if git add fails.
3. `braid report <id> (--file|--text) [--append]`: writes report.md (replace by default? no: appends by default is risky) - decide: default writes/replaces; --append adds after a blank line.
4. Router, help, docs/braids-format.md (entry and checkpoint format, commands), tests running the built CLI (Windows+Ubuntu safe), npm run verify.
