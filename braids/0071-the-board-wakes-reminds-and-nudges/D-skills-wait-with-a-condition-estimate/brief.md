---
id: '0071/D'
title: "Skills: wait with a condition, estimate, answer a nudge"
status: To Do
labels: ["kind:task", "tier:L"]
dependencies: ['0071/C']
order: 40
---

## Goal

The braid and braid-pm skills use what 0071/A to C built, in fewer words: a coordinator or PM that waits on something outside its control opens a wait with a condition (`braid ask … --to <n> --done-when braid:<n>`, or `pr:`, `time:`) and ends its turn; it is woken by the board. An agent that is reminded either gets back to it or sets an estimate with `braid eta`. A wake, a reminder or a nudge from the board is acted on like any message. The skills stop asking agents to close condition requests by hand.

Expected size: about 80 changed lines in 4 files; the word count goes down or stays the same.

## Start here

- The braid's brief (`braid view 0071`) and the reports of 0071/A, B and C (the exact message texts and commands).
- `.agents/skills/braid/SKILL.md`: "Talking to the user" ("Say waiting only when something will wake you", end markers), "Launched by a PM", "Run an item" step 3 (woken without a report), the Watch rule.
- `.agents/skills/braid/references/workflow.md`, `references/autonomy.md`, `references/resuming.md`: where waits or stalls are mentioned.
- `.agents/skills/braid-pm/SKILL.md`: requests the PM opens (`braid ask pm/<slug>`), "After each merge", the live check (and 0071/C's call for a delegated checker, if it needs one).
- `git show origin/pm/autonomous-dev-machine:pm/autonomous-dev-machine.md`, row P6 and the notes: the user's words.

## Change

- braid skill: a wait on another braid or a time is `braid ask <id> "<what>" --to <n> --done-when braid:<n>` (or `time:`), then end the turn; the board's wake is one of the things that wake you. Reminded: get back to it or `braid eta <code> <in> "<why>"`. Nudged: check the state and go on, or open a request or wait. Drop text these make redundant (for example closing a met request by hand).
- braid-pm skill: the same for the PM's waits and merge requests (`--done-when pr:<n>` closes itself), the reminder and estimate as an addressee, the nudge, and 0071/C's call for a delegated checker if there is one.
- Measure words before and after for both skills (and their references) and put the numbers in report.md.

## Already decided

- Everything in the braid's "Already decided"; the programme rule: skill text gets shorter or stays the same size, no new states for agents to track.
- The user merges skill changes into main; this strand merges into the braid branch under the preset.
- The PM, with the plan: the word counts before and after go in the PR body too.

## Out of scope

- Product code. Docs outside the skills (0071/E).

## Completion

- [ ] The braid skill tells a coordinator how to wait with a condition, answer a reminder with an estimate, and act on a wake or nudge
- [ ] The braid-pm skill does the same for the PM, including 0071/C's call if it needs one
- [ ] The two skills (with references) have no more words than before; report.md gives both counts
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
