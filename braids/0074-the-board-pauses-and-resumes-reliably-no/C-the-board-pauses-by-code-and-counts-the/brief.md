---
id: '0074/C'
title: "The board pauses by code and counts the replies"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: ['0074/B']
order: 30
---

## Goal

The LLM steering thread failed in both real pauses: at 03:06 and 13:44 on 2026-11-24 it paused 0 of 18 (inbox ideas 2026-11-24-bh9u and 2026-11-24-osda), and on 2026-11-23 it retyped its own thread id with an extra character, settled 40 s after sending and counted no replies (leftovers 2026-11-23-apcr and 2026-11-23-tr1o). The board now pauses by code: it sends each agent its pause text with `t3 thread send`, every id filled in by code from T3's own output, and counts the replies by reading the threads. No steering thread is started. A pause that doesn't reach everyone shows loudly.

Expected size: about 450 lines in 7 files (much of it removed steering code).

## Start here

- `src/board/steerer.ts`: `pause` (records, then one steering thread) and `follow` (reads its `Steering:` line); both are replaced.
- `src/board/steer.ts`: `targetsOf`, the three pause texts (`workerPause`, `coordinatorPause`, `pmPause`), `steeringMessage` and `parseSteeringLine`.
- `src/braids/pauses.ts`: `Pause`, `PauseTarget`, `Steering` (the record's shape, read by the board's view in `src/board/pause.ts`).
- `src/board/t3.ts`: what the snapshot knows per thread (state, provider, role, `subagent` children, `working()`).
- How the existing sends look: `src/board/wake.ts`, `remind.ts`, `nudge.ts` (`t3 thread send`).
- 0074/B's lease (on the braid branch): the pause runs only on the board that holds the provider's lease.

## Change

- **Which braids:** a braid is paused only when at least one of its agents (worker, reviewer, researcher, coordinator, their subagent children) on the provider is working now by `working()` (inbox idea 2026-11-24-q1bm). An Outline, a braid with no started item, or one whose agents all finished gets no record and no message.
- **Which threads:** in such a braid, its threads on the provider that are working now, their working children (read from T3 by code), and the braid's coordinator even if idle (it would launch new work). Finished workers, archived threads and threads on other providers are never targets.
- **The sends:** the board sends each target its text from `steer.ts` with `t3 thread send` (the worker text to workers, reviewers, researchers and children; the coordinator text with its braid number filled in by code). No text names a reply thread: the agent ends its turn with the line `Paused: <id> at <sha>` (a coordinator `Paused: <number>`). The PM of PM-run braids gets one summary by code (which braids, provider and window, until when): "direct pause, tell the PM". It needs no reply.
- **Counting:** for up to 10 minutes after the sends, each refresh reads each target's thread (`t3 thread show <id> --messages …`): a target that has stopped working and whose last message holds its `Paused:` line is answered; one that stopped without the line is "stopped, no line"; one still working at 10 minutes is no answer. The record keeps answered, total and who didn't answer, as its `steering` part does today (rename it to what it now is; old records stay readable).
- **A failed or partial pause shows loudly:** a send that fails twice, or any target without an answer at 10 minutes, makes the braid's card Needs You (reason `limit`, "paused n/m; no answer: <items with thread links>"), sends the `failed` push once, and messages the PM thread (for a braid without a PM, its coordinator) with the same list: the escalation safety net the user wants kept.
- Remove the steering thread: `steeringMessage`, `parseSteeringLine`, `pickSteering`, `steeringLines` and `steeringTitle` go, and with them the `nosteer` path. A BRAID.md with `models.steering` still reads without error (the role is ignored; `braid limits` says it is unused).
- Tests: the ids sent are exactly T3's ids; an Outline and a braid with only finished workers get nothing; a reply counted from the thread; a silent target at 10 minutes makes the card Needs You, one push and one PM message; two projects on one provider account are paused once, by the acting board.

## Already decided

- Direct pause plus PM-led resume (the user, 2026-11-24: "PM is smarter on that how to restart"): the board pauses every agent directly and tells the PM; the resume is 0074/D.
- The escalation safety net stays (the user: "I like that it escalated… This is a nice safety net").
- No LLM in the pause path (the user: "lean more to reliable calls like with requests"). Decided under the `free` preset; record it in docs/decisions.md.
- `models.steering` in BRAID.md is left as it is; only the user edits BRAID.md. 0074/G proposes removing it.

- Contract with 0060 (Workers as T3 subagents, coordinator thread mcp:launch:d7c4c2f0481745d20d0010431e63e6cfe8d1df98e0426050c240a6c8a82f35e2), agreed 2026-11-25: the pause targets come from the board's T3 snapshot: every agent the snapshot gives an item (worktree workers and every recorded thread in `.braid/reviews.json`, whatever its `role`; a missing role means review), plus the braid's coordinator. The running children are read from that snapshot too, not from a separate T3 list, so 0060/B's recorded subagent workers become targets with no change here. 0074 merges into `main` first; 0060 merges main before its final PR.

## Out of scope

- The resume (0074/D), the stale-limits warning (0074/E), the skills' prose (0074/G).

## Plan

1. `src/braids/pauses.ts`: the record's `steering` part becomes `replies` (`sent`, `outcome`, `answered`, `total`, `got`, `failed`, `noAnswer` with item, thread, link and why). An old record's `steering` is read into `replies`, so old records stay readable. `PauseTarget` gains `link`.
2. `src/board/steer.ts`: `targetsOf` takes only threads working now on the provider (running workers and recorded threads from the snapshot, the running coordinator), returns none when there are none, then adds the braid's coordinator even if idle. The PM gets its own `pmSummary` text (no reply) and stays a target only for the resume. The pause texts name no reply thread: the agent ends its turn with its `Paused:` line. `pausedLine` reads a message. `steeringLines`, `pickSteering`, `steeringMessage`, `parseSteeringLine` go; the `pausing` and `nosteer` pushes go; a partial pause pushes `failed`; `escalation` is the PM's (or coordinator's) message.
3. `src/board/steerer.ts`: `pause` claims the records, then sends each target its text by `t3 thread send <id> -` (text on stdin; one retry), and each PM one summary. `follow` becomes `count`: each refresh for 10 min reads each unanswered target (`t3 thread show <id> --messages 10 --json`): stopped with a `Paused:` line after the board's text is answered. Every target answered or failed, or 10 min passed: the record settles; a partial or failed one pushes `failed` once and messages the PM thread (else the coordinator) with the list.
4. Views: `src/board/pause.ts` (card text, Needs You `limit` "paused n/m; no answer: …" with links), `limits.ts`/`limits-view.ts` and `web/src/Limits.tsx` (the panel's line), `demo.ts`, `commands/board.ts` start line, `braid limits` says `steering` is unused, `steeringTitle` goes.
5. Tests: rewrite `test/board-steer.test.ts` and adjust `board-acting`, `board-limits`; the brief's tests. Docs: board.md, cli.md, getting-started.md, braids-format.md, autonomy.md, decisions.md (new D, no LLM in the pause path).

## Completion

- [x] The board pauses by `t3 thread send` with ids from T3 and starts no steering thread, with tests
- [x] Only braids with a working agent on the provider are paused, and only working threads (plus the braid's coordinator, and its PM's summary) are messaged, with tests
- [x] Replies are counted from the threads within 10 minutes, with tests
- [x] A partial or failed pause shows Needs You on the card, sends one push and messages the PM or coordinator, with tests
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
