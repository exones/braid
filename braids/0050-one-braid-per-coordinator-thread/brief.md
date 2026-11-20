---
id: '0050'
title: "One braid per coordinator thread"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process"]
dependencies: []
related: ['0036', '0048']
delivery: epic
---

## Goal

A coordinator thread runs exactly one braid. When the user asks a coordinator that already holds a braid to plan another one (a follow-up picked in a spike's recap, or any new goal sent to a braid's thread), the coordinator doesn't plan it in its own thread. It launches a new top-level coordinator thread, hands over what the user decided, links the new thread and stops. The old thread stays the record of its braid, and the board finds each braid's coordinator by its title.

Expected size: about 40 lines in 3 files, mostly skill text, plus one decision.

## Start here

- What happened: thread `1dcf1816-bae8-4c28-b074-d605c2d2a982` (`🧠 braid 0045 coordinator: Working on several projects: research and design options`). After the 0045 recap the user picked "Option 3, staged" in the same question as "Merge now". The coordinator merged PR #181, then planned and ran 0049 in that thread and never renamed it. `src/board/t3.ts` (around line 261) keys coordinator threads by the number in the title, so 0049 had no Coordinator button and the running thread counted as 0045's.
- `.agents/skills/braid/SKILL.md`, "Ground rules": the thread-name line ("When a coordinator takes a braid (plan or resume), it sets its own thread's title…").
- `.agents/skills/braid/SKILL.md`, "Plan" step 1, and "Accept and hand over" step 6.5 ("After a spike, turn its proposed follow-ups into briefs…").
- `.agents/skills/braid/references/workflow.md`: where it talks about who coordinates a braid, if it does.
- `docs/decisions.md`: D52 (Start launches a new coordinator thread), D67 (Promote to Braid launches one for an idea), and the 2026-11-18 note on thread titles (0023).
- `docs/board.md`, "Start" and "Promote to Braid": how the board's own coordinator threads are launched and what their first message says.

## Change

- `SKILL.md`, "Ground rules": add the rule that a coordinator thread holds one braid. A request for another braid in a thread that already holds one goes to a new coordinator thread. Keep the existing rename rule for the braid the thread holds (a fresh thread that plans or resumes one).
- `SKILL.md`, "Plan" step 1 (or a new step before it): what the coordinator does on such a request:
  1. `t3_thread_launch` a top-level thread on the project's main checkout with the coordinator model from `BRAID.md` and a provisional title `🧠 <repo> coordinator: <short goal>` (the number doesn't exist yet; the new coordinator renames itself after `braid new`, as the rename rule says).
  2. Send its first message with `t3_thread_send`: use the braid skill and plan this goal; the user's words and answers quoted; the source (braid id, report path, PR); any leftovers or inbox entries the old braid routed to it.
  3. Tell the user in one or two lines with the new thread's link, and end the turn. Nothing of the new braid is planned or committed in the old thread.
- `SKILL.md`, "Accept and hand over" step 6.5: a spike's follow-ups that adjust briefs of the same braid stay here; follow-ups that become a new braid go to a new thread as above.
- Hosts without T3: say in one line that the user starts a new coordinator chat with the handover text, which the coordinator writes out for them.
- `docs/decisions.md`: a new decision (the next free number on `main` when the PR is opened) with the reason from the 0045 thread, and a dated line in the decision log.

## Already decided

- One braid per coordinator thread, new thread for a new braid: the user, 2026-11-20 ("wouldn't it be better to start an absolutely new coordinator thread for the new braid? … the old one will also be retained").
- The rule is absolute: no override by asking (user, 2026-11-20, plan approval).
- The new thread gets a provisional title and renames itself after `braid new`; the old coordinator doesn't create the braid number.
- The old coordinator may still ask in its recap which follow-up to plan; only the planning moves.
- No CLI or board change: the board already keys coordinators by title, and that stays the only key.
- The already-running 0049 coordinator in the 0045 thread is handled outside this braid.
- Related to 0048 (The worker owns CI, on `braid/0048-the-worker-owns-ci-the-coordinator-waits`): 0048/C also edits `SKILL.md`, in "Run an item" and "Talking to the user". This story edits "Ground rules", "Plan" and "Accept and hand over" step 6. Whichever merges second merges `main` first and keeps both texts.
- Related to 0036 (Coordinator polish from the thread review, Outline): same skill, other rules. When 0036 is planned it reads this rule as given.
- The skills change only at the user's request, which this braid is; the user merges the PR into `main`.

## Failure modes

- A coordinator mid-braid (workers running, PRs watched) gets a new goal: it must hand off without dropping its own braid's watches or waits. The rule says the old thread keeps running its braid.
- The launch fails (T3 down, model unavailable): tell the user and don't plan in the old thread instead.
- The user explicitly asks to plan the new braid in this thread: the rule is absolute (the board can't follow a thread that switches braids); say why in one line and launch.
- The new thread's first message loses a decision the user made in the old thread: the handover message quotes every answer, and the report's walkthrough checks it.

## Regression checks

There are no tests of skill text. Instead:
- `rg -n "new coordinator thread" .agents/skills/braid/SKILL.md` finds the rule in "Ground rules" and the steps in "Plan".
- `report.md` walks through the 0045 → 0049 case with the new text, step by step, and shows where the coordinator would have launched the new thread and what its first message would have held.

## Out of scope

- CLI and board code.
- Moving the running 0049 coordinator to its own thread.
- The uber-coordinator idea (`2026-11-19-8m40`).

## Completion

- [x] `SKILL.md` "Ground rules" says a coordinator thread holds one braid, and "Plan" says how a request for another braid goes to a new thread (launch, provisional title, first message, link, stop).
- [x] "Accept and hand over" step 6.5 separates follow-ups for the same braid from follow-ups that become a new braid.
- [x] The failure modes above are each answered in the skill text or, where the answer is "nothing changes", in `report.md`.
- [x] A new decision in `docs/decisions.md` and a dated line in its decision log.
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, the 0045 → 0049 walkthrough, validation, anything open
