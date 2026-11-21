---
id: '0061/B'
title: "braid limits: read provider usage from the T3 caches"
status: In Progress
labels: ["kind:story", "tier:M", "ask:architecture"]
dependencies: []
order: 20
---

## Goal

A coordinator or PM asks one command whether it may launch an agent on a provider: `braid limits` reads T3's provider caches, applies the reading rules, and prints per provider each window's usage, a verdict (`ok`, `pause` or `unknown`) and, for `pause`, the window that caused it and the resume time (`resetsAt` + buffer). Human output and `--json`.

Expected size: about 400 lines in 6 files, half of them tests.

## Start here

- `braid view 0061`: the cache format, window ids, reading rules, defaults and "unknown never pauses". These are settled.
- `~/.t3/caches/Claude_Everix.json`, `codex.json`, `cursor.json`, `claudeAgent.json` on this machine: real examples of a Claude, a Codex, an `unsupported` and a disabled instance.
- `src/braids/readiness.ts`: how `BRAID.md`'s front matter is read today (top-level keys only; `models` is nested).
- `src/cli.ts` and one small command such as `src/commands/autonomy.ts`: how a command, its usage line and `--json` are wired.

## Change

- `src/braids/limits.ts` (new): read `$T3CODE_HOME/caches` (default `~/.t3/caches`), parse `usageLimits`, apply the reading rules, and decide per provider. A `models` line `Claude_Everix / claude-opus-5-5 / …` maps to its instance's windows: every window not scoped to a model, plus a model-scoped one only when it matches the line's model (`seven_day_fable` for a Fable model). The mapping from window id to model is data in one place, so a new scoped window is one line.
- `BRAID.md` `limits:` key, optional: `session` (default 90), `weekly` (95), `buffer` (minutes, 5), `stale` (minutes, 10). Absent or partial keys fall back to the defaults; an invalid value is an error naming the key.
- `src/commands/limits.ts` (new) and `src/cli.ts`: `braid limits` lists every provider named in `BRAID.md` `models`, one block each, with its roles; `braid limits <instanceId>` or `--role <role>` (for example `--role worker --tier M`, resolved as the braid skill resolves models) narrows it. Exit code 0 for `ok` and `unknown`, a distinct non-zero for `pause`, so a script can branch. `--json` gives the same data, with `resumeAt` in ISO.
- `test/limits.test.ts` (new) with fixtures under `test/fixtures/limits/` copied from the user's files and edited: one Claude, one Codex, one disabled (no `usageLimits`), one `unsupported`, one stale, one with a past `resetsAt`, one over the session threshold, one over a model-scoped weekly window that the line's model does not use. Tests pass a fixed "now" and the fixtures folder; never the real `~/.t3`.
- `docs/cli.md`: the new command.

## Already decided

- Read-only: the command never writes the caches or calls T3, Anthropic or OpenAI.
- Verdict rules: `pause` when any matched window is at or over its kind's threshold (resume at the latest such `resetsAt` + buffer); `unknown` for a stale `checkedAt`, missing `usageLimits` or `unavailable` (say which); otherwise `ok`. A past `resetsAt` is 0%.
- Times print in local time in human output, ISO UTC in `--json`.

## Out of scope

- Pausing anything, the board, the skills (0061/C and 0061/D).
- Editing this repository's `BRAID.md`.

## Completion

- [x] `braid limits` prints per provider in `BRAID.md` `models` each window's usage, the verdict and, for `pause`, the window and resume time; `--json` gives the same
- [x] A models line maps to its instance's windows, a model-scoped weekly window only for its model
- [x] `limits:` in `BRAID.md` overrides the defaults; absent keys use them; an invalid value names the key
- [x] Tests on the fixtures cover ok, pause on session, pause on a scoped weekly window, a scoped window for another model ignored, stale, disabled, unsupported and a past `resetsAt`
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. `src/braids/limits.ts`: read `BRAID.md` `limits:` and `models` lines, read `<T3CODE_HOME>/caches/<instance>.json`, apply the reading rules, give a verdict per provider. Model-scoped windows are one table (`SCOPED_WINDOWS`).
2. `src/commands/limits.ts` + `src/cli.ts`: `braid limits [<instance>] [--role r --tier T --kind k] [--json]`; exit 3 on pause, 0 for ok and unknown.
3. `test/limits.test.ts` with fixtures in `test/fixtures/limits/` and a fixed now; `docs/cli.md`.
