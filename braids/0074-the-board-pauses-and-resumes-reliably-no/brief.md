---
id: '0074'
title: "The board pauses and resumes reliably: no LLM retyping, early resume, the new usage cache"
status: In Progress
labels: []
dependencies: []
delivery: epic
autonomy: free
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


Since then the steering thread failed twice more: at 03:06 and 13:44 on 2026-11-24 it paused 0 of 18 (inbox ideas 2026-11-24-bh9u, 2026-11-24-osda). It targeted stale threads (finished workers included), both projects' boards act on one provider account, and the model gave up on the target list it was given. And T3 now leaves `resetsAt` off a window at 0%, which blinds `braid limits` for Claude_Everix again.

Also taken in: 2026-11-24-9xc7 (one acting board per provider account and repository: double wakes, lost limit pushes, the steerer's multi-project matching), 2026-11-24-q1bm (pause only braids with agents; no unreachable reply thread), 2026-11-25-hooh (a strandless braid's coordinator isn't counted in its stall), 2026-11-25-boj7 (stale or unreadable limits warn loudly).

## Strands

| Strand | What | Tier | After |
| --- | --- | --- | --- |
| 0074/A | Limits read a window that shows no reset (urgent; early PR into `main`) | S | |
| 0074/B | One acting board per provider account and repository | L | |
| 0074/C | The board pauses by code and counts the replies | L | B |
| 0074/D | Resume now, early resume and the PM-led resume (`ui`) | L | C |
| 0074/E | Blind limits warn loudly (`ui`) | M | A |
| 0074/F | A strandless braid counts its coordinator before it reads stalled | S | |
| 0074/G | Docs: the whole, and shorter limits prose in the skills | L | all |

## Already decided

- The board pauses and resumes in code; no LLM sits in the path, and no model types a thread id (the programme: "lean more to reliable calls like with requests").
- Direct pause plus PM-led resume (above). The escalation safety net stays: a failed or partial pause shows loudly and reaches the PM (the user: "I like that it escalated… This is a nice safety net").
- Skills don't grow; this braid shrinks the steering prose (the programme: "don't overblow skills, try to see how to make easier, don't create spaghetti states").
- 0074/A ships early as a PR of the braid branch into `main`, like 0075's #296 (the user, through the PM: answer a). `main` stays the user's merge.
- Related to P24 "The board stays fast under load" (a later braid, not created yet): it touches the board's request path and the git runner; 0074 leaves both alone and goes first. 0072 (Questions say what they unblock) runs later; no shared files beyond docs. No braid runs at the same time as this one.
- `models.steering` in BRAID.md becomes unused; BRAID.md is the user's, so 0074/G proposes its removal at the final PR.

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

## Working at the end

At a threshold the acting board sends every working agent its own pause text by code, with no reply thread to mistype, counts the replies from the threads and shows a failed pause loudly; `braid limits` reads the cache after a reset, a window with no reset included, and warns when it goes blind; one Resume now (or a fresh reading under the threshold) brings everyone back, PM-run braids through their PM.

## Completion

- [x] A cache window without `resetsAt` no longer makes a provider's verdict unknown (0074/A, early in `main`)
- [x] One acting board per provider account and repository: no doubled resume, wake or push (0074/B)
- [x] The board pauses by code, only braids with working agents and only working threads, counts the replies and shows a failed pause loudly; no steering thread starts (0074/C)
- [x] Resume now (board buttons and CLI), early resume after a reset, PM-led resume for PM-run braids (0074/D)
- [x] Stale or unreadable limits show an amber blind chip and push once (0074/E)
- [x] A strandless braid with a working coordinator doesn't read stalled (0074/F)
- [x] Docs are true as a whole, and `.agents/skills/` has fewer lines of limits prose than before (0074/G)
