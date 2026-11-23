Every question an agent needs answered, and every wait on someone, is now a record on the branch `braid-requests`, one `requests/<code>.json` per request with a code (`q-7f3k`) and a history that only grows. The record shows who asked, for whom, the state (open, answered, withdrawn with a reason, or met when its "done when" held), the answer, who answered (the user or the PM) with the PM's reason, and the times. The board shows each code with a link to the asking thread and lists closed requests with who answered; pushes lead with the code, and a withdrawn or met request's push is cleared. The braid and braid-pm skills no longer use a blocking question tool: questions go in the turn's final message with the code and lettered options, and every coordinator and PM message ends with ✋, ⏳ or 🟢.

Strands:
- 0070/A (PR #268): the record on its own branch, sharing the inbox's branch code; every request command and the board moved onto it; the old `.braid/requests.json` carried over once. Board page load is unchanged within noise.
- 0070/B (PR #269): `braid answer <code>` with `--from pm --reason`, `braid withdraw`, `braid requests <code>` and `--closed`, `braid ask --to … --done-when …`. Answers commit only on `braid-requests`, so a merge answer no longer moves the PR head (inbox k5d1). Ask and answer work after a story's branch is gone (from 0036). `braid decisions` and the recap read the answers.
- 0070/C (PR #270): codes and answers on the board and in pushes, built from mockups the user approved.
- 0070/D (PR #271): the skills. Words 11366 -> 11210 (-156); with 0070/E's two wording fixes the braid skill is 6365 words.
- 0070/E (PR #272): docs as a whole, D82 note and D96–D99, and the upgrade path checked by hand.

Validation:
- Each strand passed an independent review (cursor / grok-4.6) and green CI on Ubuntu and Windows. The braid branch's CI is green at 218543e.
- The coordinator's try, with the built CLI on a throwaway clone with a local bare remote: `braid ask` gave `q-u4ma`; `braid answer q-u4ma --from pm --reason … --file -` recorded "answered by the PM" with its reason; `braid requests --closed` and `braid requests q-u4ma` listed it with its history. The two commits landed only on `braid-requests`, and the braid branch head did not move.

Open:
- Nothing among the Completion boxes.
- The `braid` installed on this machine is the pre-0070 one until this braid is merged and installed. Requests opened meanwhile sit in `.braid/requests.json` and are carried over on the first run of the new CLI.
- `braid:` and `time:` conditions are stored and shown but not checked; waking the asker, reminders and the estimate are P6.

Decisions: the user (via the PM): plan approved ("A. Approve"), and the PM decided the record's form; the 0070/C mockups ("a. A / b. A / c. A / Overall: A"); no board-wide Questions list (P14). The PM: no sweep in this braid; leftovers go to the programme. The coordinator, under the `free` preset: the record's form as planned; 0070/A's size (1757 lines against 600 expected); a fallback `braid` commit identity on braid's data branches; no fix strand for 0070/B's Windows flake, which 0070/C fixed; 0070/E as tier L for two skill wordings; PM decisions recorded only through `--from pm --reason`.
For later items: leftover 2026-11-23-nq6c (request codes are looked up case-sensitively); idea 2026-11-23-sqck (a box tick after review forces a full re-review before a preset merge). For P6: conditions are stored normalised as `braid:0042` and `time:<UTC ISO>`; `eta` is a field, empty. The PM plan's "After each merge" step that closes the merge request by hand can become `braid ask … --done-when pr:<n>` once 0070 is installed.
Needs the user: none. The final PR changes skills, so it is the user's merge (AGENTS.md).
