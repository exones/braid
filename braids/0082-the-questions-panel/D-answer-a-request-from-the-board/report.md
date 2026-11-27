# 0082/D report: Answer a request from the board

## What changed

- **The `answer` action** (`src/commands/board.ts` `answerAction`, in the actions map beside `merge`, `start`, `promote`, `open` and `resume`). Its body is `{ project, handle, text }`. It goes through `postAction`'s guard on both listeners and adds no new way in: the run's token on the local one, and the owner's whois, the Host and the `x-braid-request` header on Tailscale. There is no confirmation step (the user's "A. Both listeners, no confirmation").
- **Recording** (`src/commands/requests.ts` `boardAnswer`). The action resolves the handle in the named project's record with `braid answer`'s own `codeOf`, then closes the request with `braid answer`'s `end` and its ending, now shared as `answerEnding`. The answer is recorded `by: user`, and a lone letter becomes `A. <option>` inside the write. These are refused with a message the page shows: a request already answered, withdrawn or met (`end`'s message, which names who closed it and when), a wait, a handle that isn't in this project's record, and text that is empty, more than one line or longer than 500 characters.
- **The wake** (`src/board/wake.ts` `wakePageAnswer`). The action wakes the asking thread at once, whoever the request was for. It uses D113's `answerWakeMessage` and then the same `reminded` mark (`markAnswerWoken`), so no later refresh sends it again. Two cases are handed to the running waker, which sends the wake once at a later refresh: a send that fails, and an asking braid that is held or paused (in `.braid/pauses.json`). The waker skips a code while the action is still sending it. There is no new event kind or record field.
- **The page side** (`web/src/api.ts`): `answerRequest(project, handle, text)` and its `Answered` reply type. The client refuses text that isn't one line before it calls; the board's refusals come back as a rejected promise with the reason. 0082/E builds the buttons on it.

## Why

Brief 0082/D: the board side of the Questions panel, answered as the user's own answer and woken at once (D118: one click, no undo).

## Validation

- `test/board-answer.test.ts` (6 tests, all pass):
  - an answer by letter records the option, wakes the thread once, and the next refresh sends nothing;
  - an answer by free text, by code;
  - refusals: already answered, a wait, another project's request (by name and by code), two lines, 501 characters, a missing field;
  - a failed send is sent once by the waker;
  - a paused braid is woken only after it resumes, and an archived asker is never woken;
  - through the real server: no token, a wrong token, a foreign Origin, a non-owner on Tailscale and a missing request header are all 403 and nothing is recorded; the token on the local listener and the header from the owner on Tailscale record the answer; a second answer gets 400 "already answered"; an unserved project gets 400.
- The gate `npm run verify` passed (see the PR).

## Docs

- `docs/board.md`:
  - Actions now lists six actions;
  - Wakes has a new paragraph, "Answers from the board's page";
  - a new section, "Answer from the board";
  - On Tailscale now says Answer works there with no confirmation.
- `docs/decisions.md`: D120 and its log line record the user's "Both listeners, no confirmation".
- "On the phone" still says the board has no Answer button. That stays true until 0082/E adds the buttons.

## Decisions

- Decided (security, per the user's answer on smooth-window-jjid): `answer` runs on both listeners behind the existing guard, with no confirmation.
- Decided: the action sends the wake itself, so it goes even with `--no-pause`. It is the user's click, not the board acting on its own. Only the retry of a failed or held wake needs the running wake.
- Decided: the list of page answers still to wake lives in memory for the board's life. A restarted board drops a page answer whose first send failed. Keeping it across restarts would need a new record field, which the brief rules out.
- Decided: a held programme (`pm/<slug>`) doesn't hold back the action's wake. Only a held or paused braid does, because a paused worker's thread must not be messaged.

## Anything open

- None.

For later items: 0082/E calls `answerRequest` and shows `wake` when `woken` is false. 0082/F updates "On the phone" ("the board has no Answer or Approve button") once the panel's buttons exist.

Needs the user: none
