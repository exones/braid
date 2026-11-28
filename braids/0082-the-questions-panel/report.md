The Questions panel (programme row P25) is built: one panel right of the board lists every open question of every served project, ranked by what it blocks, and the user answers each in place, with an option button or one line of free text, then on to the next. Agents propose those options on the request record (P17). Answered questions are listed under Decided, for programmes too.

What changed, by strand:

- 0082/A (PR #359): mockups of the panel on test data; the user approved them with six answers and one change (shiny-muffin-fqro, D118).
- 0082/B (PR #360): the gaps from the 0072 live check and the spoken-handle gaps: handles in "replaced by" and `braid decisions`, `braid ask` names the request it replaced, waits read `waits for 0077` or `until 21:00`, escalated and forwarded marks on the Requests tab, open requests on Done braids stay on the board, `braid board --help` and `--no-pause`'s wording; tests for `Need.handle` and an all-digit q-code.
- 0082/C (PR #361): optional request fields `context` and `options`, a sixth kind `look` for look requests and FYIs, `braid ask --context/--context-file/--option/--kind look`, `braid answer <handle> <letter>`; the braid and braid-pm skills open requests with `--option` (D119).
- 0082/D (PR #362): the board's `answer` action, through `braid answer`'s code and the other actions' guard on both listeners, no confirmation; the asking thread is woken at once (D120).
- 0082/E (PR #363): the panel: six groups (escalated, stops a braid or programme, blocks several, blocks one, blocks nothing, looks folded), merges ranked, the roomy card with context open, options sending at once, Custom line, Decided for braids and programmes, the rail, the 1600 px rule, icon-only board buttons; screens in `E-the-questions-panel-on-the-board/screens/`.
- 0082/F (PR #364): the docs as a whole.

Validation: every strand passed the gate and both CI checks and had an independent review (re-checks after fix rounds on C and F); the last gate run counted 816 tests. The panel's page behaviour (send, refusal, next question) was driven by hand on `braid board --demo`, not by an automated test.

All Completion boxes hold.

Open, as leftovers: 2026-11-26-x4s2 (a loose handle test; no push for a Done item's escalation), 2026-11-27-nre6 (the answer action checks a wait before fetching; a wake test without `--to pm`), 2026-11-27-gxg6 (an escalated look stays folded; a ranking case and the page's clicks untested), 2026-11-27-k0pn (the braid workflow reference still says only braid commands write `braid-requests`). The README's top screenshot and `31-board.png` predate the panel.

Decisions: the user's answers: shiny-muffin-fqro (mockups approved: 1A send at once, 2A merges ranked, 3A no context box for old requests, 4B one side panel collapses the other below about 1600 px, 5B a mark for looks, 6B Done questions shown in the panel and on the card, context open on an opened card); calm-guitar-nde8 through the PM (`look` is a kind, no `fyi` flag); smooth-window-jjid (answering on both listeners, no confirmation); through the PM, build to the end after the mockups on preset `free`. Coordinator and workers, logged: no pushes for Done items' requests; look pushes at default priority unless escalated or forwarded; a lone letter through `--file` maps to its option; the answer action sends its wake itself, also under `--no-pause`, with owed wakes kept in memory only; PM-handled requests listed once escalated or forwarded; D118 to D120 keep their numbers.
For later items: none beyond the leftovers above.
Needs the user: process: the braid and braid-pm skills changed (0082/C); the user merges them with this braid's final PR into main.
