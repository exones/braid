---
id: '0064'
title: "The board watches provider limits"
status: In Progress
labels: ["kind:story", "tier:L", "ui", "ask:architecture", "ask:process"]
dependencies: []
related: ['0061', '0062', '0060']
delivery: epic
---

## Goal

The running board, not each coordinator and PM, watches the providers' usage limits: one place that sees every braid on every provider, checks at each refresh, pauses the agents on a provider over its threshold, resumes them after the reset and pushes each pause and resume to the phone. Coordinators and PMs drop their 15-minute check task and their own resume task (0061, D87).

The user's words (2026-11-22): "Following the pause braid I realize it's better that the board watches the limits and not each braid coord and pm. Single point, notifications." And, on how the board reaches busy agents: "run a new thread that will steer the given threads."

Expected size: about 1,000 lines in 20 files across the strands; the spike's report sets the real size.

## Working at the end

- The board reads `braid limits` for every provider its projects' running agents use, at each refresh, and shows each provider's usage against its threshold.
- Over a threshold, the board starts a short **steering thread** (`t3 thread start --provider --model`) on a provider under its own threshold (else on the over provider with a small model, in the threshold's margin). The board records the pause first (`by: board`); the steering agent sends the pause message with `t3_thread_send` `mode:"auto"` to each running agent on that provider (workers, reviewers, researchers, coordinators, PMs) and their children, and collects their `Paused:` replies.
- At the window's reset plus the buffer, the board re-checks and resumes the paused braids (or reschedules), and does so on its next start when it was down at that time.
- Each pause, resume and weekly window is an ntfy push; a weekly window reads Needs You on the board, derived from the pause record (wait, or move the role).
- The skills say the board pauses: coordinators and PMs keep no check or resume task, and act on the pause and resume messages.

## Strands

- A. Spike: steering thread, board limits view and pushes (M, ui). Proves the steering thread live and settles the open design points; mockups of the board's limits view and the push texts. The user reviews them before C and D are detailed.
- B. The board reads and shows provider limits, and pushes (M, ui).
- C. The board pauses and resumes through a steering thread (L). Outline until A.
- D. Skills: the board pauses, coordinators and PMs follow (L). Outline until A.
- E. Docs (S).

## Already decided

- **Why a steering thread.** The board reaches T3 only through the `t3` CLI, and `t3 thread send` only queues: "A busy thread gets it as its next turn; nothing is interrupted" (T3 0.1.6, checked 2026-11-22; 0061/A [S7][S9]). An agent's MCP `t3_thread_send` `mode:"auto"` steers a busy turn in about a second, cuts a coordinator's `t3_thread_wait`, and reaches `delegate_task` children (0061/A, measured). `t3 thread start` takes `--provider` and `--model`, so the board can start an agent that does the steering. The steering thread's model and provider come from `BRAID.md` `models` (a new `steering` role with `first` and `fallback` lines; the user's edit of `BRAID.md`). It runs on the first provider under its threshold; when every one is over, on the over provider with the small model in the 3% margin, and the board pushes that.
- **The board keeps its own clock for the resume.** T3's `schedule_task` is MCP-only and bound to the calling thread; the board doesn't need it: it resumes at reset plus buffer while it runs, and on its next start for a resume it missed.
- **This changes the rule that the board acts only on the user's click** (`docs/board.md`, "Refresh" and "Actions"), for provider limits only: the board may start a steering thread and send resume messages on its own, and record pauses. Everything else stays click-only. A new decision in `docs/decisions.md` replaces D87's "whoever launches the agents pauses them"; D86 (the pause record and how the board shows it) stays, with `--by board`.
- The reading rules, thresholds and `limits:` key of 0061 stay (`src/braids/limits.ts`: session 97%, weekly 95%, buffer 5 min, stale 10 min; unknown never pauses). Only agents on the provider over its threshold stop.
- The pause and resume messages that workers already follow (braid-worker skill, 0061/D) stay as they are, so a worker needs no change.
- ntfy stays the only push channel (D70); no new npm dependency.
- Related to 0061 (Pause and resume braids on provider rate limits, Done on `main`): this braid moves 0061's check and resume from coordinators and PMs to the board; `braid limits`, `braid pause`/`resume` and the paused board state are reused.
- Related to 0062 (Programme manager on the board and in notifications, In Progress on `braid/0062-programme-manager-on-the-board-and-in`): both change the board, the notifier (`src/notify/`) and the braid-pm skill, and 0062 says "the board doesn't message threads", which this braid overturns for limits only. 0062 goes first: strands B and C of this braid start after 0062 merges into `main` (they then merge `main` in), and D plans on top of 0062/E's skill changes. The spike A can run now.
- Related to 0060 (Workers as T3 subagents, Outline on `main`): workers as `delegate_task` children are reached the same way by the steering thread; whichever merges later covers both kinds.

- **Decided after spike 0064/A** (the user, 2026-11-22): the board writes the pause record in code before it starts the steering thread (the record is the lock against a second board); a steering thread when every provider is over runs on the over provider; a weekly window is a board-derived Needs You (reason `limit`) with a high push, no `braid ask`; the mockups and pushes in `A-spike-steering-thread-board-limits-view/mockups/limits.html` are approved, with no "pausing" push when a pause completes normally. The resume is a plain `t3 thread send` from the board.

## Out of scope

- Changing T3, calling Anthropic's or OpenAI's usage endpoints, or T3's WebSocket API.
- Hard stops (a limit hit mid-turn), switching providers automatically, snoozing threads.
- A board that starts at login without the user (inbox idea `2026-11-21-mbb2`), unless the spike proposes it as a later braid.
- Any other action the board takes without a click.

## Completion

- [ ] The board shows each provider's usage against its threshold, from `braid limits`, at each refresh
- [ ] Over a threshold, the board pauses every running agent on that provider through a steering thread, and records the pause; agents on other providers keep running
- [ ] The board resumes paused braids after the reset plus the buffer, after re-checking, also after a restart that missed the resume time
- [ ] Pauses, resumes and weekly windows are pushed over ntfy; a weekly window reads Needs You until the reset
- [ ] Coordinators and PMs keep no limits check task or resume task, and act on the board's pause and resume messages
- [ ] The docs from BRAID.md `docs` describe the board-driven pause, and `docs/decisions.md` records the change from D87
- [ ] The gate command from BRAID.md passes
