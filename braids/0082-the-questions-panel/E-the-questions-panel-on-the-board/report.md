# 0082/E: The Questions panel on the board

## What changed

- **The model** (`src/board/questions.ts`, `question-list.ts`): per project, the open requests that reach the user, routed as the cards route them, with rank, who asks, `blocks`, context, options and the merge data; and Decided from the closed record, braids and programmes. `/api/board` and `/api/all` carry `questions` and `decided`; `/api/all` ranks all projects together.
- **The panel** (`web/src/Questions.tsx`): right of the lanes, 416 px, sticky and scrolling by itself; a rail with the count and an escalation mark when collapsed; the roomy card with context open, option buttons that send at once, ✎ for one line, the next question opening after an answer, a refusal shown and the list read again; Merge on review requests; Look and FYI and Decided folded; stacked below the board on a phone.
- **The page** (`web/src/App.tsx`): both side panels remember their state and below 1600 px opening one collapses the other; a Done strand's request shows on the compact card with Details off; Refresh, Only these and Plan are icons with tooltips (words stay on a phone); a programme need's footer names the panel.
- **Demo** (`src/board/demo.ts`): the `api` sample project now has an escalated question, one blocking several items, one on a Done strand, a look and decided requests with a PM's reason, so every rank shows.

## Screens

From `braid board --demo` (`?projects=demo,api`), in a headless Chrome at 1600 px:

- [open](screens/open.png)
- [collapsed to the rail](screens/collapsed.png)
- [an opened card](screens/opened-card.png)
- [looks and Decided opened](screens/decided.png)

The same run also drove: the Custom field, one answer by button (the next card opened), the 1400 px collapse both ways, and 390 px (no horizontal scroll). No console errors on the final run. The first run found a crash after an answer (an effect returning `scrollIntoView`'s promise as its cleanup); fixed.

## Choices the brief didn't settle

- A request the PM is still handling isn't listed until it escalates or is forwarded.
- A question nothing waits on (on a Done item) has its own group, "Blocks nothing", above the folded group, which keeps only `look` requests (D118). A look stays folded even when escalated.
- "Stops a braid" is a request on a braid itself, a plan, or one blocking everything some braid still has to do (so the last open item of a braid counts).
- A forward by the PM is not marked escalated; only a timeout or a gone PM thread is.
- Icon-only applies to the board's Refresh, Only these and Plan; the Inbox page's Promote to Braid, dialog buttons and list controls (Show more, Show all, strands) keep their words.
- "Below about 1600 px" is a viewport under 1600 px; the panel opened last stays open (the Questions panel on first load).
- The details panel's own "answer in the thread" footers are unchanged (still true; out of scope).

## Validation

- `test/board-questions.test.ts`: every rank and the order inside them, what isn't listed, merges, context and options, strands' own and Done strands' requests, Decided, the combined list, the next question.
- Gate `npm run verify` on Windows: exit 0, 816 tests, none failed (about 17 min).
- The panel's React behaviour has no automated test; it was driven by hand through the demo as above. The demo accepts an answer without writing, so recording and waking rest on 0082/D's tests.

## Docs

`docs/board.md` (a new section "The Questions panel", and the lines about answering, Done items, the programmes panel and the phone), `README.md` and `docs/getting-started.md`. No new user decision, so `docs/decisions.md` is unchanged. 0082/F still does the docs as a whole.

## Anything open

- The `mail` demo project repeats `api`'s two older questions (its failed read shows its last board), visible in the panel without `?projects=`.
- About 1000 added lines with tests, against the expected 700.

For later items: 0082/F: add a Questions panel screenshot to the docs' board screenshots.
Needs the user: none
