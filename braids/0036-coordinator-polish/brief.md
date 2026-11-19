---
id: '0036'
title: "Coordinator polish from the thread review"
status: Outline
labels: ["kind:story", "tier:L"]
dependencies: ['0040']
related: ['0040']
delivery: epic
---

## Goal

The review of eight coordinator threads (17 to 19 November) and the braid logs found things that cost the user time and that autonomy presets (0040) don't cover. This braid fixes them: what the coordinator does after a merge, questions and answers after a lone story's merge, how mockups, leftovers and recaps are put to the user, decision numbers that collide between braids, and wake-ups for work that is already superseded.

## Working at the end

A story is merged from the phone with one word: the installed CLI and skills are updated as the project says, the user's answer is in the log, and the recap that asked for the merge started with the one thing to do.

## Strands (titles only)

- After a merge: the project's chores (here, installing the CLI and skills from `main`) and one rule for the user's checkout of `main`
- Requests and answers after a lone story's merge (`braid ask` and `braid answer` when the branch is gone)
- Mockups start from the real screen and label each case
- Leftovers and sweeps named with what they are; recaps lead with the action
- Decision numbers that don't collide between braids running side by side
- Wake-ups for a superseded commit or a merged PR

## What was seen

- The user asked twice by hand for the CLI and skills to be installed after a merge into `main` (0024, 0027).
- In 0030 and 0024 the coordinator fast-forwarded the user's checkout of `main`; in 0032 it left it and told the user to pull.
- In 0024 and 0026 the user's "merge it" could not be logged, and in 0032 a sweep question could not be opened on the board: after a story merges, its branch is gone and the user's checkout doesn't have the item yet.
- In 0030 it took four messages to settle which card of a mockup showed what; in 0012 a mockup used text buttons where the board has icons.
- The user asked "Which ones?", "So leftovers all done?" and "Do you propose to absorb the leftovers?" about leftovers named without their content.
- Most of the user's replies came from the phone; in 0012 three follow-ups were needed on how to run the board.
- 0030 renumbered its decision to D63 after `main` took D61 and D62.
- Coordinators spent turns on wakes for a commit already replaced or a PR already merged (0026, 0027, 0012).

## Open questions

- After-merge chores: a `BRAID.md` key naming the command, and does it run in every preset or only where the preset says so?
- The user's checkout: may the coordinator fast-forward a clean `main`, or never touch it (AGENTS.md, "One writer per checkout")?
- Where does a request live for a story that is merged: on `main` through the user's checkout, or outside the checkout as the inbox does?
- Decision numbers: numbered at merge, or named by braid?
- Stale wake-ups: a skill rule (check the head first, say nothing) or a host matter outside braid?
- A running coordinator keeps the skill text it loaded; is a "reload the skill" step after an install worth a line?

Plan it fully when its turn comes, asking the user if needed.
