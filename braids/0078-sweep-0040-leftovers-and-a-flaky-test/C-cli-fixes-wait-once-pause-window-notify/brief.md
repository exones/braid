---
id: '0078/C'
title: "CLI fixes: wait once, pause window, notify send"
status: To Do
labels: ["kind:task", "tier:M"]
dependencies: []
order: 30
---

## Goal

Four small CLI leftovers, so the commands do what their docs and the coordinator expect: `braid wait --once`, `braid pause --window` alone, the `notify send` sequence id and its help line. Leftovers 2026-11-22-t7ap, 2026-11-23-5vky, 2026-11-23-mchu and the help half of 2026-11-23-uanu (full text in the braid brief, "Taken from the inbox").

Expected size: about 150 lines in 6 to 8 files.

## Start here

- `src/commands/wait.ts`: the poll loop (POLL_MS, the sleep at line 206) and the exit codes 0, 1, 2, 3.
- `src/commands/pauses.ts`: the refusal without `--until` (line 50 onwards) and how `--window` picks a window.
- `src/commands/notify.ts:68`: the `sequenceOf` call with `pm/${slug ?? "-"}#send`; `src/notify/message.ts`, `sequenceOf`.
- `src/cli.ts`: the usage lines of wait, pause and notify send; `docs/cli.md` rows for the same.

## Change

- `braid wait <number> --once`: one read of the checks, then the answer, never a sleep. When that read already shows a failed check among the `ci` names while others still run, exit 1 (failure) rather than 3 (still running), with and without `--once`.
- `braid pause <number> --provider <p> --window <id>` without `--until`: either pause for that window (its reset plus the buffer) whatever the verdict, or keep the refusal and make docs/cli.md and the usage line say it needs a `pause` verdict or `--until`. Pick one, say why in the report (the user's lean: reliable, unsurprising calls).
- `braid notify send` without `--programme`: the sequence id reads `braid-<repo>-pm-send` (no empty slug); with `--programme` unchanged. Make sure a phone's earlier push isn't orphaned in a way that matters (a one-time different id is fine; say so).
- The `notify send` usage line names exit 0 for a failed send too, as docs/cli.md already does.

## Already decided

- `braid wait`'s exit codes keep their meanings; only the case "a failure is already visible" moves from 3 to 1.
- No skill change: the skills keep `--timeout 0.25`, which still works; `--once` is documented in docs/cli.md only.

## Out of scope

- The board's pause and resume (0074). The push contents beyond the sequence id (0078/G).

## Completion

- [ ] `braid wait --once` answers without sleeping, tested; a read that names a failed check exits 1, tested
- [ ] `braid pause --window` alone and docs/cli.md agree, tested
- [ ] `notify send` without `--programme` uses `braid-<repo>-pm-send`, tested; its usage line names exit 0 on a failed send
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
