---
id: TASK-2
title: 'Ground research: a new braid CLI, board and T3 automation'
status: In Progress
assignee: []
created_date: '2026-11-12T20:01:00Z'
updated_date: '2026-11-13T15:40:00Z'
labels:
  - kind:spike
  - tier:M
milestone: m-1
dependencies: []
documentation:
  - >-
    backlog/docs/doc-4 -
    TASK-2-report-research-results-and-the-users-decisions.md
  - backlog/docs/doc-1 - TASK-2.1-report-Backlog.md-as-braids-reference.md
  - backlog/docs/doc-3 - TASK-2.2-report-the-boards-path.md
  - backlog/docs/doc-2 - TASK-2.3-report-how-the-braid-CLI-could-be-built.md
ordinal: 20
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Goal: the ground research for a new braid: a CLI that tracks tasks, a board, and eventually automation of T3 (starting and following agents). Decide how to build it (fork Backlog.md and adjust it, wrap it, or reimplement with its code as a reference) and the smallest path to a board that shows derived states and can start agents. The user decides from the spikes' answers.

Subtasks, in order:
- TASK-2.1: Backlog.md's implementation as a reference, and fork or reference.
- TASK-2.3: how the braid CLI could be built, with an estimate per way and the licence.
- TASK-2.2: the board's path: starting agents, derived states, the first version.

Already decided (don't re-investigate):
- Backlog.md stays the store until braid reads the same files, so existing tasks need no conversion (roadmap).
- The current braid CLI (`src/`, the `.braid/` ledger) and the roadmap's stages built around it are dismissed: the new CLI starts fresh and needn't fit them.
- Spikes recommend; the user decides. No product code or skill changes in this goal.
- Backlog.md source for reading: github.com/MrLesk/Backlog.md at tag v1.55.3 (MIT), the version braid pins.

Out of scope:
- Building the board or the tracker.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No product code or skill changes
- [ ] #2 All three spikes are Done on the epic branch
- [ ] #3 docs/backlog-md.md, docs/braid-cli.md and the roadmap give the user a recommendation on fork, wrap or reimplement, the CLI estimate, and the board path with its first version and follow-up goals
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 The gate command from BRAID.md passes
- [ ] #2 Final summary written: what changed, why, validation, anything open
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-11-13 User decided (on TASK-2.1): leans to reimplementing a compatible Node tracker with Backlog.md as the reference, then growing the product (richer UI, checkpoints, reports, better resuming, multiple agents, running a task from the board); follow-ups as bigger stories with phases. UI: modern libraries, minimal but functional, a board with several lanes defined later. Plan changes: TASK-2.3 now details reimplementing (fork and wrap only roughly) and adds the UI stack; TASK-2.2 proposes candidate lanes.

2026-11-13 TASK-2.1 merged: PR #54, f11fe6e. Done: docs/backlog-md.md maps Backlog.md 1.55.3 (66.6k product lines, 88.5k test lines, Bun only, MIT, one maintainer in practice) and recommends reimplementing a compatible Node tracker with it as the reference, wrapping its CLI during the transition; review not blocking, three factual corrections applied. For later items: the board shows the working copy first (selectTaskRecord), not the newest; the compatible subset is a rough 5k-8k lines for TASK-2.3 to confirm.
Plan changes: TASK-2.3 and TASK-2.2 adjusted to the user's lean (see the note above). User decided: leans to reimplement (see above).

2026-11-13 TASK-2.3 merged: PR #55, 77d22f8. Done: docs/braid-cli.md: a fresh Node tracker compatible with Backlog.md's files (5.1k-7.1k product lines; 7.5k-11.1k with the board), React 19 + Vite 8 + Tailwind 4 + Radix served on 127.0.0.1, six follow-up goals with phases (read-only board, compatible task commands, coordinator commands, board actions, following agents and resuming, reports and several agents); review not blocking, five corrections applied. For later items: TASK-2.2 supplies the lanes and derived-state rules for goal 1; actions are buttons, not drag; run state lives in untracked runs/ records.
Plan changes: none. User decided: none yet on the way and goal order; licence open (the repo is public with none).

2026-11-13 Plan change (user's request): spike outputs are reports attached to their tasks in backlog/docs (doc-1 TASK-2.1, doc-2 TASK-2.3, doc-3 TASK-2.2), marked research, not decisions. docs/backlog-md.md and docs/braid-cli.md are removed and the roadmap's proposed section is taken out, all in TASK-2.2's PR #56. The coordinator's plan had wrongly sent spike output to docs/. Decisions still open: the way (user leans to reimplement), lanes A/B/C, T3 reading in goal 1, licence.

2026-11-13 User decided (after the three reports):
1. Way: rewrite, a compatible Node tracker with Backlog.md as the reference, sized to what braid needs (a custom tool, fewer features than Backlog.md), not a fork or a wrap.
2. Board lanes: To Do · In Progress · In Review · Waiting · Done. To Do: not started; unmet dependencies show as a badge. In Progress: agents move it by themselves (worker, CI, the reviewer agent, fix rounds). In Review: the user's normal step, the recap handed over for their review and merge. Waiting: stuck until the user acts, with the reason shown: a stop case or question, fixes still failing after two review rounds or a second red CI, an agent stopped with no PR, failing checks nobody fixes; more reasons may be added later, not more lanes. A goal is one card in its most urgent subtask's lane and expands to its subtasks.
3. Reading T3 (read-only) belongs in goal 1, the first board.
4. Licence: MIT; a LICENSE file and package.json field come as a separate story, on the user's go.
These replace the reports' lane options A/B/C and the open "way" question; the reports stay as research.
<!-- SECTION:NOTES:END -->
