---
id: '0062'
title: "Programme manager on the board and in notifications"
status: Done
labels: ["kind:story", "tier:L", "ui", "ask:architecture", "ask:process"]
dependencies: []
related: ['0061', '0036', '0060', '0011']
delivery: epic
---

## Goal

The `braid-pm` agent (0054) runs a programme: a goal from the user, the braids that deliver it, its gates, and the rules for when to ask the user. It answers the coordinators itself and bothers the user rarely. Neither the board nor the ntfy pushes (0044) know about it:

- Coordinator requests that the PM will answer still show as Needs You and are pushed to the user's phone.
- The PM's own questions to the user are asked only in its chat, so they never reach the board or the phone.

After this goal:

- The board shows each programme and what its PM is handling.
- Requests meant for the PM stay off the user's side and off the phone.
- Every question the PM puts to the user is a board request with an ntfy push.

The user's words (2026-11-21): "the PM is a long-running thread where I can freely say what I want, it routes things, it creates braids as it pleases, runs them in parallel or sequentially … it's not reflected in the board … when braids are managed by PM they no longer need my attention, the reports directed to PM and it's PM that finally filters this out, takes most of decisions and only bothers me rarely, which is also not reflected in the board, and if PM asks me I for sure want to be notified with NTFY … deserves some thinking through and research before taking action."

Expected size: about 1,200 lines in 25 files across the strands after the spike; the spike's report sets the real size.

## Working at the end

- A coordinator's request to its PM shows on the board as being handled by the PM, not in Needs You, and sends no push. If the PM doesn't answer within a set time, or its thread has stopped, the request moves to Needs You and is pushed.
- A question the PM asks the user, and anything the user has to do themselves, is an open request on the board. It is pushed to the phone at high priority, with the PM thread as its click target.
- The board shows each programme: its goal, its braids with their states, what's next, whether it is on hold, its open question, and a button to its PM thread. Braids the PM runs are marked and can be filtered by programme.
- The skills call it a programme manager, and route the PM's questions and the coordinators' requests through the board as built.

## Strands

- A. Spike: programme model, routing, pushes and board mockups (L, ui). It produces the answers and mockups the rest is built from. The user reviews them before B to E are detailed.
- B. Requests addressed to the PM (M): requests get an addressee, and the board and the notifier route by it, with the escalation timeout.
- C. The PM asks you through the board (M): the PM opens requests of its own, pushed to the phone.
- D. The programme on the board (L, ui): the programme card or band, braid marks and the filter, read from the plan file.
- E. Skills: the programme manager routes through the board (L): `braid-pm` and the coordinator's "Launched by a PM" use B and C, under the name "programme manager".
- F. Docs (L, since E edits agent instructions).

B to E stay Outline until the spike's report and mockups are accepted. The coordinator then details them from the report.

## Already decided

- The user, 2026-11-21: a goal with a research spike first. Nothing is built before its report and mockups are reviewed.
- The user, 2026-11-21: the agent is a **programme manager** (British spelling), not a project manager. The spike proposes whether the skill folder `braid-pm`, its thread title (`🧭 <repo> pm: …`) and the `pm/<slug>` branches keep `pm`, which fits both words.
- The evidence comes from the first real PM run: the thread `🧭 dctl-studio pm: working product per specs` (project dctl-studio, 2026-11-21). In it:
  - Every coordinator plan approval, handover and decision the PM answered appeared on the user's board as Needs You.
  - The PM's product questions (Q1 to Q4) were asked only in chat.
  - The user asked: "Would be nice the coordinator left it as a question so that I saw it in the board". The PM made that a standing rule, but only in its own chat.
  - The user asked to see the plan file, mixed up a plan row ("braid 1") with braid 0001, and held all work for a rate limit.
- The board still acts only on the user's click and still writes only its own state files (`docs/board.md`, "Refresh"). Routing and escalation are derived at each read, like the broke alarms; the board doesn't message threads.
- ntfy stays the only push channel, with no new npm dependency (D70).
- Related to 0061 (Pause and resume braids on provider rate limits, on `braid/0061-pause-and-resume-braids-on-provider-rate`): 0061/C changes the board, `braid status` and the stalled rules, and 0061 has the PM pause its braids. This goal's board strands (B to D) start after 0061 merges into `main`. The spike reads 0061's briefs and reports, and treats a PM's hold and a rate-limit pause as one board state if that fits.
- Related to 0036 (Coordinator polish from the thread review, Outline on `main`) and 0060 (Workers as T3 subagents, Outline on `main`): both change `.agents/skills/braid/SKILL.md`, as strand E does. Whichever starts later plans on top of the other; E changes only "Launched by a PM" and the PM skill.
- Related to 0011 (Reports and several agents, Outline on `main`): both show agents' work on the board. This goal shows only programmes and PM routing; 0011's reports and in-braid parallelism stay its own.

## Out of scope

- A PM across several projects (0045 option 4), a PM started on a schedule, and a `braid pm` command that launches a PM.
- Per-programme charters (configurable gates and when-to-ask rules), beyond what the spike names as a later braid.
- Other push channels, and answering a request from the phone, unless the spike finds ntfy action buttons safe and small enough to propose as a strand.
- A notifier that runs without the board (inbox idea `2026-11-21-mbb2`), unless the spike proposes it.

## Completion

- [x] A coordinator's request to its PM shows as being handled by the PM, outside Needs You, and is not pushed; one left unanswered past the timeout, or whose PM thread stopped, reads Needs You and is pushed
- [x] A PM's question to the user is an open request on the board and is pushed at high priority, with the PM thread as its click target
- [x] The board shows each programme with its goal, braids and their states, next, hold and open question, and marks and filters the braids it runs
- [x] `braid-pm` and the braid skill's "Launched by a PM" route through the board as built, under the name programme manager
- [x] The docs from BRAID.md `docs` describe programmes, PM routing and the pushes
- [x] The gate command from BRAID.md passes
