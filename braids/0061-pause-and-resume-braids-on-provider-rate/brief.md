---
id: '0061'
title: "Pause and resume braids on provider rate limits"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0060']
delivery: epic
---

## Goal

When a provider's usage (for example Claude's 5-hour session window) crosses a threshold, braid work on that provider stops at a clean point instead of failing mid-turn. Every agent that depends on it is told to pause, the board shows why nothing moves, and work resumes by itself at the window's reset time plus a buffer (default 5 minutes). Work on providers under their threshold (for example Codex) keeps running.

The user's words: "react to rate limits and at a threshold pause on pm or coordinator level (depends if pm runs the dev or the user: I guess coordinator should know). So pm or coordinator try to cleanly pause, send this signal to all dependent agents and a way to resume automatically at the limit reset + some buffer (e.g. 5 minutes). Another idea: board does it by sending messages to the threads."

## Strands

| Strand | Kind, tier | Depends on |
| --- | --- | --- |
| A Spike: scheduled resume, pause messages, and who pauses | spike, M | - |
| B `braid limits`: read provider usage from the T3 caches | story, M | - |
| C Paused braids: `braid pause` and `braid resume`, board and status | story, L | A, B |
| D Pause and resume in the skills (Outline until A reports) | task, L | A, B, C |
| E Docs | task, S | A to D |

## Already decided

- **Source of the numbers: T3's provider caches, read from disk.** `~/.t3/caches/<providerInstanceId>.json` (`$T3CODE_HOME` overrides `~/.t3`); the file name is the instance id that `BRAID.md` `models` lines use (`Claude_Everix`, `codex`). Field `usageLimits`: `{ checkedAt, windows: [{ id, kind: session|weekly, label, windowDurationMins, usedPercent (0-100), resetsAt (ISO) }], resetCredits?, unavailable?: { reason: probeFailed|unsupported } }`. A disabled instance has no `usageLimits`. No OAuth, no Anthropic or OpenAI usage endpoint, no T3 change. Checked against the T3 source and the user's files, 2026-11-21.
- Window ids: Claude `five_hour`, `seven_day`, and model-scoped weekly windows such as `seven_day_fable` (label "Weekly · Fable", applies only to that model). Codex `primary` (5 h) and `secondary` (weekly). Cursor reports `unavailable: unsupported`.
- When T3 rewrites the file: on a timer by its background-activity profile (performance 1 min; balanced 5 min, and only while a T3 window is in use; battery-saver 15 min; a failed check retries after 30 s), live from Claude Code's `rate_limit_event` during Claude turns, when the Usage page opens (`server.refreshProviders`), and on a settings change or start (no limits until the first check). The user runs `performance` and uses Claude only through T3.
- Reading rules: `checkedAt` older than 10 min is unknown; a window whose `resetsAt` is past counts as 0%; missing `usageLimits` or `unavailable` is unknown, not 0%; usage from outside T3 shows only at the next check; the cache lags up to a minute, so thresholds leave margin.
- **Only a pre-emptive, graceful pause** (the user, 2026-11-21): a limit hit mid-turn is a hard stop in T3, which this braid avoids by pausing at a threshold, before the limit. Detecting or recovering from a hard stop is not part of it.
- **Unknown never pauses.** A provider T3 can't measure (the reviewer's `cursor` is `unsupported`) or a stale cache gives `unknown`: launch as today and say so in one line. Pausing on unknown would stop work for good on unsupported providers.
- **Who decides: whoever launches the agents.** A coordinator the user runs checks and pauses its own braid. Under a PM, the PM decides for every braid on that provider and tells their coordinators; a coordinator knows it is PM-run from the braid skill's "Launched by a PM". The board only shows the pause. This is the plan's recommendation over the board-driven design below; spike A confirms or overturns it with evidence.
- **Board-driven alternative, compared.** For: one place that sees every braid, the same for user-run and PM-run braids. Against: it works only while a board runs; it must know each thread's role and step; it breaks the rule that the board acts only on the user's click (`docs/board.md`, "Refresh": `broke.json` and `notified.json` are the only things it writes on its own). The coordinator already knows its threads and launches, so the check sits where the launch is.
- Defaults: pause at 90% on a session window and at 95% on a weekly one, buffer 5 min, stale after 10 min. An optional `limits:` key in `BRAID.md` (`session`, `weekly`, `buffer`, `stale`); absent means the defaults. Adding the key to this repository's `BRAID.md` is the user's edit, not a strand's.
- The coordinator itself runs on a provider too (here `Claude_Everix`): the threshold leaves it room to pause cleanly, and the scheduled resume wakes it after the reset.
- Related to 0060 (Workers as T3 subagents, Outline on `main`): both change how the coordinator launches and messages workers. Whichever is merged first sets the launch path; 0061/D, when detailed, follows the launch path on its braid branch, and 0060's plan then includes pausing subagent workers. Neither undoes the other.

- **Weekly windows** (the user, 2026-11-21): over a weekly threshold, pause and schedule the resume the same way, and also `braid ask <number> --kind decision` so the user can move the role to another provider in `BRAID.md` `models` instead (the user's edit). Never switch providers silently.

## Out of scope

- Switching a braid to another provider automatically.
- Usage for providers T3 reports as `unsupported`.
- Calling Anthropic's or OpenAI's usage endpoints, or T3's WebSocket `server.refreshProviders` (a live read isn't needed now; if T3 later ships an MCP usage tool, a later braid prefers it over the file).
- Changing T3.

## Completion

- [ ] Before launching any agent, a coordinator (or PM) checks that agent's provider, and over the threshold it pauses instead of launching.
- [ ] A pause reaches every running agent of the braid (or of the PM's braids on that provider), and each stops at a clean point with its WIP pushed and logged.
- [ ] The board shows a paused braid with its provider, window and resume time, and doesn't call it stalled.
- [ ] Work resumes without the user at `resetsAt` + buffer, after re-checking the limits.
- [ ] Work on providers under their threshold keeps running.
- [ ] Docs from BRAID.md `docs` are updated (strand E).
