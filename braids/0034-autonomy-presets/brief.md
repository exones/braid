---
id: '0034'
title: "Autonomy presets: you choose what braid decides"
status: In Progress
labels: ["kind:story", "tier:L", "auto"]
dependencies: []
related: ['0029']
delivery: epic
---

## Goal

The user spends most of their time in a braid on answers that decide nothing. In the eight coordinator threads of 17 to 19 November about 25 of their messages were a bare "merge", "go" or "approve", a planning PR waited 221 minutes for "merge it" after the plan was already approved, and six messages were nudges to a coordinator that said "waiting" with nothing to wake it. Auto mode is the only switch, it is all or nothing, and it stops on every stop case however small. After this goal the user picks, per project and per braid, an autonomy preset: a short Markdown file that says what the coordinator merges and starts by itself and, per stop case, where "decide yourself" ends and "ask me" begins. What the coordinator decides it writes down, and the user reads those decisions together at the recap.

Expected size: about 1,100 lines in 35 files over six strands.

## Strands

- 0034/A `braid wait`: a wait for the braid branch's CI that ends in a wake, used after a merge the coordinator made itself. The prerequisite for more autonomy: with fewer handovers nobody notices a stall.
- 0034/B One answer approves the plan: the approval covers the planning PR's merge and the start, and the plan names the braid in its first line.
- 0034/C Preset files: the format, the three presets `careful`, `steady` and `free`, the `autonomy` field of a brief and of `BRAID.md`, `braid autonomy`, and the `braid check` rules.
- 0034/D `braid accept --merge --preset` merges only what the preset allows; `Decided:` log lines are listed by `braid decisions` and appear in recap drafts.
- 0034/E The three skills run on presets: auto mode becomes the autonomy reference, the stop cases are judged against the preset's table, the worker logs its own decisions and the reviewer checks them.
- 0034/F `BRAID.md`, `AGENTS.md`, the README and the docs name the presets instead of auto mode, with the decision that replaces D31's auto mode.

## Already decided

All from the user, 2026-11-19, in the thread that planned this braid:

- A preset is one short Markdown file: front matter for what the CLI can enforce, and a table with one row per stop case and the columns "Decide yourself when" and "Ask me when". The dimensions are the eight existing stop cases, not a new list.
- Every row is the user's to write, `security`, `data` and `outward` included: a low-stakes project may delegate them. `braid check` warns about a preset that does, and never refuses it.
- The tier restricts nothing: a tier L strand may be merged by the coordinator like any other. Tier L still means the deeper review (independent reviewer, re-check, failure modes). A preset may add the line "Tier L items: always ask"; `careful` does.
- Evidence for a merge never depends on the preset: green `ci` checks, an independent review with nothing blocking and the reviewed head commit, at every level.
- Every decision the coordinator or a worker makes under a preset is logged as `Decided: <what>, because <why>, instead of <alternative>`, and the user sees them together in recaps.
- Plan approval and mockup rounds stay with the user in every preset. A key for skipping plan approval comes with an unattended mode, not here.
- A braid's preset is set only at the user's request (in the plan they approve, or later in chat), and preset files count as `process`: an agent's change to one always reaches the user.
- `delivery` (braid branch or straight into `main`) is a separate setting, planned as braid 0035; the default stays `epic`.
- Related to 0029 (Sweep: leftovers from 0027, on `braid/0029-sweep-leftovers-from-0027`): it edits one line of `.agents/skills/braid/assets/brief.md` and raises the CLI version for a brief format change; 0034/C adds a brief field too, and 0034/E edits the same template. No contradiction. 0029 runs first; whichever lands second merges `main`.

## Out of scope

- Strands that land on `main` without a braid branch (0035).
- The other findings of the thread review: chores after a merge, questions after a lone story's merge, how mockups, leftovers and recaps are put to the user, decision numbers, stale wake-ups (0036).
- An unattended mode that starts a braid without plan approval.
- Board controls for the preset; the board only shows what the briefs say.

## Completion

- [ ] A coordinator that merged a strand itself is woken when the braid branch's CI ends
- [ ] One approval of a plan merges the planning PR and starts the first strand
- [ ] A braid runs on a named preset, from its brief or the project default, and `braid autonomy` prints it
- [ ] The coordinator merges and decides stop cases as the preset says, and its decisions show in the recap
- [ ] No skill, doc or project file still describes auto mode as the way to delegate
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
