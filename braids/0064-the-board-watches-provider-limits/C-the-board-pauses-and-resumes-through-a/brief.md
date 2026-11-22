---
id: '0064/C'
title: "The board pauses and resumes through a steering thread"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: ['0064/A', '0064/B']
order: 30
---

## Goal

When a provider goes over its threshold, the board records the pause and starts a 🚦 steering thread. That thread pauses every running agent of the board's braids on that provider. After the reset plus the buffer the board re-checks and resumes them with plain `t3 thread send` messages, and it pushes each event over ntfy. This is the limits-only exception to the board's click-only rule.

Expected size: about 750 lines in 12 files (0064/A's estimate). If it heads past about 900 lines, stop and propose splitting the resume, the weekly window and the pushes into a strand of their own (M) after this one.

## Start here

- `braids/0064-the-board-watches-provider-limits/A-spike-steering-thread-board-limits-view/report.md`, Q1 to Q6, and its `sources.md` S4 (the live probe and its first message), and `mockups/limits.html` screens 2, 3, 4 and 6.
- `src/commands/board.ts` (Start's `t3 thread start`), `src/board/t3.ts`, `src/braids/pauses.ts` (`setPause`, `clearPause`, `PAUSERS`; `locked()` is in `src/braids/requests.ts`), `src/commands/pauses.ts`, `src/braids/limits.ts`, `readModelLines` in `src/braids/limits.ts` (nested `models` keys), `src/notify/message.ts`, `src/notify/notifier.ts`.
- `.agents/skills/braid/references/limits.md`: the pause message text, reused unchanged.

## Change

- **The steering model:** read `models.steering.first` and `models.steering.fallback` from `BRAID.md`. Take the first line whose provider is under its threshold. When every line is over, take `first` and push "steering from it". When there is no `steering` role, report it on the board's start line and don't pause.
- **Targets:** per braid on the provider over its threshold, the running or idle (not archived) coordinator, workers, recorded reviewers and PM threads, from the snapshot. A braid that already has a pause record is no target.
- **The pause:** under `locked()`, write the record first (`by: board`, with `threads` and `steering`: thread id and outcome). Then `t3 thread start <project> - --provider --model --title "🚦 <repo> steering: pause <provider> <window> <n>%" --json`, with the first message built in code from a template. The template holds the provider, window, usage, resume time, the targets, the literal pause message (the coordinator and PM variants from the report, Q2), the reply format and the final `Steering:` line. The steering thread also finds running children of its targets with `includeSubagents`, waits at most 10 minutes for the replies, settles itself (never archives itself), and ends any later turn without acting.
- **Its result:** parse the last line, `Steering: <provider> paused <n>/<m>; children: <ids>; no answer: <ids>`, from `t3 thread show --messages 1`, and store the child ids and the outcome in the record. It counts as failed when the run is `failed` or `interrupted` without the line, when no line came within 15 minutes, or when the start failed (then try the fallback line once). A failed pause reads Needs You "Pause failed".
- **The resume clock:** at each refresh, for each `by: board` record whose resume time has passed, run the limits check:
  - `ok` or `unknown`: send each paused thread its resume message with `t3 thread send` (worker and child: `Resume: continue <id> from your checkpoint`; coordinator and PM: the report's variants), then clear the record. A send that fails keeps the record and is retried at the next refresh.
  - `pause`: keep the record with the new resume time.
- A missed resume is handled the same way at the first refresh after a start.
- **Weekly window:** a paused braid whose window is weekly reads Needs You with the derived reason `limit` until the reset, with no request file.
- **Pushes:** the mockups' screen 6 events, with their keys in `notified.json`. There is no "Pause started" push when the pause completes within a minute.
- **Cards:** the pausing, paused, didn't-answer and failed lines of screens 2 to 4, and the steering line in the limits panel.
- **`braid board --no-pause`** turns the exception off for one run (limits still show); the start line says which mode is on. `--demo` never acts.
- **A hold outlives a limit pause** (leftover `2026-11-22-7kqa`, added in the sweep, 2026-11-22): neither the board nor `braid pause --provider`/`braid resume` replaces or clears a hold. The board doesn't target a held braid and clears only its own limit record; `braid pause --provider` refuses a held braid; `braid resume --limit` clears a limit pause and leaves a hold.
- **One live Codex probe:** a `🧪 braid 0064/C probe:` steering thread on `codex` / `gpt-6-luna` steering a busy Claude probe thread. Report it; if it fails, say so and keep Claude-only steering working.

## Already decided

- See the braid's brief, including "Decided after spike 0064/A" (the board writes the record, steering from the over provider when all are over, weekly window derived, mockups approved).
- The `steering` role in this repository's `BRAID.md` is the user's edit; tests use fixtures, and the live run needs the user's line in place (ask the coordinator if it is missing).
- Starts after 0062 merges into `main`; merge `main` into the braid branch first.
- Live runs: only tiny probe threads titled `🧪 braid 0064/C probe:`, archived afterwards; never message real threads of other braids.

## Plan

1. `src/braids/pauses.ts`: `by: board` in `PAUSERS`; optional `targets` (thread id, kind, item) and `steering` (thread, provider, model, started, outcome, answered/total, children, no answer, reason) on a record; `claimPauses` adds records for braids without one in one `locked()` call and returns those it added; `patchPauses` updates them under the lock.
2. `src/board/steer.ts` (new): the `steering` model lines and their pick; the targets per braid from the snapshot (coordinator, workers, reviewers, PM threads on the provider; children come from the steering thread); the first-message template; the `Steering:` line parser; the resume messages; the limit pushes and their keys.
3. `src/board/steerer.ts` (new): one board-wide `Steerer` that every project's feed hands its good snapshot to. Per tick, serialised: follow running steering threads (`t3 thread show --messages 1 --json`: done, failed, 15-minute timeout), resume due `by: board` records after a re-check (`ok`/`unknown`: `t3 thread send` each target, clear; `pause`: new resume time), then pause providers over their threshold (claim records in each project, start one thread per provider in the first project with a `steering` role, fallback line once when the start fails). Pushes go through a limit pusher that keeps `pause:` keys in `notified.json`.
4. Board: `braid board --no-pause`; the start line names the mode (`pauses through a 🚦 steering thread`, `--no-pause`, no `steering` role, demo). `--demo` gets no steerer.
5. Model and page: reason `limit` (weekly window, failed pause) in Needs You, not pushed as a need; pause lines for pausing (spinner), paused by the board with answered counts, didn't answer (amber), failed; the chip's `pausing…` note and the panel's steering line.
6. Tests: `test/board-steer.test.ts` with a fake T3 runner, fixture caches and temp repos; then docs (`docs/board.md`, `docs/cli.md`, CLI help, `docs/decisions.md` for the click-only exception), the live Claude run and the Codex probe.

## Out of scope

- Skill changes (D). A "Pause now" chip button and archiving older settled steering threads (later ideas from the spike).

## Completion

- [x] Over a threshold the board writes one `by: board` record per braid under the lock, starts one steering thread per provider and pause, and stores its outcome; braids on other providers are untouched, and a second board or a later refresh starts nothing
- [x] The board resumes at the reset plus the buffer after a re-check, keeps the record with a new resume time when the provider is still over, and resumes after a start a pause it missed
- [x] A weekly window and a failed pause read Needs You; the pushes of the mockups' screen 6 are sent once each with their keys
- [x] A hold outlives a limit pause: neither the board nor braid pause/resume replaces or clears it; tests cover it
- [x] `--no-pause` turns the exception off; `--demo` never acts
- [x] Tests cover the decisions with a fake T3 and fake limits; a live Claude run and the Codex probe are reported with times
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
