---
id: '0071'
title: "The board wakes, reminds and nudges"
status: Outline
labels: []
dependencies: []
delivery: epic
---

## Goal

Programme pm/autonomous-dev-machine, row P6. One board rule over 0070's request record (P3), no new state: at each refresh the board checks each open wait's "done when"; when it holds, it closes the wait as met and sends the waiting thread one wake message. While it doesn't hold, the board sends the addressee a reminder ("Gentle hourly reminder: I'm still waiting for you", the user's words) at most hourly, or after the addressee's estimate (one call, e.g. `--eta 2h "<why>"`); the waiting card shows "expected by <time>" and never reads as stalled. A missed estimate, or a gone addressee, escalates as a stall. A real stall (idle, no open request or wait, no hold) gets one nudge, then escalates. Nothing while held or paused.

The case: 0069 waited on purpose until 0064 merged and read "Stalled: the coordinator stopped and nothing was asked" (the user: "this is a passive wait: so it also can sometimes never happen"). Also 0070's coordinator, whose background command's wake never came (inbox 2026-11-23-kq5k): the nudge is the safety net.

This is an outline: its coordinator plans it fully when its turn comes, from 0070 as merged.

## Working at the end

A coordinator asks with --done-when braid:<n> and ends its turn; it is reminded hourly, its card shows the wait and never Stalled, and it is woken once the other braid merges into main. An idle coordinator with nothing open gets one nudge.
