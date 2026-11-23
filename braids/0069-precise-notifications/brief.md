---
id: '0069'
title: "Precise notifications"
status: In Progress
labels: ["kind:story", "tier:M"]
dependencies: []
related: ['0064', '0067']
delivery: epic
autonomy: free
---
## Goal

braid's phone notifications (ntfy, sent by the running board) fire only when someone explicitly needs the user, and every notification opens, when tapped, the thread that needs the user (the coordinator's or the PM's). Explicit needs: a request addressed to the user; a PM forward or escalation; the PM's own request; a merge into `main` the user keeps (a story's or final PR's handover, or under a PM the PM's merge request). A lane moving never notifies by itself: a strand PR in To Review that the coordinator may merge under its preset, checks passing, a braid Done under a PM, a derived alarm. The PM can also push directly for things with no board item (the digest, "nothing can run until you act"), through the same ntfy path and privacy rules.

A user can try it: run a braid under a PM and get no notification until the PM or the coordinator asks the user something; tap one and land in the asking thread.

Expected size: about 500 lines in 12 files, over five strands.

## Start here

- `docs/board.md` "Notifications": today's triggers, contents, sending and privacy.
- `src/notify/message.ts` (`pushesOf`: which needs push), `src/notify/notifier.ts` (keys, sends, clears), `src/notify/sender.ts`, `src/commands/notify.ts`.
- `src/board/model.ts` (`derive`, the braid card, `mergeOf`), `src/board/pm.ts` (`routeOf`: whom a request is for now), `src/braids/requests.ts` (the `Request` record: `to`, `by`, `forwarded`, `thread`, `pm`).
- Inbox: `braid inbox show 2026-11-23-brb2`, `braid inbox show 2026-11-22-zmry`, `braid inbox show 2026-11-22-n46f` (the idea this braid is).

## Change

- 0069/A: the two leftovers (a forwarded merge handover of a Done-stamped story that never reached the user; a lost one-shot limit push).
- 0069/B: one rule in code, from the request record, decides what pushes and which thread it opens.
- 0069/C: merges waiting for the user's merge under a PM: one push per PM, updated in place.
- 0069/D: `braid notify send` for the PM's own pushes with no board item, and the braid-pm skill's lines that use it.
- 0069/E: docs.

## Already decided

- The user (via the PM): "So what I need to ship ASAP is better more precise notifications only when pm really needs me. Or coordinator if running without PM (now for example I get notifs "to review" while noone asked / required me explicitly".
- Idea 2026-11-22-n46f is this braid; its open questions are settled below.
- T3's own notifications are out of scope: "I don't care about T3 notifs. I want to rely on braid notify and ntfy for the moment (BTW it always should contain a coordinator / PM thread link that needs my attention: now it doesn't all the time)".
- Several PRs ready for the user's merge: one notification for whatever is waiting, updated in place when another joins (ntfy sequence id), opening the PM thread: "if they do, I'm OK if I only get one notif with 2".
- No Done notification for a braid a PM runs: the PM's after-merge "have a look" request covers it (the user chose A).
- Programme rule: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". One rule in code (who a request is for, from the request record: `to`, `by`, `forwarded`) instead of new prose in the skills; no new state file or state kind when the request record can carry it; skills come out no longer than they went in.
- Decided by the coordinator (cheap to reverse; settles n46f's open questions):
  - No per-machine `mode` setting: with the one rule there is nothing left to choose between. A later braid can add it if the user asks.
  - No new lane or filter: a request to the PM keeps showing as "the PM is handling" on its card, as today.
  - Derived needs never push: a broke alarm (`checks failed`, a braid's `stalled`), an agent's pending question in T3, a Done-stamped story waiting for its handover (To Review with no request). They stay on the board. The one exception (the PM's change at approval): a programme's stall (`pm/<slug>`, Waiting, stalled) still pushes, opening the PM's thread, because a dead or silent PM thread has no one else to ask. A later programme braid ("The board nudges stalled threads", P6) turns a braid's stall into an explicit request when it needs the user.
  - A braid Done pushes only when no programme runs it (as today, default priority); under a PM it never pushes.
  - The thread a push opens: the PM's own request and a forward open the PM's thread; a request to the user, or one escalated by timeout or a gone PM thread, opens the asking thread (the request's `thread`, else the braid's coordinator). A push whose thread can't be named is not dropped: it says so in its body.
  - Direct PM pushes go through braid's ntfy path (`braid notify send`), never T3's push tool.
- P3 ("Questions on record", next programme braid, own branch) owns the question record (history, short codes, withdrawn state, who answered). Here the rule is written as a function of a request's addressee and state, so P3 can extend it; don't build the record here.
- Related to 0064 (The board watches provider limits, on `braid/0064-the-board-watches-provider-limits`, final PR #251): it also changes `src/notify/` and the board. Code strands start only after 0064 is merged into `main`, and `main` is merged into this braid branch first.
- Related to 0067 (Sweep: programme manager naming and escalation; board token address at login, on `braid/0067-sweep-programme-manager-naming-and`): it touches `src/commands/board.ts` and the braid-pm skill's escalation wording, not `src/notify/`. Whichever merges second merges `main` and keeps both sides of any braid-pm skill line.

## Out of scope

- T3's own notifications (muting threads, its push tool).
- The question record of P3: history, short codes, withdrawn state, who answered.
- A new lane, filter or per-machine notification mode.
- The board as a Windows service (0067 and later).

## Completion

- [x] Under a PM, a braid run end to end (plan, strands merged under the preset, final PR) sends no push until the PM or the coordinator asks the user something; tests cover each "never pushes" case of the goal
- [x] Every push opens the thread that needs the user (tests: the PM's request, a forward, an escalation, a request to the user, a merge group, a programme's stall)
- [x] A forwarded merge handover of a Done-stamped story shows on the board and pushes once (leftover 2026-11-23-brb2)
- [x] Several merges waiting for the user under one PM are one push, updated in place, cleared when none is left
- [x] The PM can push a line with no board item through `braid notify send`, with the same privacy rules
- [x] Skills changed by this braid are no longer than before
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
