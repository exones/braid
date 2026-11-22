---
programme: autonomous-dev-machine
title: Autonomous dev machine
goal: An autonomous agentic software development machine
thread: 9b3a8157-f696-45de-ac39-f35a4a90cf9b
limit: 2
state: running
hold:
next: Planning session with the user continues; P0 runs meanwhile
digest:
rows:
  - P0 | - | Coordinators stop waiting in the foreground | running
  - P1 | 0064 | The board watches provider limits | running
  - P2 | 0067 | Sweep: PM naming and escalation; board token address at login | planned
  - P3 | 0060 | Workers as T3 subagents | planned
---
# PM plan: Autonomous dev machine

The front matter above is what the board reads; `braid check --plan pm/autonomous-dev-machine.md` checks it before every push.

Branch: `pm/autonomous-dev-machine`

Draft: the user and the PM are still planning. The working notes are in [autonomous-dev-machine-notes.md](autonomous-dev-machine-notes.md); this plan is written from them when the user says so. The row order is provisional, except P0, which the user asked to run at once. 0064 runs under its own coordinator, not yet launched by this PM.

## Goal

"a long-running programme to make a autonomous agentic software development machine" (the user, 2026-11-22)

## Decisions

- 2026-11-22, user, on P0: "very annoying thing to fix almost immediately: now coordinator waits for subordinate threads in foreground. remove it, it puts arriving messages in the queue"; "yes" to running it now as a small story; "now we have workers wake the coordinator + board detects stale coordinator so we are covered".
- 2026-11-22, user: 0064, 0067 and 0060 are in the programme as its first braids, "order we will discuss".

## Braids

| Row | Sketch | Braid | Coordinator thread | Depends on | State |
| --- | --- | --- | --- | --- | --- |
| P0 | Coordinators stop waiting in the foreground: the coordinator ends its turn and is woken by events, so messages from the user and the PM no longer queue behind t3_thread_wait and braid wait | - | mcp:launch:c419718a1a923226aae4fd04259b64cecbd21c5cd9e70288b871e599f7a7e9bc | - | running |
| P1 | The board watches provider limits | 0064 | its own coordinator | - | running |
| P2 | Sweep: PM naming and escalation; board token address at login | 0067 | - | P1 | planned |
| P3 | Workers as T3 subagents | 0060 | - | - | planned |

## Next

The planning session with the user.

## Change log

- 2026-11-22 23:20Z: P0 launched at the user's request ahead of the rest of the planning; plan running.
- 2026-11-22 22:00Z: plan started as a draft, held while planning; notes file added.
