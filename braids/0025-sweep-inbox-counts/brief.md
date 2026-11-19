---
id: '0025'
title: "Sweep: inbox counts"
status: Done
labels: ["kind:task", "tier:S", "sweep"]
dependencies: []
delivery: epic
---

## Goal

Sweep of two leftovers from 0020 (Gap inbox), both about the inbox counts: a missing test and a missing line in `braid list`. Runs after 0024.

Expected size: about 60 lines in 3 files.

## Start here

- `src/inbox/branch.ts`: `openCounts()`, which `braid recap` ("Sweep due") and `braid list` ("Inbox:") use.
- `src/commands/braids.ts`: `listBraids()`.
- `test/inbox.test.ts`, `test/facts.test.ts`, `test/inbox-sweep.test.ts`: existing inbox tests and their fixtures.
- `docs/braids-format.md`: what `braid list` prints.

## Change

1. Leftover 2026-11-18-9e3w, from review 0020/B (https://github.com/exones/braid/pull/128#issuecomment-6973669216), "No test that the inbox counts include unpushed local entries":
   openCounts() in src/inbox/branch.ts (used by braid recap's "Sweep due" line and braid list's "Inbox:" line) must read the local refs without fetching, including leftovers captured offline and not pushed yet. readInbox() is tested for that in test/inbox.test.ts, but the tests of the counts (test/facts.test.ts, test/inbox-sweep.test.ts) only use pushed entries, so a regression in openCounts (a fetch, or ignoring local-only commits) would pass. Add a test with a local-only leftover and an unreachable origin.
2. Leftover 2026-11-18-k9xb, from review 0020/B (https://github.com/exones/braid/pull/128#issuecomment-6973669216), "braid list shows no inbox counts when there are no braids":
   listBraids() in src/commands/braids.ts returns "No braids." early, before the "Inbox: <n> leftovers, <n> ideas" line it prints otherwise. A new project that has ideas or leftovers but no braid yet shows no counts, although docs/braids-format.md says braid list ends with the inbox line. Print the counts after "No braids." too, with a test.

## Already decided

- Dropped in the same sweep, by the user: 2026-11-18-gaeo (inbox writes give up after 10 s waiting for the lock) and 2026-11-18-ikmw (concurrent changes to the same inbox entry: the later write wins), as acceptable limits for a single-user inbox.

## Out of scope

- Other inbox behavior, locking and conflict handling.

## Completion

- [x] A test of the inbox counts with a local-only leftover and an unreachable origin, which fails if openCounts fetches or ignores local-only commits
- [x] `braid list` with no braids prints "No braids." then the inbox line, with a test
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

Print the inbox line after "No braids." in `listBraids`; add a `braid list` test with a local-only leftover, an unreachable origin and no braids (no fetch: stderr stays empty); update the old no-braids expectation in `test/braids.test.ts`.
