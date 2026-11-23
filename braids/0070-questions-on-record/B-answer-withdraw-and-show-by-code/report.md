A request is now answered, withdrawn and shown by its code from any thread or checkout. The record says who answered (the user, or the PM with its reason). A request can be addressed to another braid and carry a "done when". `braid answer` writes only to `braid-requests`, so it never moves a PR head (k5d1). Asking and answering work on a merged story whose branch is gone (0036).

What changed:

- `src/braids/requests.ts`:
  - `endRequest(root, code, ending)` ends one request by its code. Inside the write it checks again that the request is still open; a closed one is returned unchanged, so the command can refuse it.
  - `Ending.reason` becomes the event's `reason`.
  - `closeRequest` and `forwardRequest` now return the write's warning.
  - `to` takes a braid number (`BRAID_TO`).
  - `conditionPr` reads the PR from a review or a `pr:<n>` "done when". `voided`, `voidEnding`, `filterLive` and `liveRequests` check both kinds: a `pr:` wait is met when its PR merges and withdrawn when the PR closes. The head check is still only for reviews.
  - `answeredRows` gives the answered requests as decision rows.
- `src/braids/gitbranch.ts`: `currentFiles` merges a file that both the local and the remote branch changed, using the spec's `merge`, the way a write's replay merges it. A read no longer hides the remote's events until the next write (from 0070/A's review).
- `src/braids/branches.ts`: `braidAt(root, ref, number)` reads a braid at a ref.
- `src/commands/requests.ts`:
  - `braid answer <code>|<id>|pm/<slug> [--from user|pm] [--reason] [--file|--log <file>|-] [--by]` records the answer's text, who answered (the user by default) and, with `--from pm`, the reason, which is then required. `--log` is the old name of `--file`; it no longer writes a braid log entry or commits. The id form answers the item's one open request. `--by` picks whose request it is. If both askers have one open and there is no `--by`, it names both codes and changes nothing. A closed code is refused with its state, who closed it and when.
  - `braid withdraw <code>|<id> --why <reason> [--by]` records `withdrawn` by the request's asker, with the reason.
  - `braid requests <code>` prints the request's fields and every event. `braid requests --closed [--since <date>]` lists closed requests, newest first, with state, time, who closed them and the answer. The open list adds `to braid <n>` and `done when <condition>`.
  - `braid ask --to user|pm|<braid number> --done-when answered|pr:<n>|braid:<number>|time:<iso>` checks a braid addressee exists and normalises the condition (`pr:#5` becomes `pr:5`, `braid:2` becomes `braid:0002`, a time becomes UTC ISO). It prints the code and the condition.
  - An item is found among the known braids, then on `origin/<main>`, then in the record.
  - `answer`, `withdraw`, `forward`, `start` and `accept` print the offline `warning:` line, as `ask` and `handover` do.
- `braid decisions <number>` and the recap draft add requests answered by the user or the PM, next to the `Decided:` entries: `q-… answered by the PM: <request> -> <answer> (reason: …)`.
- Board (`src/board/signals.ts`): a request to another braid's coordinator is left out of the user's request maps, so nothing shows or pushes it as the user's. 0070/C shows it.
- CLI help: `ask`, `answer`, `withdraw` (new), `requests`, `handover`, `decisions`.

Validation:

- New `test/requests-answer.test.ts` (7 tests):
  - k5d1: answering the braid (checkout on the braid branch) and a story leaves the checkout's HEAD, the braid branch, the story's PR head and the working tree unchanged. `braid accept 0002 --head <recapped sha> --merge` then merges.
  - A closed code is refused with its state and who closed it, and nothing is written. Also tested: an unknown code, and `--by` given with a code.
  - Who answered and the PM's reason round-trip. They show in `requests <code>`, `braid decisions` and the recap draft. The `--from` and `--reason` checks are tested.
  - Two open requests on an id with no `--by`: `answer` and `withdraw` name both codes and write nothing. Withdraw keeps the record, and the request shows in `--closed`, newest first.
  - `--to 2` and `--done-when` are stored and listed, and bad values are refused. `pr:5` is met on merge, and the pure `filterLive` hides it. The board's signals leave out the request to braid 0002.
  - A story merged into `main` on origin, its branch deleted, missing from this checkout's tree: `ask`, `answer` and `withdraw` work.
  - Merge on read: an offline answer plus a remote forward shows all three events after a fetch. With the old `currentFiles` this test fails (`[answered, opened]`).
- Existing tests updated to the new output: `answer` prints `q-… <id>: answered by …`, and `answer --log` now records the text and commits nothing. `closeRequest` returns `{ found, warning }`. `pm-asks` covers the two-open refusal. The `--to` message and the decisions "none" message changed.
- Gate: `npm run verify` passed.

Docs:

- `docs/cli.md`: ask, answer, withdraw, requests, handover, decisions and recap.
- `docs/braids-format.md`, "The request record" and the requests bullets: `to`, `doneWhen`, the `pr:` check, merge on read, answer, withdraw, requests, decisions.
- `docs/board.md`, Requests: requests to another braid are left out, and a `pr:` wait leaves when its PR is merged.
- `docs/decisions.md`: D97 and the decision-log line.

Open:

- The skills still say `braid answer <id> --log -`. That keeps working, as the answer's text, but the braid log no longer gets the decision; `braid decisions` and the recap read it from the record instead. 0070/D rewrites the skills.
- A wait (`ask --done-when …`) from the coordinator replaces the coordinator's open question on the same item, under 0070/A's rule of one open request per asker and item.

Decisions:

- `--from pm` needs `--reason`, and `--reason` without `--from pm` is refused. This keeps the PM's answers explained on the record.
- The id form without `--by` answers the one open request whichever asker it belongs to, and refuses when both are open. Before, `--by` defaulted to the coordinator.
- `withdraw` is recorded as by the request's asker.
- `--to <number>` must name a braid braid can see.
- `braid decisions` and the recap list only answers by the user or the PM. `braid start`'s "started" (by the coordinator) is left out.
- A `pr:<n>` wait whose PR closes unmerged is withdrawn ("PR #n closed"), as a review is.
- Requests to another braid are kept off the board's user maps now rather than in 0070/C, because otherwise B's new addressee would have pushed to the user.

For later items:

- 0070/C: show requests to another braid (`to` is a braid number) on the asking braid's card, and the `done when` condition. `answeredRows` and `closing` are ready for "who answered" on the board.
- 0070/D: the skills' `braid answer <id> --log -` becomes `braid answer <code> --file -` (and `--from pm --reason` for the PM). They should mention that a wait replaces the asker's open question on the item.
- P6: `braid:` and `time:` conditions are stored as `braid:0042` and `time:<UTC ISO>`, ready to check.

Needs the user: none
