# 0071/D report

## What changed

- **braid skill (`SKILL.md`)**
  - "Talking to the user": a turn that waits ends with an open request, and that now covers a wait on another braid: `braid ask <id> "<what>" --to <n> --done-when braid:<n> --thread <your thread id>` (or `time:<iso>`); the board wakes the thread. Replacement is per sort: a new question replaces the open question, a wait the wait on that braid; with both open, answer or withdraw by code (0071/A).
  - "Run an item", coordinator habits: one bullet for the board's messages. `Wake:` the wait or handover is met and closed, go on; `Gentle hourly reminder`: do it, or estimate with `braid eta <code> 2h "<why>"` (0071/B); `Nudge from the board`: go on, or open a request or wait and end the turn (0071/C); a pause: provider limits. Step 3 and "Say waiting" no longer repeat the pause rule.
  - The handover's merge is also learned from the board's wake (Watch rule, *I'll merge it myself*).
  - Sweep: "an item has one open request, and a new one replaces it" became "a new question replaces it".
- **A request is also a chat message** (the user's request, relayed by the PM): "Context first" and "Ask in chat" became one bullet, "`braid ask` never replaces the chat message": the `braid ask` text is the board's short version, one line naming the item and what is needed; the full message to the user or the PM goes in the turn's final message (short context, why it is asked now, the question, what the answer unblocks, the code and the lettered options); under a PM, the message to the PM thread is that message; the steps that say only `braid ask …` (Plan step 8, the Converge loop, the Mandate, "After the merge" step 6, the quality stops) are named as covered by it.
- **`references/resuming.md`**: a new coordinator asks the braid's open waits again with its own `--thread`, since a wake goes to the thread that asked.
- **braid-pm skill (`SKILL.md`)**
  - "Running" step 6 names the board as a waker; new step 7, the board's messages to the PM: a reminder (a request to the PM, or a wait on a braid with no coordinator yet): do it or `braid eta`, with `--by pm` for the wait; `From the board` (a missed estimate, or a coordinator stopped after a nudge): steer that coordinator; a nudge: launch what is ready or ask the user.
  - "Your own question": the `braid ask` text is the board's one-line short version and never replaces the chat message: the turn's final message holds the full one (short context, why now, the question, what the answer unblocks, the code and options).
  - "Checking the result live": right after `delegate_task` of the checker, `braid review pm/<slug> --thread <child id>`, so the board counts it (0071/C, 2h98).
- **Cuts to pay for it** (no rule dropped): the board's own behaviour retold in the skills ("the PM is handling" and the move to the user, in both skills; the verbatim pause and resume message texts in braid-pm), the pause sentence in "Say waiting", the researcher's `isolation: shared` rationale, the recap draft's sources, the `braid forward` details in "Launched by a PM", braid-pm's copy of the chat-asking rule (now a pointer to the braid skill's "Talking to the user", which its "Project facts" already makes it read), a repeated "your thread holds no braid" and "one braid per coordinator thread", the steering role's line details in both skills' model lines, and workflow.md's pointer sentence to the brief template and the skill (both linked from the skill already), the second half of the Links example, and the cases listed for "without a running board" in braid-pm.

## Word counts

`wc -w` over every `.md` file of each skill, before (3bdb4af) and after:

| File | Before | After |
| --- | ---: | ---: |
| braid/SKILL.md | 6365 | 6361 |
| braid/references/resuming.md | 283 | 300 |
| braid/references/workflow.md | 1977 | 1962 |
| braid, other references and assets (unchanged) | 3904 | 3904 |
| **braid total** | **12529** | **12527** |
| braid-pm/SKILL.md | 3059 | 3056 |
| braid-pm/assets/plan.md (unchanged) | 247 | 247 |
| **braid-pm total** | **3306** | **3303** |

## Why

The chat-message rule: the user, relayed by the PM: "several times already the question was asked on the board but not in the chat, so when I go from the board to the chat to see fuller version of the question there is none, and in the board it's small and hard to understand the context. Please have a look at the skill: it should clearly say not only to ask via the braid request, but that it has to be duplicated in chat with more context: why it's asked and what the answer will unblock". The user's follow-up: "is it clear that board gets short version, chat fuller with short context, question, what answer unblocks": the rule now names both halves. braid-worker and braid-reviewer never ask the user (they go through the coordinator), so they are unchanged.

The board now wakes, reminds and nudges (0071/A–C); the skills tell agents to rely on it instead of keeping waits in their heads, in no more words (the programme rule).

## Validation

- Every command and message text checked against the code: `braid ask --to/--done-when/--thread` (`src/commands/requests.ts`), the wake, reminder and nudge texts (`src/board/wake.ts`, `remind.ts`, `nudge.ts`), `braid eta --by`, `braid review pm/<slug>`.
- Gate `npm run verify`: 650 tests pass.

## Docs

None affected: `docs/board.md`, `docs/cli.md` and `docs/braids-format.md` already describe the wake, reminders, nudge, `braid eta` and `braid review pm/<slug>` (0071/A–C); the docs as a whole are 0071/E's.

## Open

- After a braid's merge into `main` the PM still waits for the merge commit's `ci` run "in the background" (braid-pm, "Checking the result live"); a background command's wake can be lost (inbox kq5k). Not changed here.

Decided: the cuts above, to keep both skills from growing; each removes text that repeats the board's behaviour or another section, no rule.

For later items: 0071/E: none from this item beyond its brief.
Needs the user: none
