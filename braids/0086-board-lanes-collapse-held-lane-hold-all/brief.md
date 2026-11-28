---
id: '0086'
title: "Board lanes collapse, Held lane, Hold all"
status: To Do
labels: ["kind:story", "tier:L", "ui"]
dependencies: []
related: ['0077', '0080', '0083']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P5. The board says truthfully what works, what is held and what is left: every lane collapses like Done; braids under a deliberate hold sit in a Held lane with the reason, who held them and what they wait for, and leave the Working counts; Hold (with a reason) and Go on a braid's card and on a programme; one Hold all that really holds every working thread; finishing a programme is the user's act; the provider chips, the limits panel, `braid limits` and the `limits:` thresholds speak of what is **left**, not what is spent. For the user, who runs several projects from the board.

Expected size: about 2500 lines in 35 files over nine strands, tests included.

## Start here

- The programme row P5 in `pm/autonomous-dev-machine.md` on branch `pm/autonomous-dev-machine`: the goal as the user gave it, quoted below.
- Inbox ideas 2026-11-24-4bwm (derive holds and plan row states), 2026-11-24-l3l3 (Held/Paused and Working groups in the programmes panel), 2026-11-25-b1yb (a hold that doesn't hold: the audit), 2026-11-25-s5o8 (finishing a programme), on branch `braid-inbox` under `ideas/`; leftovers 2026-11-22-7ija, 2026-11-22-yd2t, 2026-11-23-qap7 under `leftovers/`.
- `src/braids/pauses.ts` (the pause and hold record, `.braid/pauses.json`), `src/commands/pauses.ts` (`braid pause`, `braid resume`), `src/braids/plan.ts` (the plan file's `hold:` and `state:`), `src/board/programme.ts` (`heldPauses`, the programme card), `src/board/steerer.ts` and `src/board/steer.ts` (the board's pause by code: targets, texts, the reply count), `src/board/pm.ts` (`routeOf`), `src/board/model.ts` (`LANES`, the lane of a card), `src/braids/limits.ts` and `src/board/limits.ts` (thresholds and chips), `web/src/App.tsx`, `web/src/Limits.tsx`, `web/src/Questions.tsx`.
- `docs/board.md` ("Provider limits", "The board pauses and resumes", the pause mark), `docs/cli.md` ("Pauses", "Provider limits"), `docs/decisions.md` D90, D108, D109, D118, D119.

## Change

- 0086/A: mockups on the board's test data of every UI change below; the user approves before anything is built.
- 0086/B: limits as what is left: `limits:` in the "left" form, `braid limits`, chips, meters and the limits panel; leftovers qap7 and 7ija.
- 0086/C: one hold record: `.braid/pauses.json` is the one place a hold lives, with reason, who and what it waits for; a programme's hold is recorded there per braid and the plan's `hold:`/`state: held` is no longer a second source (4bwm, yd2t).
- 0086/D: every lane collapses; the Held lane; the counts leave held and paused braids out; a forwarded request on a held or paused braid shows in the Questions panel marked held, with no push.
- 0086/E: Hold (with a reason) and Go on a braid's card and on a programme card; the board tells the coordinator or the PM by code.
- 0086/F: Hold all, from the board and the CLI (b1yb).
- 0086/G: finishing a programme: the user closes it, the record says who and when, a Finished group and a Held/Paused group in the programmes panel (s5o8, l3l3); plan row states derived from the lanes (4bwm).
- 0086/H: the braid skills: a hold is stronger than queued or woken work; the PM records holds where the board reads them and asks once to close a finished programme.
- 0086/I: the docs as a whole.

## Already decided

- The hold record (the PM, snowy-rabbit-r7zc): its new optional fields with `by` kept in today's values are approved; 0086/C shows the older-reader check in its report. 0086/H's PR goes to the PM for the user's merge.
- The goal, as the user gave it (P5, quoted; binding): "Every lane collapses like Done. A Held lane for braids under a deliberate hold, with the reason, who held them and what they wait for. A Hold button with a reason, and Go, on a braid's card and on a programme; the board tells the coordinator or the PM (idle: `t3 thread send`; busy: 0064's steering)."
- The user, 2026-11-23: "in provider usage I want to see how much left, not how much spent, so opposite to what's now": e.g. "S 85% · W 20%", and "You can even exclude the word "left" to not take space"; the bar shrinks towards the threshold; the tooltip says "left"; `braid limits` text the same.
- The user, 2026-11-23: "threshold also should be how much left. E.g. at 5% left hold": `limits:` in BRAID.md says the remaining share at which agents hold (e.g. session 3% left, weekly 5% left); the docs, `braid limits` and the board use that form. How the old form is read is the coordinator's call, decided in 0086/B's brief.
- The user, 2026-11-26: "we start with fully filled indicator and it goes from right to the left ... until it hits the pause threshold".
- The user, 2026-11-26 ("it seems that I have like 13 braids working which is not true"): the project row's "working" and the Working lane's count leave out held and paused braids, which sit in the Held lane with their own count; a held card no longer sits in Working.
- The user, 2026-11-27 ("2. E"): a request forwarded to the user on a held or paused braid shows in the Questions panel marked held, with no push (today `routeOf` in `src/board/pm.ts` keeps it with the PM until resume; SFIL's q-seqh and q-h3fq were hidden that way).
- Idea s5o8 (the user, 2026-11-25): "for us there is no way to say that the program is finished. Usually I think it should be the user action." The PM asks once when every row is done; the user closes it from the programme card or by answering; a CLI call records it with who and when; the panel gets a Finished group, collapsed by default, beside a Held/Paused group (l3l3).
- Closing a programme (the PM, snowy-rabbit-r7zc, 2026-11-28: "A. Approve, with the close as a request record"): the close is a request on `braid-requests`, like any answer. When every row is done the PM asks `braid ask pm/<slug> "<programme> is finished: close it?"` with Close and Not yet; the user's Close, from the card's button or by answering, is the record with who and when; `braid programme close <slug>` records the same when no question is open. The board reads a programme as finished from that record (or an older plan's own `state: done`), so nobody but the PM writes the PM's branch.
- Idea b1yb: one Hold all that records per project, reaches every working thread and child by code, counts the threads' own "Held", shows who still works, and never lets the board resume or nudge a held braid.
- Fable's review (4bwm): derive the hold from one place, don't add a third; plan row states could be derived from the lanes.
- Programme rules (the user): "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to reliable calls like with requests". So a hold is one record kind in `.braid/pauses.json`, sent and counted by code with the pause machinery 0074/C built; no new store.
- Out to 0080 (P27, held on the user's sign-in mockup verdict q-nxp6) and 0083's T3 read findings: Hold interrupting every running thread found through T3's thread list, Resume retrying until T3 answers, MCP events instead of the 30 s poll, the sign-in expiry warning. P5 works with today's `t3 thread send` (a send to a busy thread queues behind its turn) and leaves a seam for 0080: one function that delivers a hold or go text to a thread, which 0080 can replace by an interrupt.
- UI items: mockups on the board's own test data first (`src/board/demo.ts`, `braid board --demo`, never port 7800 or the real `~/.braid`); the worker stops for the user's look before building (0086/A; B, D, E, F and G build what it approved).
- Subagents get no parent context: each brief says what its worker needs.
- A clear user answer to an open request is recorded first (`braid answer`).
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`): it changes the board's read path and the programme card count (0077/E) and merges into `main` first; 0086 merges `main` into its braid branch before its final PR, and before 0086/D if 0077 has merged by then.
- Related to P31 · 0084 (Several open questions per item, planned on `plan/several-open-questions`): it changes the cards and the Questions panel and merges into `main` before 0086's final PR; its coordinator tells this one what it changes; 0086 merges `main` before its final PR.
- Related to 0080 (The board talks to T3 directly, on `braid/0080-the-board-talks-to-t3-directly`, held) and 0083 (How braid can read T3 lightly, running): they change the board's T3 connection; 0086 doesn't wait for them and only leaves the seam above.
- P30 · 0085 (braid clean works in repos with submodules) runs at the same time; it touches `braid clean`, not the board.

## Out of scope

- Signing the board in to T3, interrupts through T3's API, MCP events, the sign-in expiry warning (0080, 0083).
- Changing the provider-limits pause and resume rules themselves (0074) beyond reading thresholds as what is left.
- Disk use on the board (P26), several open questions per item (P31).

## Completion

- [ ] Every lane collapses and opens like Done; held and paused braids sit in a Held lane with the reason, who held them and what they wait for, and the Working counts leave them out
- [ ] A braid's card and a programme card have Hold (with a reason) and Go; the hold is recorded in `.braid/pauses.json` and the coordinator or PM is told by code
- [ ] Hold all holds every working thread of the chosen projects by code, counts the threads' own Held replies, shows who still works, and the board never resumes or nudges a held braid
- [ ] A programme's hold lives in one place the board reads; a hold set only in the plan file no longer lets a limit pause through (yd2t)
- [ ] The user closes a finished programme from its card or by answering; the record says who and when; the programmes panel has Finished and Held/Paused groups, collapsed by default
- [ ] A request forwarded to the user on a held or paused braid shows in the Questions panel marked held, with no push
- [ ] The chips, the limits panel and `braid limits` show what is left, the meters start full and shrink to the threshold, and `limits:` reads in the "left" form; leftovers qap7 and 7ija are fixed
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated (0086/I)
- [ ] The gate command from BRAID.md passes

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
