# 0074/D report: Resume now, early resume and the PM-led resume

## What changed

- **One resume path** (`src/board/resume.ts`, `resumePauses`). The board's timer, early resume, the Resume now buttons and `braid resume --limit` (with `--all`) all call it.
  - A braid without a PM resumes directly. Each paused agent gets its resume text by `t3 thread send`, with the ids taken from the record, and the record is cleared once every send went through.
  - A PM-run braid resumes through its PM. A braid is PM-run when its record names a PM thread that isn't archived. The PM gets one message on standard input (`resumeAsk` in `src/board/steer.ts`): why the resume happens, which braids are paused, and `braid resume <number> --limit` to resume each in its order. The board sends nothing else, and the record stays until the PM runs the command.
  - A `braid pause` record of a coordinator or PM (`by` not `board`) is asked of its pausing thread.
  - A hold is never touched.
- **Retry until delivered.** A failed send is recorded on the new record field `resuming` (`why`, `at`, `direct`, `askedAt`, `failedSince`, `lastTry`, `error`). The acting board retries it at each refresh, only for the threads not yet reached. `SEND_TRIES` and its give-up after 5 failures are gone.
- **The steerer's resume step** (`src/board/steerer.ts`):
  - At the resume time it re-checks as before: still over keeps the record with the new time.
  - Early resume (`earlyWhy`): a reading checked after the pause began resumes the braid when it shows the window under its threshold with the verdict `ok`, or no longer has the window at all (`gone`). A window that no longer applies to the provider's models is filtered out of the reading, so it reads as gone. The old banner goes with the cleared record.
  - It also tries records with a resume asked for or pending.
  - The `resumed` push says "was due" only for a late timer resume.
- **Resume now on the board.** `POST /api/action/resume` (`resumeAction` in `src/commands/board.ts`) takes `{ braid }` or `{ programme }` and an optional `reason`, so P5's Go can reuse it. It marks the records `resuming` (not yet tried) and pokes the steerer (`Steerer.poke`). The acting board sends at once when this board acts for the provider, otherwise the acting board sends at its next refresh. It refuses a held braid.
- **Views** (`src/board/pause.ts`):
  - `resumeMode` and `askWho` tell a direct resume from an ask.
  - The card line reads "resume pending: T3 unreachable since <time>" in amber, with "retried at each refresh · last try … · n of m agents reached" (or "the PM not reached yet").
  - Other notes: "asked the PM to resume at …", "resume asked for at … · the acting board sends it", and "· the PM resumes it" on a PM-run board pause.
  - The details box foot names Resume now and `--limit`.
  - The programme data gains `resume` (`src/board/programme.ts`): the braids, the line under the paused box, and whether a resume is pending.
- **Web** (`web/src/App.tsx`): icon-only buttons as the user asked. ▶ is Resume now or Ask the PM to resume; ↻ is Retry the resume now. The words are in the tooltip, and a confirmation dialog says what is sent. The buttons sit on a paused braid's card (beside its actions) and on a paused programme's card (after Plan). Open thread and the thread links are unchanged.
- **CLI** (`src/commands/pauses.ts`, `src/cli.ts`):
  - `braid resume <number> --limit` now sends the paused agents their resume texts before clearing a board record, and says which ones.
  - `braid resume --limit --all` covers every board pause of the repository; it lists held braids as left alone.
  - Both run asynchronously from `main`. `braid resume` without `--limit` is unchanged.
- **Mockups:** `docs/design/board-mockups/resume-now.html` and `resume-now.png`, updated to the verdict (icon-only buttons, thread access as today).

## Why

- After a usage reset the board still waited for its old resume time.
- The user's "unpause all" left the board's records behind.
- The user wants a Resume button for a braid and a programme, and wants PM-run braids to resume through their PM ("PM is smarter on that how to restart").
- The PM saw a resume lost while T3 was down: nothing tried again.

## Validation

- `test/board-steer.test.ts` holds the brief's tests:
  - Resume now on a braid without a PM sends each thread once and clears the record, with the "resumed" push.
  - Resume now on a PM-run braid sends the PM one message and nothing else. A programme's Resume now asks the same PM once more. Only `braid resume 0070 --limit` then sends the agents and clears the record.
  - A fresh reading under the threshold resumes 50 min early; a reading from before the pause doesn't.
  - A pause whose window no longer applies (a cursor-like `other_models` record with an old 0-of-2 steering part) resumes at the next refresh, and the banner is gone.
  - A failed send stays pending, is retried at 8 refreshes (past the old 5), and the card reads "resume pending: T3 unreachable since …" with "1 of 2 agents reached". Once T3 takes it, only the failed thread is sent and the record clears.
  - `--limit --all` resumes a braid without a PM directly and asks the PM for a PM-run one.
  - A hold is refused by Resume now, left by `--all`, `--limit` and the board.
- The timer test was rewritten for the PM-led resume. It still checks "still over keeps the record". It now checks the PM's exact message and the `--limit` sends. A test's note line now ends "· the PM resumes it".
- Gate (`npm run verify`, quick mode) run in steps, because the foreground limit is 10 min. All passed:
  - docs gate (after fixing a CRLF in the brief);
  - oidc-release;
  - typecheck;
  - build;
  - `node --test` over all 65 test files in three runs: 313 + 195 + 208 = 716 passed, 0 failed (583 s, 346 s and 588 s).

## Docs

- docs/board.md: "The board pauses and resumes" (the resume, when it resumes, Resume now, retry until delivered) and "Paused" (the pending and asked lines, the buttons).
- docs/cli.md: `braid resume --limit` and `braid resume --limit --all`.
- docs/braids-format.md: the record's `resuming`.
- docs/decisions.md: D109 and its log line.

## Open

- While the reading still shows the window over its threshold, Resume now resumes and the same refresh pauses the braid again (the pause step runs after the resume step). The docs say so; the dialog doesn't show the live reading. Decided: the user asks, the board does it, and the threshold still rules.
- The mockup's transient "Resuming: …" line for early resume (case 5) isn't built. The resume happens within one refresh, so the card goes straight from paused to not paused.
- The confirm dialog shows the paused window and the threads, not the live "Window now" reading of the mockup. The page has the reading in the limits chip.
- A PM that got its ask but never runs `braid resume --limit` leaves the record with "asked the PM to resume at …". The ▶ button asks again, and the existing due/stalled rules still apply.
- Size: about 900 lines changed (src about 470, tests about 170, web about 150, docs and mockups), against about 400 expected. The extra is the retry state, the programme data and the dialogs. Within the brief's scope.

For later items: the braid skill's `references/limits.md` still describes the steering thread and a direct resume. It should say that a PM-run braid's PM receives the board's resume message and resumes each braid with `braid resume <number> --limit`, and that `braid resume --limit --all` resumes every board pause (needs the user's go: a skill change). 0074/G can take it with the steering prose it already drops. The demo could show a "resume pending" and an "asked the PM" braid.

Needs the user: none
