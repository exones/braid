---
id: '0070/D'
title: "Skills: questions in chat on the record, end markers"
status: In Progress
labels: ["kind:task", "tier:L"]
dependencies: ['0070/B']
order: 40
---
## Goal

The braid skills use the record and never a blocking question tool. Every question an agent needs answered is opened with `braid ask` first and then asked in chat, with its code, its context line and the option set as lettered answers. Every coordinator and PM message to the user ends with one marker on its own last line: `✋ <what is needed>` when the user is needed, `⏳ Waiting for <what>` when waiting on agents or CI, `🟢` when nothing is needed or pending. An answer is recorded with `braid answer <code>`, naming who answered; a request no longer needed is withdrawn. The skills come out shorter, or no longer, than they went in.

Expected size: about 60 changed lines in 6 files, net shorter.

## Start here

- The braid's brief (`braid view 0070`) and 0070/B's report: the commands and flags as they now are.
- `.agents/skills/braid/SKILL.md`: "Talking to the user" (the question tool, the option sets, "A reply to an open request", "Hourglass"), "Launched by a PM" (the PM's reply recorded, closing with `--by`), "Merge on request", "Plan" steps 6 to 8.
- `.agents/skills/braid/references/autonomy.md` ("Merging" step 3: "not with the question tool"; "Stopping": "the question tool applies"), `references/limits.md` (the `⏳ Paused` line), `references/stop-cases.md`.
- `.agents/skills/braid-pm/SKILL.md`: "never use the question tool", answering coordinators, its own requests, `braid answer --by pm`.
- `.agents/skills/braid-worker/SKILL.md` and `.agents/skills/braid-reviewer/SKILL.md`: where they ask their coordinator.

## Change

- `braid/SKILL.md` "Talking to the user": the question-tool paragraph goes; questions in chat after `braid ask`, naming the code, with the option sets as lettered answers and the recommendation; a reply is recorded with `braid answer <code>` (`--from pm --reason` for the PM's) before acting; a request no longer needed is `braid withdraw`n; the end markers replace "Hourglass" (the ⏳ line kept for agents and CI only, ✋ for the user, 🟢 for nothing).
- "Launched by a PM": the PM's reply recorded with `--from pm` and its reason; "never use the question tool" no longer needs saying there once no role uses it.
- `references/autonomy.md`, `references/limits.md`, `references/stop-cases.md`: the question-tool lines go; markers as above.
- `braid-pm/SKILL.md`: the same markers on every PM message; questions to the user in chat after `braid ask`; its merge request (`braid ask pm/<slug> … --done-when pr:<n>`) closes itself; the "After each merge" step that closes it by hand goes.
- `braid/SKILL.md` "Talking to the user" and `braid-pm/SKILL.md`, in one sentence within the word budget: a question, with its context and options, goes in the turn's final message after the last tool call, never in text before a tool call.
- `braid-worker` and `braid-reviewer`: a question for the user goes to the coordinator, which records it (one line each, only if they say otherwise today).
- Measure each changed skill file's words before and after, and put the numbers in `report.md`.

## Already decided

- The user: "I don't want any more the modal user input from coordinator or PM. I prefer now just chat because now the board has all the questions stored. I mean this widget that blocks".
- The user: "I like end of message emojis so I want it permanently for coordinator/pm"; ⏳ "is when you wait for something. It's just another emoji for another state".
- The option sets stay, as lettered answers in chat.
- Questions in the final message (added by the PM after approval, from the user: "those memories have to go to the skill eventually"): T3 folds text written before a tool call into the collapsed work, and the user missed the PM's questions there on 2026-11-22.
- Programme rule: the skills get shorter or stay the same size; prefer one CLI call over a prose rule.
- This strand changes agent instructions, so the braid's final PR is the user's merge (AGENTS.md).

## Out of scope

- The CLI: 0070/A and 0070/B.
- The PM plan file and its programme rows: the PM's own.

## Completion

- [x] No file under `.agents/skills/` tells an agent to use a question tool (AskUserQuestion or a pending request)
- [x] The braid and braid-pm skills ask in chat after `braid ask` with the code and lettered options, record answers with `braid answer <code>` and who answered, and withdraw requests no longer needed
- [x] The braid and braid-pm skills end every message to the user with ✋, ⏳ or 🟢 as defined in the Goal
- [x] report.md and the PR body give each changed skill file's word count before and after, and the total is not higher
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

- `braid/SKILL.md` "Talking to the user": replace the question-tool and options bullets with one "Ask in chat" bullet (after `braid ask`, in the turn's final message after the last tool call: code, context line, lettered options, recommendation); the reply bullet records with `braid answer <code> --file -` (`--from pm --reason` for the PM), withdraws with `braid withdraw <code> --why`, and notes that a new ask replaces the open one; "Hourglass" becomes "End markers" (✋, ⏳, 🟢). Plan step 7 and "Launched by a PM" use the code form; the question-tool sentence and the `--by` caveat go.
- `references/autonomy.md`: "Merging" step 3 and "Stopping" lose their question-tool clauses.
- `braid-pm/SKILL.md`: answers recorded with `braid answer <code>`, coordinators record the PM's with `--from pm`; the question-tool paragraph becomes the chat rule with the final-message sentence and the markers.
- `assets/brief.md`: the report's Decisions come from `braid decisions`, not the log.
- `limits.md`, `stop-cases.md`, worker and reviewer: checked; nothing says otherwise today, so no change.
- Word counts before and after in report.md and the PR body.
