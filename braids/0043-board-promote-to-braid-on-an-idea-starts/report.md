# Report 0043

## What changed

- **Promote to Braid** on every idea row of the Inbox page (button on the collapsed row; full width, 44 px under the preview on a phone). A confirmation (idea, what launches, what happens after, model, base branch and branch) then the `promote` action launches a coordinator thread in T3 that plans a braid from the idea.
- `promote` (`src/commands/board.ts`): re-reads the inbox with a fetch, refuses with `Promote: <reason>` (not an open idea, leftover, T3 unreachable, a coordinator already planning it, fetch or ref failure), then like Start: `git fetch origin`, free branch `coordinator/idea-<id>` (`-2`, `-3`) from `origin/<main>`, `t3 thread start` without model flags, first message on stdin, model warning. Title `🧠 <repo> idea coordinator: <title>`. First message quotes the idea in full, says it is the user's request to plan (not start), and names `braid inbox take <id> --into <ids>` after approval. Nothing is written to `braid-inbox`.
- "Being planned": a running T3 thread whose branch is `coordinator/idea-<id>` (or `-2`, `-3`) (`ideaThreads` in `src/board/t3.ts`, from `thread show`'s `branch`). The row shows that and an Open thread button (`open` with `{ idea }`; the link is the server's).
- Review round (PR comment): the confirmation shows the base the server uses (`inbox.base`, `origin/<main>` from BRAID.md, carried next to `expected`) instead of a hardcoded `origin/main`; `docs/board.md` lists four actions (`merge`, `start`, `promote`, `open`), says Promote reads the inbox and T3 fresh, that `open` also takes `{ idea }`, and links the session-token reference.
- Docs: `docs/board.md` ("The inbox", no longer read only, three screenshots), D67 in `docs/decisions.md`.

## Why

An idea became a braid only by asking a coordinator in a chat; the board can ask for the planning. The user approved the mockups on 2026-11-19 (button on the row, wording as mocked).

## Validation

- `npm run verify` passed on the final head, also after the review fixes, and CI was green on both systems (315 existing tests plus the new ones).
- `test/board-promote.test.ts` (9 tests, including the `base` the dialog shows, fake `t3` and `git`): the launch (args, title, branch, first message, no model flags), `-2`/`-3`, model warning, each refusal with nothing launched, failed launch, the planning check, the board marking the planned idea, Open thread on an idea, reading T3.
- Screenshots from `braid board --demo` (desktop 1440, confirmation, phone 390) in `screenshots/` and `docs/design/board-screenshots/54`–`56`. The mockups of round 1 are in `mockups/`.

## Open

- On desktop the Open thread button in the planning row is the board's usual icon-only button (the mockup drew a label); the label shows on the phone.
- After a successful Promote the dialog stays open with the result (branch, next step, model warning) and the row says "Coordinator started" until the next refresh shows "Being planned".

For later items: none.
Needs the user: none.
