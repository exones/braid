The board now shows every braid number in full with the significant digits bold, and the thread buttons carry role emojis.

**What changed**
- A small `Id` component in `web/src/App.tsx` draws `0034/A` as `00` **`34`** `/A` (`splitId` in `src/board/marks.ts`). Used on cards, strand rows (id column widened), Done rows, the details header, the contents chips (now full ids) and the inbox `from` chip (which also bolds ids inside text such as `review 0012/A`).
- Coordinator shows 🧠; Open thread shows the emoji of its thread's role (💻 worker, 👀 review, 💻 when unknown). On a phone the buttons are emoji only (no words), at least 44 px, with "Open thread"/"Coordinator" as `aria-label` and tooltip (the user's verdict on the mockup). Start and Merge are unchanged.
- The snapshot carries `threadRole` (cards, strand rows, item details). It comes from `T3Thread.role`, which `readT3` already takes from the title with `parseThreadTitle`, so there is no second parser. `ROLES` moved to `src/braids/roles.ts` (no Node imports) so the page can use it; `title.ts` re-exports it.
- `docs/board.md` and `docs/decisions.md` describe it; screenshots 32, 52, 64, 71, 72 in `docs/design/board-screenshots/` are regenerated from `braid board --demo`.

**Validation:** `npm run verify` (gate); tests for the id split (`0034`, `0100`, `1000`, `0034/A`, `0000`), the emoji choice, `threadRole` in the demo snapshot and the role read from idle titles with and without an emoji. Checked in the demo board on desktop and phone width.

**Open:** research threads (🧪) are not placed on an item by the board today (only worker and review threads are), so Open thread never shows 🧪; the code path has no research role to read.

Decisions: user verdict on the mockup: go, with emoji-only phone buttons and bold ids in the inbox chip (both done). Mine: contents chips show the full id; ids inside inbox `from` text are bolded.
For later items: `threadRole` exists on `StrandCard`, `BraidCard` and `ItemDetail`; showing 🧪 would need research threads placed on items in `src/board/t3.ts`.
Needs the user: none
