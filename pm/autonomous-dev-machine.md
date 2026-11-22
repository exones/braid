---
programme: autonomous-dev-machine
title: Autonomous dev machine
goal: An autonomous agentic software development machine
thread: 9b3a8157-f696-45de-ac39-f35a4a90cf9b
limit: 2
state: held
hold: 2026-11-22T22:00:00Z planning with the user; the PM launches nothing yet
next: Planning session with the user; notes in pm/autonomous-dev-machine-notes.md
digest:
rows:
  - P1 | 0064 | The board watches provider limits | running
  - P2 | 0067 | Sweep: PM naming and escalation; board token address at login | planned
  - P3 | 0060 | Workers as T3 subagents | planned
---
# PM plan: Autonomous dev machine

The front matter above is what the board reads; `braid check --plan pm/autonomous-dev-machine.md` checks it before every push.

Branch: `pm/autonomous-dev-machine`

Draft: the user and the PM are still planning. The working notes are in [autonomous-dev-machine-notes.md](autonomous-dev-machine-notes.md); this plan is written from them when the user says so. The row order is provisional. 0064 runs under its own coordinator, not yet launched by this PM.

## Goal

"a long-running programme to make a autonomous agentic software development machine" (the user, 2026-11-22)

## Decisions

- 2026-11-22, user: 0064, 0067 and 0060 are in the programme as its first braids, "order we will discuss".

## Braids

| Row | Sketch | Braid | Coordinator thread | Depends on | State |
| --- | --- | --- | --- | --- | --- |
| P1 | The board watches provider limits | 0064 | its own coordinator | - | running |
| P2 | Sweep: PM naming and escalation; board token address at login | 0067 | - | P1 | planned |
| P3 | Workers as T3 subagents | 0060 | - | - | planned |

## Next

The planning session with the user.

## Change log

- 2026-11-22 22:00Z: plan started as a draft, held while planning; notes file added.
