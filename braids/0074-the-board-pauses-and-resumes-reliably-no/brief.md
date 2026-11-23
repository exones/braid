---
id: '0074'
title: "The board pauses and resumes reliably: no LLM retyping, early resume, the new usage cache"
status: Outline
labels: []
dependencies: []
delivery: epic
---

## Goal

Programme pm/autonomous-dev-machine, row P21 (the user: "add this adjustment not far from now"). From the first real weekly pause (2026-11-23 23:31, steering thread mcp:ea3bcdca-37c2-…, codex / gpt-6-luna, 17 targets in two projects): the pause reached everyone and everyone paused and later resumed, but:
- the steering model retyped its own thread id with an extra character, so no reply could reach it (agents relayed through coordinators and the PM);
- it reported "paused 0/17, no answer: everyone" and settled 40 s after sending, instead of collecting replies for up to 10 minutes; later replies got empty answers and were never counted, so the board's record says 22 agents didn't answer;
- after the user's usage reset there is no early resume: the board waits for its resume time; the user's "unpause all" in the steering thread sent a generic resume but left the board's records (the PM cleared them by hand);
- since the reset, T3 writes `usageLimits.windows` as an object keyed "0", "1", "2" plus `resetCredits`, so `braid limits` reads "unknown" and the board's pause is blind for Claude_Everix.
Fix, in the spirit of "reliable calls": the board sends pause and resume messages itself with `t3 thread send` (as it already does for the resume), ids filled in by code; replies are counted from the threads; one "resume now" action (board button and CLI) clears every board pause and sends the resumes, for a usage reset; `braid limits` reads the new cache shape. Drop the LLM steering thread, or keep it only to relay the board's text verbatim; the coordinator decides with evidence. Inbox 2026-11-23-apcr, 2026-11-23-oa4d, 2026-11-23-tr1o.

This is an outline: its coordinator plans it fully when its turn comes.

## Working at the end

At a threshold every agent gets the board's own pause text with the right reply id, its replies are counted, braid limits reads the cache after a reset, and one Resume now brings everyone back at once.
