---
id: '0037'
title: "Coordinator asks with the question tool and set options"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
related: ['0036']
delivery: epic
---

## Goal

When the coordinator stops for the user, it asks with the host's question tool (AskUserQuestion in Claude Code, a pending request in T3) and offers the few answers that stop allows, so the user answers with one tap, often from the phone. For a PR handed over to merge, the options are: **Merge now**, **I'll merge it myself**, **Let me see the report**. Today the skill only says "ask with the host's question tool if it has one", without saying when, with which options, or what each answer leads to, so most stops end as plain chat.

Expected size: about 120 lines in 4 files.

## Start here

- `.agents/skills/braid/SKILL.md`, "Talking to the user" (the question-tool line and the open-request rule), "Accept and hand over" step 5, "Merge on request", "Plan" steps 6 to 8, "Run an item" step 6 (converge loop), "Grow and adjust" (mandate), "Sweep" step 2.
- `.agents/skills/braid/references/auto-mode.md`: the sweep proposal while strands go on, and the stops.
- `.agents/skills/braid/references/stop-cases.md`: the keys a stop is asked under.
- `braids/0015-needs-you-when-the-coordinator-waits/A-spike-how-the-board-sees-the-coordinator/report.md`, option D: a question held open blocks the coordinator's turn, so watch wakes and thread messages queue behind it.
- `docs/decisions.md`, D46 (lanes from requests and pending questions) and D47 (one place per rule, context first).

## Change

- `.agents/skills/braid/SKILL.md`, "Talking to the user": one rule for when and how the question tool is used, and the option sets per kind of stop, each option saying what the coordinator does next:
  - **Handover of a PR to merge:** Merge now (as "Merge on request", with the recap's head), I'll merge it myself (unwatch, wait for the user's "merged" or `gh pr list`), Let me see the report (show `report.md` and the recap's link, then ask again).
  - **Plan approval:** Approve, Change something (the user says what), Show me the briefs.
  - **Decision** (a worker's proposal, mockups, a sweep, growth beyond the mandate): the concrete choices, recommended first.
  - **Stop case** (`security`, `process`, `quality`, …): the ways forward the case allows, for example go on as planned, change the plan, stop here.
  The other skill sections only name the option set where they stop (one place per rule, D47); "Other" (free text) is always there through the tool.
- Each option label is short (1 to 5 words) and the question starts with its context (D47), so it reads on its own in the tool's dialog.
- Hosts without a question tool: the same options as a numbered question with lettered answers, as today.
- `.agents/skills/braid/references/auto-mode.md`: a question asked while strands go on (the sweep) is not asked with the question tool (see "Already decided").
- `docs/decisions.md`: a new decision (next free number) with the rule and why.

## Already decided

- `braid ask` or `braid handover` still runs first, so the board shows Needs You; the question tool comes after it, in the same turn. The answer is logged with `braid answer --log -` before acting, as today.
- The question tool is used only when the turn ends waiting for the user alone. While agents or CI still run for this coordinator (auto mode's sweep while strands go on, a planning PR whose checks are pending), the question stays in chat with its open request, so wakes and worker reports are not held behind a pending question.
- Before a handover question, the PR is unwatched (as today), so no watch wake queues behind it.
- A reply in plain chat, or the board's `Merge #<n> at <head>, from the board.` message, is still a valid answer to the open request.
- "Merge now" is a merge on request: same head rule, `braid accept … --merge`; a moved head still means show what changed and ask again.
- Only the coordinator skill and auto mode change; workers and reviewers keep reporting to the coordinator, not asking the user.
- Related to 0036 (Coordinator polish from the thread review, Outline on `plan/autonomy-presets`): its strand "recaps lead with the action" and the phone replies build on this. This story merges first; 0036 takes these option sets as they are when it is detailed.

## Out of scope

- Board changes, new `braid` commands, or answering from the board.
- Worker and reviewer skills.
- 0036's other strands (after-merge chores, requests after a story's merge, decision numbers, stale wakes).

## Failure modes

- A question held open while a watched PR or a worker wakes the coordinator: the wake waits until the user answers. Guarded by the "turn ends waiting for the user alone" rule and the unwatch before handover.
- The user dismisses the dialog or answers in chat: the open request stays on the board, and the chat answer is handled as any reply (`braid answer`, then act).
- "Merge now" picked after the head moved: `braid accept` refuses; the coordinator shows what changed and asks again, never merges another head.
- A host without the tool: the numbered-question fallback carries the same options.

## Regression checks

- The docs gate (`npm run verify`) passes on the changed skills, including any skill-text or link checks it has.
- Walk through each option set against the skill text: every option leads to a step the skill already has, and nothing says "ask the user" without naming its option set.

## Completion

- [x] "Talking to the user" holds the question-tool rule and the option sets (handover, plan, decision, stop case), each option with its next step
- [x] Handover offers Merge now, I'll merge it myself, Let me see the report, wired to "Merge on request", the wait for the user's merge, and showing the report then asking again
- [x] Auto mode's questions asked while strands go on stay in chat, with the reason
- [x] The places that stop for the user name their option set, with no rule stated twice
- [x] A new decision in `docs/decisions.md`
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. SKILL.md "Talking to the user": replace the one-line question-tool rule with a short "Asking" block: when (the turn ends waiting for the user alone, after `braid ask`/`braid handover` and any unwatch; otherwise the question stays in chat with its open request), how (context first, 1–5 word labels, recommended first, "Other" via the tool; no tool: numbered question, lettered answers), and the four option sets (handover, plan, decision, stop case), each option with its next step. Dismissed dialog / chat answer / board merge message stay valid answers.
2. Other SKILL.md stops name their set only: Plan step 6 and 7 (planning PR wait stays in chat), step 8, Run an item step 3 (failed twice → stop case) and 6, Grow and adjust mandate, Accept and hand over step 5, Merge on request (Merge now leads here), Sweep step 2.
3. auto-mode.md: sweep while strands go on stays in chat (reason: a pending question holds wakes and worker reports), and the Stopping paragraph names the stop-case set.
4. docs/decisions.md: D66 (D65 is taken on 0034's branch) plus a log line.
5. npm run verify, report.md, PR.
