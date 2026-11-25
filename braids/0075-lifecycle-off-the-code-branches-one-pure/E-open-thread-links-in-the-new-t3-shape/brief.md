---
id: '0075/E'
title: "Open thread links in the new T3 shape"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: []
order: 25
---

## Goal

The board's Open thread buttons are back. A T3 update changed thread links from `http://127.0.0.1:3773/<env>/<thread>` to `https://app.t3.codes/threads/<env>/<thread>`. `t3codeUrl` accepts only the old two-segment path, so it returns null for every new link: the Open thread button hides on a remote board, and push links, the steering chip and the PM's link lose their target. A hotfix for the user, delivered into `main` on its own PR ahead of the rest of 0075.

Expected size: about 40 lines in 2 to 4 files, most of them tests.

## Start here

- `src/board/marks.ts` 168-181: `t3codeUrl`, `T3_SEGMENT`.
- Its callers: `web/src/App.tsx` (264, 394-398 `OpenThread`, 1675), `web/src/Limits.tsx` 127, `src/notify/message.ts` 79, `src/commands/notify.ts` 55, `src/commands/board.ts` 375-476, `src/board/model.ts` 337 (it finds any link `t3codeUrl` accepts, to derive a base).
- A real new-shape link: `t3_thread_read` or `t3 thread show <id> --json` on any thread gives `link`; a delegated child's id has `%3A` in it (`thread:delegated-task:command%3Amcp%3A…`).

## Change

- `t3codeUrl`: accept both shapes, `/<env>/<thread>` and `/threads/<env>/<thread>`, on any host; the result stays `t3code://threads/<env>/<thread>`.
- Tests: both shapes, with a real id that has `%3A` in it (a delegated child's), and one shape that must still give null.
- Check every caller above with the new shape; fix any that builds or compares links by the old shape (model.ts 337 especially).

## Already decided

- Decided by the PM: this hotfix goes into `main` on its own PR, ahead of 0075's final PR, because the user lost the Open thread buttons now. Its branch is cut from `main` (not from the braid branch, which already holds 0075/B), and its PR goes into `main`; the braid branch merges `main` afterwards.
- Only the link shape changes; no board redesign.

## Out of scope

- Anything else of 0075.

## Completion

- [x] `t3codeUrl` gives `t3code://threads/<env>/<thread>` for both link shapes on any host, null otherwise (tests, including a real `%3A` id)
- [x] Every caller of `t3codeUrl` works with the new shape (checked; fixed where needed, with a test)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
