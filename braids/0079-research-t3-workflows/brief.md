---
id: '0079'
title: "Research: T3 Workflows"
status: To Do
labels: ["kind:spike", "tier:M"]
dependencies: []
related: ['0074']
delivery: epic
autonomy: free
---

## Goal

Spike for programme autonomous-dev-machine, row P28 (the user, 2026-11-25: "H. Research"; idea 2026-11-25-c92g, item 8). Question: which parts of braid could run as T3 Workflows (T3 Code v0.1.12, beta) instead of braid code, what would that simplify, and at what cost and risk? The parts to judge: the board's stall wake, reminders and nudges; scheduled steps and timed waits; approvals and requests (`braid ask` / `answer`); the provider-limit pause and resume; the PM's digest; coordinator (and worker/reviewer) launch. For each: **keep** in braid, **move** to a workflow, or **try one small thing**, with evidence. The overall recommendation feeds the PM's and the user's decision whether to plan a follow-up braid. Time box: 4 hours.

Expected size: `report.md` and `sources.md` in this folder; no product code.

## Start here

- T3 v0.1.12 release notes (Workflows: PRs #38882, #38884 and the fixes after them, for example #41202, #41751, #41977, #41989): the release page of https://github.com/pingdotgg/t3code, and a local copy at `C:\Users\exon\AppData\Local\Temp\claude\16d1ed9473cdd88d\64afd607-f1a2-4f69-8ab2-1948e9dc674c\scratchpad\r12.md` (temporary: it may be gone).
- T3's source at the installed version (v0.1.12): the workflow engine and its persistence, triggers (schedule, webhook, issue/PR), `ask`, signals, store, agent steps and typed results, the `t3 workflow` CLI, the `t3_workflow` MCP tool, and the "broadest mode" (Full access) rule for workflow control. Read the code and docs, not only PR titles.
- `docs/board.md`, `docs/decisions.md`, `docs/autonomy.md`: what the board does today and why (the click-only and state-file rules, wakes, reminders, nudges, pauses).
- The braid code per part: `src/board/wake.ts`, `remind.ts`, `nudge.ts`, `waits.ts` (stall wake, reminders, timed waits); `src/braids/requests.ts`, `src/commands/requests.ts` (requests); `src/board/pause.ts`, `steer.ts`, `steerer.ts`, `src/braids/limits.ts`, `src/braids/pauses.ts` (limits); `src/board/pm.ts`, `programme.ts` and the braid-pm skill (digest); `src/commands/start.ts`, `coordinate.ts`, `src/board/t3.ts` and the braid skill's launch steps (launch).
- Earlier T3 research: `braids/0061-*/A-*/report.md` and `braids/0064-*/A-*/report.md` with their `sources.md`; reuse their sources, don't repeat their runs.
- P27's row in the programme plan (`git show origin/pm/autonomous-dev-machine:pm/autonomous-dev-machine.md`, row "| P27 |"): its first-pass results on MCP Events, OAuth and Stop cascades.

## Change

Look at T3's source and docs at v0.1.12 (workflow engine, CLI, MCP tool, web UI), the release notes and PRs, braid's code and docs for each part above, and the earlier T3 spikes: about 15 to 30 sources. Read each source rather than its title, record each in `sources.md` in this folder in the [braid-researcher](../../.agents/skills/braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) for claims in `report.md`. Follow braid-researcher's method (competing answers, evidence against).

Answer, each with confidence and evidence:

1. **What a T3 workflow is** at v0.1.12: file and API shape, steps, agent steps and typed results, triggers, `ask`, signals, store; how a run is durable (where its state lives; a T3 restart, a crash mid-step, a reboot, an upgrade); concurrency and rate limits; logging; how runs show in T3 (web, mobile, CLI, MCP). Which access it needs (Full access to start or change runs) and what that means for the board's OAuth "Supervised" sign-in that P27 builds.
2. **Per braid part** (the six in the Goal): what braid does today (files, roughly how many lines and states), how it would look as a workflow, what gets simpler and what gets harder, and a verdict: keep, move, or try one small thing.
3. **Costs and risks**: beta status and churn (the fixes since #38882), Full access, lock-in to T3 (check what the docs promise for use without T3), Windows, persistence across restarts, two sources of truth (braid's record branch and request record versus T3's store), and how a workflow's state would show on the board, or not.
4. **Fit with the programme rule** ("don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests"): does a workflow make a part more reliable, or add a second state machine?
5. **Recommendation**: keep / move / try one small thing overall; if try, exactly what (which part, what a first workflow would do, how to switch it off, what proves it), as a proposed follow-up for the PM.

## Already decided

- The user, 2026-11-25: "H. Research". The output is `report.md` and `sources.md` in this folder; no product code, and nothing in `docs/`, the roadmap or the skills changes before the user decides.
- Don't enable the Labs switch (`workflowsEnabled`) on the user's T3, and don't create, start or change workflows there. Reading T3's source, docs, CLI help and settings is fine. If a live run would change the answer, stop and ask the coordinator (it asks the PM); a scratch T3 that doesn't touch the user's settings or `~/.t3` may be proposed the same way, not started unasked.
- Programme rule (autonomous-dev-machine), quoted: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests".
- Related to P27 "The board talks to T3 directly" (planned by its own coordinator): the board's OAuth sign-in to T3's MCP, MCP Events, Hold and Resume steering. Shared: the T3 integration. This spike only reads and reports; no code overlap. Where an answer depends on P27's results, cite its row and say so.
- Related to 0074 (The board pauses and resumes reliably, on `braid/0074-the-board-pauses-and-resumes-reliably-no`): today's pause and resume, which question 2 judges. No overlap: this spike changes nothing.

## Out of scope

- Building any workflow or braid code; changing T3 or the user's T3 settings.
- Re-deciding P27's design (OAuth, Events, Stop cascade).

## Plan

1. Frame: the decision (plan a follow-up braid that moves parts of braid into T3 Workflows, or not); per part the candidates keep / move / try; what would settle each (access rules, where state lives, whether a workflow can reach braid's existing threads, what the board can see).
2. Read T3 v0.1.12 (tag `v0.1.12`, shallow clone outside the repo): user docs, the `t3-workflows` skill, engine, store, agent steps, MCP tool and its access check, CLI; the release notes and the PRs behind the main risks.
3. Map braid's six parts (code, states, docs and decisions), with a read-only subagent; spot-check its line counts and quotes.
4. Read the user's T3 settings read-only (version, `workflowsEnabled`); no Labs switch, no workflow.
5. Write `report.md` (Q1–Q5, a verdict per part, the overall recommendation) and `sources.md`; run the gate; PR into main.

## Completion

- [x] `report.md` answers questions 1 to 5 with confidence and evidence, with a keep / move / try verdict for each of the six parts and one overall recommendation
- [x] If the recommendation is "try one small thing": the thing, how to switch it off and what proves it, written as a proposed follow-up (not applicable: the recommendation is keep; Q5 gives the revisit triggers instead)
- [x] report.md says what was read and what, if anything, was run; no Labs switch enabled and no workflow created on the user's T3
- [x] Research items only: `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected (none expected: no docs changes before the user decides)
- [x] The gate command from BRAID.md passes (on the identical code: see report.md, Validation)
- [x] report.md written: what changed, why, validation, anything open

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
