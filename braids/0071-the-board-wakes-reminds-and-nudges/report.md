The running board now keeps waits alive without anyone watching them. At each refresh it checks every open request's "done when" (`pr:<n>`, `braid:<n>` merged into main, `time:<iso>`). When the condition holds, it sends the asking thread one wake and records `met` on the request record. While a wait is open, its addressee gets "Gentle hourly reminder: I'm still waiting for you" at most hourly, and not before the estimate the addressee set with `braid eta <code> 2h "<why>"`. A missed estimate or a gone addressee reads as a stall. A coordinator, or the PM, idle with nothing open gets one nudge; ten minutes later, if still idle, the card reads "Stalled after a nudge". Nothing happens for a held or paused braid or programme. There is no new state file: what the board sent is in the request's history (`met`, `reminded`), and the nudge sits in the board's existing alarm clock (`.braid/broke.json`). A question and a wait no longer replace each other (rf9z). The skills tell coordinators and the PM how to wait, estimate and act on a wake, reminder or nudge, and they got shorter.

Strands:
- 0071/A (PR #275): one condition check for `pr:`, `braid:` and `time:`, shared by the board and `braid requests`. The board sends the wake, then records `met`. rf9z: a question replaces only a question, and a wait only a wait to the same braid. With both open, `answer`/`withdraw` by item id refuse and name both codes. Two fix rounds (docs and tests).
- 0071/B (PR #278): `braid eta`; hourly reminders (to the PM when the waited-on braid has no coordinator and the asker is PM-run); one PM message per missed estimate. Built from mockups the user cut down ("slim please"): the card is unchanged while all is well, only red stall lines when a wait breaks, and "expected by" with the history in the details panel.
- 0071/C (PR #281): one nudge per stall, then "Stalled after a nudge" and one PM message. 2h98: T3 lists no subagent threads, so the PM records its live checker with `braid review pm/<slug> --thread <id>`. 1oq8: a programme hold stops its wakes. dy2k: the record is re-read before each send, so a second board skips what the first sent.
- 0071/D (PR #282): the braid and braid-pm skills. At the user's request they also say that `braid ask` never replaces the chat message: the ask text is the board's one-line short version, and the chat message is the full one (short context, why now, the question, what the answer unblocks, the code and the options). Words: braid 12529 -> 12527, braid-pm 3306 -> 3303.
- 0071/E (PR #285): the docs as a whole; decisions D100 (the board acts without a click) and D101 (a wait replaces only a wait); ozjp (a PM checker record is replaced by the next one and dropped once its thread stops).
- 0071/F (PR #288): fix strand. `braid eta` printed "unknown command": 0071/B wired it into the dispatch but not into `BRAID_COMMANDS`. It is now tested through the CLI, plus a test that every command in the help is accepted.

Validation:
- Each strand: an independent review (cursor / grok-4.6) and green CI on Ubuntu and Windows. The braid branch's CI is green.
- The coordinator's try, with the built CLI on a throwaway clone with a local bare remote:
  - `braid ask 0072 … --to 0071 --done-when braid:0071` opened a wait.
  - A plan question on the same item stayed open beside it.
  - `braid answer 0072` by id refused, naming both codes.
  - `braid eta q-x0pt 2h "…"` printed "expected by 04:21 (in 2h)", and `braid requests` showed the estimate and the `eta` event.
  - The try found the `braid eta` bug, fixed in 0071/F.

Open:
- The Completion box "The coordinator's try on a throwaway clone: a `braid:` wait reminded, shown and woken once; an idle coordinator nudged once" is half done. The CLI side was tried as above. The board side (a running board sending the reminder, the wake and the nudge through T3) needs T3 and a running board, so it can't run in a throwaway clone. Tests cover it, and the PM's live check before the merge tries it for real.
- Update the CLI on every clone once this is installed: a braid CLI older than 0071/B reads a request record with a `reminded` event as unreadable.
- Two boards sending in the same instant can still both send (the window is one send); a delegated PM checker is visible only if the PM records it.

Decisions:
- The user, via the PM:
  - plan approved ("a. Approve", q-jcjx);
  - mockups: "slim please", "b. leave it out" (no card G), "c. c1" (escalation is a `reminded` event with a reason) (q-ocph);
  - `braid ask` never replaces the chat message, with the ask text as the board's short version.
- The PM: dy2k, 1oq8 and ozjp fixed inside 0071; 5bor goes to P14; no sweep.
- The coordinator, under the `free` preset:
  - rf9z split by kind;
  - wakes for every condition request;
  - reminders to agents only;
  - escalation as today's stall;
  - held or paused braids skipped;
  - the fix strand 0071/F.
- The workers' decisions: send-then-record; 2h98 by a record; dy2k by re-reading; a nudge only to a thread that can receive it; a missed estimate shows at once.

For later items: leftovers 2026-11-23-5bor (the board writes the record with synchronous Git, P14), 2026-11-23-tr1o (the board's pause message misprints the steering thread id), 2026-11-24-es8z (the help test runs against the repository; commands handled before `run` aren't tested through the CLI).

Needs the user: the final PR changes skills, so it is the user's merge (AGENTS.md), after the PM's live check.
