The braid skills no longer use a question tool. A coordinator or PM opens the request with `braid ask`, then asks in chat in the turn's final message, after the last tool call: the full message, the request's code, and the option set as lettered answers with the recommendation first. Replies are recorded with `braid answer <code> --file -`. The PM's replies add `--from pm --reason`. A request no longer needed is withdrawn with `braid withdraw <code> --why`. Every coordinator and PM message to the user ends with `✋ <what is needed>`, `⏳ Waiting for <what>` or `🟢`.

What changed:

- `braid/SKILL.md`:
  - "Talking to the user": the question-tool and "Options" bullets are merged into one "Ask in chat" bullet. It includes the final-message sentence ("text before a tool call folds away unseen").
  - The reply bullet records by code and withdraws.
  - The first bullet says `braid ask` prints the code, and that a new request, a wait included, replaces the open one.
  - "Hourglass" becomes "End markers". "Links" refers to the marker line.
  - Plan step 7 records the approval by code.
  - "Launched by a PM": the question-tool sentence goes, along with the `--by pm` caveat, which is moot with codes. The PM's reply is recorded with `--from pm --reason`.
  - "The user's approvals are never boxes": the report sums up the recorded answers (`braid decisions`).
- `braid/references/autonomy.md`: "Merging" step 3 and "Stopping" lose their question-tool clauses.
- `braid/assets/brief.md`: the report's Decisions line takes the user's answers from `braid decisions`, not from the log.
- `braid-pm/SKILL.md`:
  - The "Talking to the user" pointer now names chat, the option sets and the markers.
  - The plan request and the PM's own requests are recorded with `braid answer <code> --file -`, and withdrawn with `braid withdraw <code> --why`.
  - Coordinators record the PM's answer as its own (`--from pm`).
  - The question-tool paragraph becomes the chat rule: context first, the final-message sentence, and the markers.
  - A forwarded request is asked in chat without repeating the option rules.
  - The PM's decisions are on record through its `--from pm` reason (`<what>, because <why>, instead of <alternative>`) instead of a separate `Decided:` log entry by the coordinator. This is one CLI call instead of two records.
- `limits.md`, `stop-cases.md`, `braid-worker` and `braid-reviewer`: checked, and not changed. They have no question-tool line and no ⏳ line. Workers and reviewers already send their questions to the coordinator (`Needs the user`, or a chat proposal).

Word counts (`wc -w`):

| File | Before | After | Change |
| --- | ---: | ---: | ---: |
| `.agents/skills/braid/SKILL.md` | 6489 | 6371 | −118 |
| `.agents/skills/braid-pm/SKILL.md` | 3063 | 3059 | −4 |
| `.agents/skills/braid/references/autonomy.md` | 831 | 798 | −33 |
| `.agents/skills/braid/assets/brief.md` | 983 | 982 | −1 |
| Total | 11366 | 11210 | −156 |

Why: the user (via the PM) no longer wants the blocking dialog, since the record now keeps every question with its code. The user also wants the end markers permanently. Questions go in the final message because T3 folds text written before a tool call, and the user missed the PM's questions on 2026-11-22.

Validation:

- `rg` finds no instruction under `.agents/skills/` to use a question tool, AskUserQuestion or a pending request. Only the two "never" lines mention one.
- No `braid answer <id> --log -` and no `--by pm` closing is left.
- The command forms match `src/commands/requests.ts` usage lines: `answer <code> [--from user|pm] [--reason] [--file -]` and `withdraw <code> --why`.
- Gate: `npm run verify` passed (611 tests).

Docs: `docs/decisions.md` adds D99, which supersedes D66's question tool and keeps its option sets. D66 is marked superseded, and the decision log has a line for D99. No other doc in `docs` mentions the question tool or the markers. The board's "agent's pending question" is a T3 signal the board still reads, so it is unaffected. 0070/E covers the rest.

Open:

- The brief's PM change, "its merge request (`braid ask pm/<slug> … --done-when pr:<n>`) closes itself; the 'After each merge' step that closes it by hand goes", has nothing to change. The PM skill has no merge request and no "After each merge" step. A PR waiting for the user's merge is the coordinator's handover, which the PM forwards and which closes as met when the PR merges. I added nothing, following the programme rule.

For later items:

- 0070/E: "Launched by a PM" still says "the user's answer on the board" wakes the coordinator, but the board has no Answer button. The user answers in a thread, and the board's merge message is the only board-sent reply. The text should say "the user's reply".
- Self-observation: the brief named a PM step and a `⏳ Paused` line in `limits.md` that don't exist. A brief that quotes text it expects to change could cite file and line, so a worker can tell a stale assumption from a missed spot.

Needs the user: none
