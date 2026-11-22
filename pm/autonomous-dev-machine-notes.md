# Notes: autonomous dev machine (planning session)

Free-form notes from the planning session with the user. They become the plan in `pm/autonomous-dev-machine.md` when the user says "convert". The board doesn't read this file.

## Goal (the user's words, 2026-11-22)

"a long-running programme to make a autonomous agentic software development machine"

## Principles

- **Involve the user in planning, not in the work.** "My priority: to be involved as much as possible in the initial planning, and as little as possible during the work."
- **Per-programme say settings.** "Per-programme settings (mb just in MD file) must allow defining where I want to have a say similar to current autonomy settings (maybe just with more precise areas / topics)". So: a programme-level settings block (in the plan file or next to it) with finer areas and topics than today's `ask:` keys (security, data, outward, architecture, dependency, scope). The PM applies it to every braid it runs.

## Ship first (ASAP)

**Precise notifications: a push only when the PM really needs the user, or the coordinator when no PM runs the braid.**

- The user's words: "So what I need to ship ASAP is better more precise notifications only when pm really needs me. Or coordinator if running without PM (now for example I get notifs "to review" while noone asked / required me explicitly"
- What happens today (docs/board.md "Notifications"): the board pushes every item in Needs You **or To Review**, one push per strand need. A strand PR in To Review pushes 👀 at high priority even when the braid's autonomy preset lets the coordinator merge it without the user. 0062 already keeps requests addressed to the PM (`--to pm`) silent and pushes escalations and forwards once.
- Inbox idea 2026-11-22-n46f (pushes only for what needs the user under a PM) is mostly this item. Part of it shipped in 0062 (`--to pm`, forward, escalation). What's left: To Review and other lane-derived pushes that nobody addressed to the user, a `mode` setting, and direct PM pushes (digest, "nothing can run until you act").
- Rule to settle: a push only when someone **explicitly** asked the user (an open request addressed to the user, a forward or escalation, a merge into `main` the user keeps), never because a lane moved.
- Also T3's per-thread notifications: can they be muted for coordinator, worker and checker threads?

## Braids already in (order to discuss)

- **0064** The board watches provider limits (In Progress, D running, E to do).
- **0067** Sweep: PM naming and escalation; board token address at login (To Do; its brief says after 0064 merges).
- **0060** Workers as T3 subagents (Outline; six open questions; overlaps with 0011).

## To review

- **0036** Coordinator polish from the thread review (Outline, from 17 to 19 November): "maybe 36 (needs review and what's relevant): it's already quite 'old'". The PM checks each of its seven strands against what has shipped since (0040 autonomy, 0062 PM, the request flow) and proposes what to keep, drop or move.
- Other open outlines that may belong: 0010 Runs, checkpoints, resuming; 0011 Reports and several agents; 0035 Delivery into main.

## Inbox ideas: all go into the programme (except the HTML one)

The user: "ideas from inbox indeed all have to be turned into this programme work except HTML one" (2026-11-21-xebx, HTML reports, stays out).

Notifications and asking the user:
- 2026-11-22-n46f Pushes only for what needs the user under a PM (see "Ship first")
- 2026-11-19-aeli Needs You says what the answer unblocks
- 2026-11-21-t7b8 Recap after the user answers

Running unattended:
- 2026-11-21-mbb2 Headless board started at login (relates to 0067)
- 2026-11-19-s12b Wait on another braid's completion
- 2026-11-19-buqn Checkpoints with a RESUME HERE section (for 0010)

Quality and learning:
- 2026-11-18-bvcs Workers say how they verified the work
- 2026-11-18-ndmt Review checklist that grows from past mistakes
- 2026-11-18-pwb6 Reviewer captures pre-existing problems instead of dropping them
- 2026-11-18-aske Reviewer reads its rules from the base branch, not the PR
- 2026-11-19-by68 Learnings: workers leave findings for future workers
- 2026-11-19-co8u BRAID.md, AGENTS.md and learnings: one clear place for each
- 2026-11-20-gb5r Use AGENTS.md and CLAUDE.md to make the braid skills work better

Evidence and records:
- 2026-11-19-q6jw Evidence folder per item, with a manifest
- 2026-11-19-ha6j A goal's final report lists where the proof is
- 2026-11-19-cbe0 Decisions say how to reverse them
- 2026-11-18-lpz8 Keep the ledger on its own branch

Board and CLI:
- 2026-11-18-1nfi braid list and view show what the board shows
- 2026-11-19-35gp Board dark theme
- 2026-11-18-vumx Ideas: draft first, and edit entries later
- 2026-11-19-ps6y Two braids can take the same number

Cleanups:
- 2026-11-19-diq9 0040/D leftovers (recap, help, test)
- 2026-11-20-w5cd 0040/E review leftovers (preset source, tier S review, strand ids, digest --since)
- 2026-11-20-gj9u decisions.md D47, D57, D66, D68 point to D73
- 2026-11-20-6ce8 Flaky test at midnight UTC (test/done.test.ts)
- Leftover 2026-11-22-zmry A failed one-shot limit push can be lost on a multi-project board (0064/C review)

## Open points

- Order of 0064, 0067, 0060, and where "precise notifications" goes among them.
- The format and the areas of the per-programme say settings.
- How much of 0036 is still relevant.

## Session log

- 2026-11-22 21:47Z: session started; 0064, 0067, 0060 in.
- 2026-11-22 22:00Z: principles (planning, not the work; per-programme say settings), notifications first, inbox ideas in except HTML, 0036 to review.
