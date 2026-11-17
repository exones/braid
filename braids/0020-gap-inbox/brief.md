---
id: '0020'
title: "Gap inbox: small findings and side ideas without a decision each"
status: Outline
labels: ["kind:story", "tier:M"]
dependencies: []
delivery: epic
---

## Goal

Small leftovers stop costing the user a decision each. These are non-blocking review findings, the "two things still to finish" in a report, the worker's `For later items:` and observations the user makes while an item runs. Today the `braid` skill's "Side ideas get a home" rule asks the user each time where an idea goes. Leftover findings and `For later items:` lines are scattered across briefs and reports, and nothing gathers them. This story replaces the per-item question with a fixed routing rule, one inbox per project and a batched decision.

## Working at the end

- A gap found during an item is routed by a fixed rule, without asking the user:

  | Found when | Goes to |
  |---|---|
  | Blocking | the same PR (as now) |
  | Non-blocking, small, in files the PR already touches, before merge | the same PR (the coordinator decides, as now) |
  | Anything else: leftover findings, unfinished bits, the user's side observations, `For later items:` ideas | the project's inbox: one line, with its source (item, PR, review or user) |

- Each merge recap ends with the inbox count, for example `Inbox: 4 (2 new)`.
- When the inbox holds about 3 entries, or before the next braid is planned, the coordinator proposes one **sweep story**: which entries go in, which are dropped and why. The user answers once for the batch.
- An entry passed over in 2 sweeps is dropped and the drop is recorded. The user can bring it back.
- A big observation, such as a new feature, still becomes its own braid. It enters through the inbox, so it doesn't interrupt the running item.

## Strands (rough)

- Inbox storage and a capture command, for example `braid note "<text>" --from <id>`, plus the board and `braid list` showing it.
- Skill and template changes: the routing table replaces "Side ideas get a home". `For later items:` entries go to the inbox when an item is accepted. Recaps show the inbox count, and the sweep proposal happens at the batch points.
- Maybe a one-off sweep that pulls the existing open `For later items:` lines and non-blocking findings from past reports into the inbox.

## Open questions

- Storage: a single `braids/inbox.md`, or inbox entries as braid items with a new `Triage` status. A status reuses the CLI, the board and the per-branch copies but adds a status and a folder per entry. A file is lighter but needs its own handling on the board. Leaning towards a status.
- The thresholds: what counts as "small" for a same-PR fix (lines or minutes), the sweep trigger (3 entries) and the drop rule (2 sweeps).
- Which branch an entry lands on when it is captured during a strand. `main` would need a commit there. Alternatively the entry rides with the item's branch and reaches `main` with its merge.
- Whether a sweep story gets its own kind or label (`kind:task` with `sweep`?), and whether its tier can be fixed at S.
- Whether the one-off import of past leftovers is worth doing.

## Background

Practices compared, from the side chat that proposed this:

- **Fix it in the current PR** ("Boy Scout rule"): good for small fixes in files the PR already touches, but it costs a review and CI round and the scope creeps.
- **Inbox plus batched triage** (Linear's Triage inbox, GitHub `needs-triage`, the GTD inbox): capturing takes no decision, and the deciding happens in batches. This is the core of this story.
- **A parking lot per item**: what braid's `For later items:` is today. Easy to write, never read again.
- **Shape Up**: cuttable nice-to-haves, a cool-down for small fixes and no backlog. Leftovers are dropped unless raised again, which the drop rule borrows.
- **A capacity share for chores** (a Kanban chore lane, or "20% for tech debt"): the sweep story fills that role.
- **Decide at capture by a fixed rule**: the routing table.

Changes to `.agents/skills/` need the user's request and merge (AGENTS.md). This story is that request once the user plans it.

Plan it fully when its turn comes, asking the user if needed.
