---
id: '0082'
title: "The Questions panel"
status: To Do
labels: ["kind:story", "tier:L", "ui"]
dependencies: []
related: ['0077', '0080']
delivery: epic
autonomy: careful
---

## Goal

Programme pm/autonomous-dev-machine, row P25. The user, 2026-11-25: "when several projects are running, I find myself mostly concentrating answering questions than looking at the board or lanes." One panel on the right of the board lists every open question across the projects, ranked by what it blocks, and the user answers each in place: the lettered options as buttons, or one line of free text, then on to the next. Agents propose those likely answers on the request record (P17, idea 2026-11-23-wcox). The panel also lists what was decided, for programmes too.

Expected size: about 1200 lines in 20 files over five strands, tests included.

## Start here

- `braids/0072-questions-say-what-they-unblock/`: its brief, report and log; 0072/B's `mockups.html` (the roomy question card, revised at d72bb557) is the starting point of the design.
- `docs/decisions.md` D110 to D116 (0072), above all D112: the roomy card belongs to this panel.
- `src/braids/requests.ts` (the record, `Request`, `RequestEvent`), `src/commands/requests.ts` (`braid ask`, `braid answer`), `src/board/model.ts` (`Need`, `blocks`, `act`, `needOfRequest`), `src/board/programme.ts` and `src/board/pm.ts` (programme requests, `routeOf`), `web/src/App.tsx` (the programmes panel, `RequestsTab` with its Decided group).

## Change

- 0082/A: mockups of the panel on test data; the user approves the design before anything is built.
- 0082/B: the six gaps from the 0072 live check and the spoken-handle gaps, so the panel shows clean data.
- 0082/C: the optional request fields `context` and `options`, `braid ask --context/--context-file/--option`, and coordinators and the PM proposing likely answers.
- 0082/D: answering a request from the board, recorded as the user's answer, with the asking thread woken.
- 0082/E: the Questions panel itself, as the approved mockups show it.
- 0082/F: the docs as a whole.

## Already decided

- The user, binding: "1. b, but on the right and a bit wider, collapsible; 2. a; 3. a": the panel sits right of the board, a bit wider than the programmes panel, and collapses; questions are answered in place.
- "E room is for special panel on the right": the roomy card lives in this panel, not in the details panel (D112).
- q-zctf: "spacier cards in details panel which could contain sufficient context when I uncollapse it ..., question itself, answer buttons, button custom which replaces all buttons with text field".
- q-i0ry: board buttons are icon-only with the words in the tooltip ("as we agreed"); Open thread and thread links stay as they are.
- "where can I see the answered questions for the program? I don't see it in the UI": the panel shows Decided for programmes too (the PM's own `pm/<slug>` requests, e.g. tiny-tractor-3i2b).
- Ranking: stops a braid or programme entirely, then blocks several items (more first), then one item, then nothing (look requests, FYIs; collapsed). Oldest first within a rank; escalated on top. Each row: the handle (0072/G), the question, who asks (a programme's PM or a braid's coordinator, with the project), `blocks … · decide|do` (0072/A), the wait and an escalation mark.
- UI items: mockups on test data first; the user reviews the design before anything is built.
- Takes in leftovers 2026-11-26-03t9 (six gaps from the 0072 live check) and 2026-11-25-1onw (spoken handles), and idea 2026-11-23-wcox (likely answers, P17).
- Related to 0077 (The board stays fast under load, on `braid/0077-the-board-stays-fast-under-load`) and 0080 (The board talks to T3 directly, on `braid/0080-the-board-talks-to-t3-directly`): both change the board's server and web code. Nothing past the mockups is built in this run, so no merge order is set yet; the building strands start after both have merged into `main`, or merge `main` first.
- P5 (Held lane, usage meter) is planned in the programme and will change the board layout too; the mockups may show where this panel sits beside the programmes panel.

## Out of scope

- Answering from the phone strip or pushes (ntfy actions); the panel is the desktop board's, and at phone width it only stacks.
- Changing how escalation works or its 20/60-minute limits.
- Redesigning the details panel's Requests tab beyond 0082/B's gaps.

## Completion

- [ ] The board shows the Questions panel right of the board, collapsible, with every open question of every project ranked as decided above, and Decided for braids and programmes
- [ ] A question is answered from the panel with an option button or one line of free text, recorded as the user's answer, and the asking thread is woken
- [ ] `braid ask` takes `--context`, `--context-file` and `--option`; the record keeps them and older records read unchanged
- [ ] The six gaps of leftover 2026-11-26-03t9 and the gaps of 2026-11-25-1onw are fixed
- [ ] Docs from BRAID.md `docs` that this braid makes untrue are updated (0082/F)
- [ ] The gate command from BRAID.md passes

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.

This run (the user, 2026-11-26, "can you start P25 but just to produce mockups"): only 0082/A runs, up to the user's approval of the mockups; then the braid holds until the PM's go.
