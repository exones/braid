---
id: '0064/A'
title: "Spike: steering thread, board limits view and pushes"
status: In Progress
labels: ["kind:spike", "tier:M", "ui"]
dependencies: []
order: 10
---

## Goal

Can the board pause busy agents through a steering thread it starts, and what exactly does it do and show? Time box: 3 hours. The answers and mockups feed strands B to D. B to D are detailed from this report once the user has reviewed it.

Expected size: a report, `sources.md` and mockups; no product code.

## Start here

- `braids/0061-pause-and-resume-braids-on-provider-rate/A-spike-what-t3-does-at-a-rate-limit-and/report.md` and `sources.md`: what was measured about `mode:auto`, queueing and scheduling. Reuse its sources; don't repeat its runs.
- `.agents/skills/braid/references/limits.md`: today's pause and resume, which the steering thread takes over.
- `src/braids/limits.ts`, `src/braids/pauses.ts`, `src/board/pause.ts`, `src/board/t3.ts`, `src/notify/`: what the board already reads, shows and pushes.
- `docs/board.md` ("Refresh", "Actions", "Start", "Notifications") and `src/commands/board.ts` (how Start runs `t3 thread start`).

## Change

Look at the T3 CLI help and source at the installed version, the 0061/A sources, and live runs here. Read each source rather than its title, record each in `sources.md` in the [braid-researcher](../../../.agents/skills/braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) in `report.md`.

Answer, each with evidence (measured where it can be run):

1. **The steering thread, live.** Start one with `t3 thread start --provider --model` and a first message naming target threads. Measure that its `t3_thread_send` `mode:"auto"` reaches a busy worker, a coordinator blocked in `t3_thread_wait`, and a `delegate_task` child, and how long each takes. Which model and provider it runs on (a new `models` role in `BRAID.md`, for example `steering`). What happens when every configured provider is over its threshold: use the 3% margin with a small model, or don't pause.
2. **Its job and messages.** Its first message: self-contained, or a small skill. How it finds the targets (the board passes them: running threads per braid and provider from its snapshot). The pause message (reuse limits.md's), collecting `Paused:` replies, an agent that never answers, `braid pause --by board` per braid. Its thread title and role emoji. Whether it ends and is archived, or is left idle.
3. **Resume.** The board's clock at reset plus buffer, the re-check, and the resume message (a queued `t3 thread send` to idle threads, or a steering thread again). Then `braid resume`, a resume missed while the board was down, and a weekly window (a push plus a request: wait, or move the role).
4. **Who else checks.** Whether coordinators keep only the check before a launch, and what happens when no board runs (nothing pauses: say what that means). What a PM still does.
5. **Rules.** How the board's new self-started actions fit the click-only rule and the state-file rule of `docs/board.md`. One paused braid when two boards run. A steering thread that fails.
6. **The board and the phone.** Mockups on demo data (`braid board --demo`) of where each provider's usage shows (header strip, details) and of the paused state the board started. Each push's title, body, tag and priority. The user reviews them before the build.

Then propose B to D: their scope, sizes and any change to the plan.

## Already decided

- See the braid's brief: the steering thread, the board's own clock, the limits-only change to the click rule, 0061's thresholds and reading rules, and the workers' pause messages unchanged.
- A spike produces a report and mockups in its item folder; nothing in `docs/` or the skills changes before the user decides.

## Out of scope

- Building any of it; changing T3.

## Completion

- [ ] `report.md` answers questions 1 to 6 with confidence and evidence, and proposes B to D
- [ ] The steering thread's reach measured live on a busy worker, a coordinator in `t3_thread_wait` and a `delegate_task` child, with times
- [ ] Mockups of the board's limits view and the push texts, from demo data, in the item folder
- [ ] `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
