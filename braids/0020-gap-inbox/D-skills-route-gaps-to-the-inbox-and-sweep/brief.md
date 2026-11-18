---
id: '0020/D'
title: "Skills: route gaps to the inbox and sweep in batches"
status: Done
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0020/A', '0020/F', '0020/B', '0020/E']
order: 40
---

## Goal

The braid coordinator skills use the inbox. Gaps are routed by the braid's fixed table without asking the user, and leftovers are captured before the handover. The coordinator proposes one sweep story of leftovers at the batch points, and turns an idea into braids only when the user asks.

Expected size: about 60 to 120 changed lines in 5 to 7 files under `.agents/skills/`, plus docs.

## Start here

- `../brief.md`: the routing table, the two kinds, the thresholds, the sweep rule and the writers of `braid-inbox`. The reports of 0020/A, 0020/F, 0020/B and 0020/E give the command names and the `braid-idea` skill.
- `.agents/skills/braid/SKILL.md`:
  - "Side ideas get a home" (Ground rules)
  - "Accept and hand over", step 1 (non-blocking findings) and step 4 (handover)
  - "After the merge"
  - "Plan", step 1
  - "Talking to the user" (the recap)
- `.agents/skills/braid/assets/brief.md`: the log entry and `report.md` templates (`For later items:`).
- `.agents/skills/braid/references/workflow.md` ("One writer per branch"), `.agents/skills/braid/references/auto-mode.md`, `.agents/skills/braid-worker/SKILL.md` (report lines), `.agents/skills/braid-reviewer/SKILL.md` (blocking or not).
- D47 in `docs/decisions.md`: each rule is stated once.

## Change

- The routing table replaces "Side ideas get a home". State it once, in the workflow or the coordinator skill as D47 says, and link to it from the other skills.
- The workflow's "One writer per branch" names `braid-inbox` as the exception: written only by braid commands.
- The coordinator captures with `braid note`, before `braid handover`:
  - non-blocking findings it doesn't fix in the PR (leftovers, `from: review <id>`)
  - the report's `For later items:` and unfinished bits (leftovers, `from: <id>`)
  - the user's side observations while an item runs, at once: a new idea written as the `braid-idea` skill describes, or a leftover when it is about the work at hand
- How to write a leftover, stated once with one example. Write a title line, then two to five lines for an agent who never saw the item: what is wrong or missing, where (files, functions), and why it matters. Always give `--from`, plus `--ref` with the review comment or PR link when there is one. Never write a bare pointer such as "see the report".
- The braid log line's `For later items:` names the entry ids instead of repeating the text; the template in `assets/brief.md` changes to match.
- The sweep, for leftovers only:
  - At any recap with 3 or more open leftovers, or before planning the next braid (with at least one), the coordinator proposes one sweep story (`kind:task`, label `sweep`, the lowest tier that fits) with `braid ask --kind decision`. The proposal says which leftovers go in and which are dropped and why.
  - It records the answer with the sweep commands. The leftovers that go in are taken into the sweep story, whose brief copies each one's text, source and links, which runs after the current braid. At most one sweep is pending: a later proposal adds to that story's brief.
  - Before planning the next braid, the proposal may also offer to fold a related leftover into the braid being planned.
  - A big leftover becomes its own braid, or is dropped and noted again as an idea.
  - Auto mode never decides a sweep.
- Ideas: the coordinator never proposes them for review. When the user asks for an idea to become a braid (or several), the coordinator plans from it as from any goal and takes it into those braid ids.
- The recap's "Sweep due" line comes from the draft (0020/B); the skill says to keep it and never to list entries or ideas in a recap.
- The skills check that `braid inbox` runs before the first capture, and follow the setup reference if it doesn't.
- The worker's and the reviewer's skills keep reporting `For later items:` and non-blocking findings as now, and the coordinator captures them. Change them only where their wording now conflicts.
- `README.md` (the braid skills section) and `docs/decisions.md`, if they describe the old rule.

## Already decided

- The routing table, the two kinds, the thresholds, the sweep label and timing, and the inbox branch are in the braid's brief; don't reopen them.
- The user asked for these changes to `.agents/skills/` in this goal, and the user merges them.

## Failure modes and regression tests

- The docs gate (`npm run verify`) checks the skills' links; it must pass with the new wording.
- A coordinator whose installed `braid` has no `braid inbox`: the check above catches it.

## Out of scope

- CLI or board code (0020/A, 0020/F, 0020/B, 0020/C). The `braid-idea` skill itself (0020/E).

## Completion

- [x] "Side ideas get a home" is replaced by the routing table, stated once and linked from where it applies; the workflow names the `braid-inbox` exception
- [x] The coordinator skill captures non-blocking findings, `For later items:` and the user's side observations with `braid note` before the handover, in the right kind, and the log line names entry ids
- [x] The skill states how to write a self-contained leftover (title, what, where, why, `--from`, `--ref`), with one example
- [x] The coordinator skill proposes a sweep story of leftovers at 3 open leftovers or before planning, records the answer with the sweep commands, runs it after the current braid, never in auto mode, and never proposes ideas for review
- [x] The skills check for `braid inbox` before the first capture
- [x] No other rule in the skills contradicts the new routing (searched for, and the search listed in report.md)
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Workflow: a new section "Gaps and the inbox": the two kinds, the routing table, how to write a leftover (one example), and "One writer per branch" names `braid-inbox` as the exception (braid commands only). Stated once there, for every role.
2. Coordinator skill: "Side ideas get a home" becomes a short rule linking the table; capture with `braid note` before `braid handover` (review findings, `For later items:`/unfinished bits, the user's side observations at once); the `braid inbox` check before the first capture; a "Sweep" section (triggers, `braid ask --kind decision`, take/pass/drop, one pending sweep story after the current braid, fold into the next braid, never in auto mode); ideas only on the user's request (Plan step 1); the recap keeps "Sweep due" and never lists entries.
3. Brief template: the braid log line's `For later items:` names entry ids; the report line separates notes for later strands from gaps.
4. Worker and reviewer skills: only where wording conflicts.
5. docs/decisions.md: D56 with its log line; README only if it describes the old rule.
