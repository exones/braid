# 0049/D: the combined board page

## What changed

The board page shows every project at once. One combined board holds the cards of all projects shown, each with a project tag; a project filter picks all, one or any several, and lives in the address as `?projects=a,b`. Following the approved mockups (`docs/design/board-mockups/41`–`50`):

- **Projects block.** On a desktop it is one summary line by default (`Projects · 3 of 3 shown · api: read failed · notes: not ready`), which always names a failed read and a not-ready project, also when that project is unticked. A click opens one line per project: tick, lane counts, readiness (ready, not ready with its problems, read failed with the board's age and the reason, not read yet) and "only". On a phone a picker above the lane tabs opens a bottom sheet with the same lines, and a note under the picker names a shown project's problem.
- **Cards and panel.** With two or more projects shown, cards, Done rows and inbox entries carry the project tag; cards of a project whose last read failed get a dashed edge and ⚠. The panel header repeats the tag and shows a red note for a failed read.
- **Addresses.** `#/p/<project>/0003` (with `?tab=`), and `#/0003`, `#/0003/A`, `#/inbox` still work and mean the first project shown. Every action (Start, Merge, Open thread, Promote) now sends the item's `project`.
- **One project served** looks as before: no block, no tags; a failed read gets a red banner of its own.
- `docs/board.md` (Several projects, Demo), `docs/decisions.md` (D79), screenshots `51`–`59` in `docs/design/board-screenshots/`.

## Why

The user works on several projects and wants one place to see what needs them (0049, D78). The filter in the address lets a bookmark or phone link open the same view; the collapsed default keeps the lanes first.

## Validation

- `test/board-route.test.ts` and the new `test/board-filter.test.ts` cover the routes and the filter.
- Ran `braid board --demo` (three projects, `notes` not ready) and took the screenshots from it with Chrome: all, one, two of three, opened and collapsed block, card with tag and panel, inbox, phone picker and phone panel.
- The gate (`npm run verify`) passes; CI status is in the PR.

## Open

- The open or closed state of the Projects block is remembered in this browser (`localStorage`, `braid-projects-open`), so once opened it stays open on that browser. Closing it makes the default again.
- `--demo` has no project with a failed read, so that state is shown only in the mockups (44, 45, 49), not in a screenshot of the built page.
- The tag colours are the placeholders the user approved.

For later items: a demo project with a failed read, so the screenshots can show it; per-project colours chosen by the user.
Needs the user: none
