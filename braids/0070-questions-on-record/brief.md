---
id: '0070'
title: "Questions on record"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0036']
delivery: epic
autonomy: free
---
## Goal

Every question an agent needs answered, and every wait on someone, is a record first and a chat message second. The record lives on its own git branch, keeps its whole history (who asked, for whom, open, answered, withdrawn with a reason, or met when its "done when" held; the answer; who answered, the user or the PM, and the PM's reason; the times), and has a short code the user sees on the board, in the push and in chat and can name in any thread. No agent uses a blocking question tool any more: questions go in chat with the record, and every coordinator and PM message ends with one marker: `✋ <what is needed>`, `⏳ Waiting for <what>` or `🟢`.

Try: ask, go away, come back: the question is on the board with its code, and after the answer it is listed with who answered.

Expected size: about 1500 lines in 25 files, over five strands.

## Start here

- `src/braids/requests.ts`: today's store, `.braid/requests.json` in the main checkout, local and never committed; a closed request is deleted.
- `src/commands/requests.ts`: `braid ask`, `handover`, `answer`, `forward`, `requests`. `braid answer --log` commits on the braid branch (inbox k5d1).
- `src/inbox/branch.ts`: the `braid-inbox` branch, written with Git's low-level commands without a checkout and pushed at once; the model for the record's branch.
- `src/board/signals.ts`, `src/board/model.ts`, `src/board/pm.ts`, `src/notify/message.ts`, `src/notify/notifier.ts`: who reads requests (lanes, the PM's routing, pushes and their clearing).
- `.agents/skills/braid/SKILL.md` "Talking to the user" and "Launched by a PM"; `references/autonomy.md` ("Merging" step 3, "Stopping"); `.agents/skills/braid-pm/SKILL.md`.
- The PM plan, rows P3 and P6: `git show origin/pm/autonomous-dev-machine:pm/autonomous-dev-machine.md`.

## Change

- 0070/A: the record on the branch `braid-requests`, with history and codes; every existing command moved onto it; today's local file migrated.
- 0070/B: answering, withdrawing and showing by code; who answered and the PM's reason; the "done when" condition; answers never commit on a braid branch (k5d1); asking and answering after a story's branch is gone (0036).
- 0070/C: codes and answers on the board and in pushes; a withdrawn or met request's push cleared.
- 0070/D: the skills: no question tool, questions in chat with the record and lettered answers, the three end markers, answers recorded with who answered.
- 0070/E: docs.

## Already decided

- The user (via the PM): "I don't want to answer from board now, will be enough that I can see the question, navigate to the thread, refer to it by some code, ask question about this question etc."
- The user: "if they need some info, it should go not only via chat, but via braid cli"; "coordinator can ask question to PM, and it can answer as I would. And coordinator would record it as answer".
- The record lives on its own git branch, as the inbox does on `braid-inbox` (the user's answer "A" to the PM's Q1).
- Waits are requests with a condition on this record; P6 ("The board wakes, reminds and nudges") is a small board rule on top, no new state (the user: "Yes"). Holds stay deliberate stops only.
- The user: "I don't want any more the modal user input from coordinator or PM. I prefer now just chat because now the board has all the questions stored. I mean this widget that blocks".
- The user: "I like end of message emojis so I want it permanently for coordinator/pm"; on ⏳: "it's fine. It's when you wait for something. It's just another emoji for another state".
- Programme rule: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". Skill text gets shorter or stays the same size; one CLI call records and checks each state change; no new state file once the record exists.
- No Answer button on the board yet; the card links to the asking thread.
- Inbox 2026-11-23-k5d1 (recording a merge answer must not move the PR head) is taken into this braid: answers live on the record's branch, so `braid answer` never commits on a braid branch.
- Decided by the coordinator, put to the PM with the plan (the record's form; P6 builds on it, so changing it later costs a migration):
  - Branch `braid-requests`, written only by braid commands with the inbox's method (low-level Git, no checkout, pushed at once as a fast-forward, a refused push fetched and redone, offline kept local until the next write). The branch code of `src/inbox/branch.ts` is shared, not copied.
  - One JSON file per request, `requests/<code>.json`, with its fields and an `events` list that only grows: `opened`, `forwarded`, `answered`, `withdrawn`, `met`, and later P6's `eta`; each event has its time, who (`user`, `pm`, `coordinator`, `board`) and its text or reason.
  - The code: `q-` and four lowercase letters or digits, random and unique on the branch (`q-7f3k`); the `q-` keeps it apart from braid numbers. Waits use the same codes.
  - States: `open`, `answered`, `withdrawn` (with a reason), `met` (its "done when" held). A new request from the same asker on the same item still replaces the open one, which becomes `withdrawn`, "replaced by q-…".
  - Fields: the item (`0070`, `0070/B` or `pm/<slug>`), kind (as today: question, decision, plan, action, review), text, stop-case key, the asker (coordinator or PM) and its thread, the addressee (`user`, `pm`, or another braid's coordinator by its number), "done when" (`answered`, the default; `pr:<n>` merged; `braid:<number>` merged into `main`; `time:<iso>`), the PR and head of a review, `eta` (empty; set in P6), the forward note.
  - Conditions on a PR (a handover's, or `pr:<n>`) are checked where review requests are checked today, at each board refresh and `braid requests`, and recorded as `met` (merged) or `withdrawn` (closed, or the head moved) instead of dropped. `braid:` and `time:` conditions are stored and shown; P6 checks them and wakes the asker.
  - A worker's or reviewer's question goes to its coordinator as today; the coordinator records it as its own request. No new asker role.
- Related to 0036 (Coordinator polish from the thread review, Outline on `main`): its "Requests and answers after a lone story's merge" is done here (0070/B); 0036's coordinator (P10) drops that item. This braid merges first.

## Out of scope

- Answering from the board (an Answer button).
- P6: waking the asker when a `braid:` or `time:` condition holds, reminders, the estimate's call and display, stall nudges.
- P4: what a question unblocks.
- Braid logs and briefs: they stay on their branches and are not moved onto the record.

## Completion

- [ ] An agent's question is opened with `braid ask`, has a code and shows on the board with that code; after `braid answer`, `braid requests` and the board list it with who answered
- [ ] A request no longer needed is withdrawn with a reason and stays listed; its push is cleared
- [ ] A request with a PR condition closes itself as met when the PR merges
- [ ] `braid answer` on a final PR's item leaves the PR head unchanged (k5d1)
- [ ] `braid ask` and `braid answer` work on a story whose branch is gone after its merge
- [ ] No skill uses a question tool; coordinator and PM messages end with ✋, ⏳ or 🟢; the skills are no longer than before
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated (0070/E)
- [ ] The gate command from BRAID.md passes

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
