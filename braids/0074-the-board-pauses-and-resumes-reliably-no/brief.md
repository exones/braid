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

Decided by the user (2026-11-24): direct pause plus PM-led resume, "PM is smarter on that how to restart". The board pauses every agent directly (a fast safety stop, the board's own text sent by code) and sends the PM of PM-run braids one summary (which braids, until when). The resume of PM-run braids goes through the PM: the board tells the PM the window is open (or the user's "resume now" does), and the PM decides the order and resumes its coordinators, which resume their agents. Braids without a PM keep the board's direct resume.

The user, 2026-11-24: "would be nice if I could click 'Resume' button on the board for a program or a braid". So "resume now" is a board button on a paused programme's card (it goes to the PM, which restarts its braids in its order) and on a paused braid's card (a PM-run braid: the PM is asked to resume that braid; a braid without a PM: the board resumes it directly), plus the same in the CLI. P5's Hold and Go buttons (deliberate holds) should reuse the same button and path, so the board has one Resume/Go for any pause.

This is an outline: its coordinator plans it fully when its turn comes.

## Working at the end

At a threshold every agent gets the board's own pause text with the right reply id, its replies are counted, braid limits reads the cache after a reset, and one Resume now brings everyone back at once.
