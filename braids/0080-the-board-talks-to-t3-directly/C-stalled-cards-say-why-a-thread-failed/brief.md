---
id: '0080/C'
title: "Stalled cards say why a thread failed"
status: To Do
labels: ["kind:story", "tier:M", "ui"]
dependencies: []
order: 30
---

## Goal

When a braid's thread failed (its last run ended without completing), its card says why, in a few words, with T3's full error in the tooltip: a usage limit, a provider or network error, a stopped run, or T3's own text. Today the card shows only that the braid stalled. The user's "G add" (T3 #39849). No sign-in is needed: `t3 thread show <id> --json` already prints `{ thread, messages, error }`, `error` being the latest run's error once it ended without completing. The classification also gives 0080/E what it needs: a thread whose last run failed on a usage limit counts as paused.

Expected size: about 200 lines in 5 files.

## Start here

- `~/.braid/artifacts/braid/p27-t3-tests/t3-src-v0.1.12/cli_thread.ts`: `latestRunError` (about line 560) and `thread show` (about line 1048); `apps_server_src_orchestration-v2_UsageLimitRecoveryWorker.ts`: T3's `lastErrorClass: "usage_limit"`, to see whether `thread show --json`'s `thread` object carries a class or only the text says it.
- `src/board/t3.ts`: `showThread` and `Where` (what the board reads per thread), the `T3` snapshot.
- `src/board/model.ts`, `src/board/marks.ts`, `src/board/nudge.ts`: where a card reads stalled and what it shows.
- `src/board/demo.ts`: the board's demo data, for the mockup.

## Change

- `src/board/failure.ts` (new): `failureOf(error: string | null, thread)` returns `{ kind: "limit" | "provider" | "stopped" | "other", short, full }`, from T3's class when the JSON has one, else from the text; the short words fit a card.
- `src/board/t3.ts`: `showThread` also reads `error` (one field in `Where`); nothing else in the read changes.
- The card: a stalled or failed card shows the reason's icon and short words, the full text in the tooltip.
- Tests: `failureOf` on real error texts (a usage limit, an overloaded provider, a stop, an unknown one); `showThread` reads `error`; a card with a reason.
- Mockups first (`ui`): the stalled card with each kind of reason, on demo data; then stop for the user's verdict before building.

## Already decided

- Board UI: icon-only, the words in the tooltip; how threads are opened doesn't change.
- Related to 0077 (The board stays fast under load; it owns the board's T3 read path in src/board/t3.ts): the coordinator agrees this one-field change with 0077's coordinator before this strand starts, and the worker merges `main` (or 0077's branch, as agreed) first; no new T3 calls, `error` comes from the `thread show` the board already runs.

## Out of scope

- Acting on the reason (no nudge or resume changes): 0080/E.

## Completion

- [ ] The user approved the mockups before building
- [ ] A stalled card whose thread failed shows the reason's kind and short words, the full error in the tooltip
- [ ] `failureOf` is tested on real error texts, including a usage limit
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
