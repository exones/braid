---
id: '0072'
title: "Questions say what they unblock"
status: In Progress
labels: []
dependencies: []
related: ['0074', '0060']
delivery: epic
autonomy: free
---

## Goal

Programme pm/autonomous-dev-machine, row P4. Builds on 0070's request record (P3) and 0071's wakes. When braid asks the user (or the PM) something, the question says what the answer unblocks (items, strands, waiting braids) and whether it is a decision or something to do outside braid (a token, a repo setting); answered questions stay listed as decided, with the answer. When the user answers, the agent first recaps in one line what it understood and what it will do next, then acts, so a misread answer is caught at once. The PM records its own answers on the record, and the board wakes the asking coordinator, so a lost thread message costs nothing.

Taken in: ideas 2026-11-19-aeli (the user promoted it), 2026-11-21-t7b8, 2026-11-24-vpml, 2026-11-24-32me, 2026-11-24-s9sr; leftovers 2026-11-23-nq6c, 2026-11-23-zcr3; and idea 2026-11-25-8l01 (the user, through the PM, 2026-11-25). Each strand's brief copies the text it takes.

## Strands

| Strand | What | Tier | After |
| --- | --- | --- | --- |
| 0072/A | Requests say what they unblock and whether to decide or do (CLI and model; codes in any letter case) | M | |
| 0072/G | Question codes that can be said aloud ("yellow bear"), taken loosely by every command; added by the user through the PM, 2026-11-25 | L | A |
| 0072/B | The board shows what a question unblocks, and what was decided; "Escalated to you" (`ui`) | M | A, G |
| 0072/C | Pushes and programme cards carry the whole question; the forwarded-merge push (`ui`) | M | A, G |
| 0072/D | The PM records its own answers and the board wakes the asker | L | |
| 0072/E | Skills: recap the answer in one line, the PM answers on the record; skills don't grow | L | A, D |
| 0072/F | Docs: Questions say what they unblock | S | all |

## Already decided

- Programme requirement (the user): "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". Behaviour lives in the CLI and the record; 0072's own changes to `.agents/skills/` add no words net (19545 words at 2a032c6c; other braids' changes merged from `main` are not counted).
- Questions go to the user with context, why now, what the answer unblocks, and lettered options (the user).
- What a request unblocks is **derived at each read**, never stored or typed by an agent: the request's item and every strand that depends on it, directly or not, that isn't Done; for a braid-level request, the braid's strands not Done (a story: the braid itself); plus every braid whose open wait (`--to <number>`, `--done-when braid:<number>`) points at it. No new field on the record.
- Decision or do: the request's `kind` says it. `action` ("Do: …") is opened by coordinators too, not only the PM; every other kind reads as a decision (a review as a merge).
- The recap after an answer: the agent states it and goes on; it doesn't wait for a confirmation (the user corrects it if it's wrong). It applies to the coordinator and the PM, the roles that receive the user's answers.
- The PM records its own answers (`braid answer <code> --from pm --reason`); the board's wake tells the asking thread, as it does for met conditions (0071). The coordinator stops recording the PM's answers. A thread message from the PM stays allowed but carries nothing the record doesn't.
- Spoken names (0072/G, the user through the PM): an adjective and a noun from word lists in the repo, stored as an added optional field; the q-code stays the file name and every key. Any change to the record beyond an added field goes to the PM first.
- The escalation stays (the user: "I like that it escalated… This is a nice safety net"); only its wording becomes "Escalated to you" (the user: "The only thing I would change is indeed escalated to you").
- Related to 0074 (The board pauses and resumes reliably, on `braid/0074-the-board-pauses-and-resumes-reliably-no`, running): both touch the board's cards; 0074/D adds a Resume button to the programme card in `src/board/programme.ts`, which 0072/C also changes. 0072 keeps away from the pause, limits and steering code. Merge order into `main`: 0074 first, then 0072; `main` is merged into this braid branch before 0072/C starts if 0074 has merged by then, and always before the final PR.
- Related to 0060 (Workers as T3 subagents, on `main`, launched now): 0060 changes the braid skill's "Run an item" and the braid-worker skill (launching workers); 0072/E changes only the braid skill's "Talking to the user" and "Launched by a PM" and the braid-pm skill's "Answering coordinators". Merge order: 0072 before 0060. If 0060 has merged first, 0072/E merges main in and keeps both.

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

## Out of scope

- The pause, limits and steering code and the board's Resume buttons (0074).
- Launching workers and the braid skill's "Run an item" (0060).
- Questions that carry likely answers for the board to offer (idea 2026-11-23-wcox).

## Working at the end

A question has a name that can be said aloud ("yellow bear", answered with "yellow bear a"); on the board it reads e.g. "blocks 0072/B, 0072/C · decide" (or "· do" for something outside braid); its push and its programme's card say the same; answered questions show under Decided with the answer; the forwarded-merge push names the braid, the PR, its head and the PM's note; an escalation reads "Escalated to you"; when the PM answers, the board wakes the coordinator from the record; after any answer the agent's next message starts with a one-line recap of it.

## Completion

- [ ] `braid requests` and `braid ask` say what each open request unblocks and whether it is to decide or do; a request code is found in any letter case (0072/A)
- [ ] Every request has a name that can be said aloud ("yellow bear"), every command takes it loosely, old q-codes still work, and the CLI shows the name first (0072/G)
- [ ] The board's cards and details say what a question unblocks, list answered questions as Decided with the answer, and an escalation reads "Escalated to you" (0072/B)
- [ ] Pushes and programme cards carry the request's code, what it unblocks and, for a forwarded merge, the braid's title, PR, head and the PM's note (0072/C)
- [ ] A PM's answer recorded with `braid answer --from pm` wakes the asking thread once, and the escalation reads the record (0072/D)
- [ ] The skills say to recap an answer in one line before acting, and the PM records its own answers; 0072's changes to `.agents/skills/` add no words net (0072/E)
- [ ] Docs are true as a whole (0072/F)
