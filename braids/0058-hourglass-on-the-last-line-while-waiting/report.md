## What changed

`.agents/skills/braid/SKILL.md`, "Talking to the user": two bullets (+2 lines). A turn that ends while waiting has `⏳ Waiting for <what>` as its last line (before a question tool call, last line of the chat message; no line when nothing is pending). Worker and reviewer threads are linked when mentioned.

## Why

The user can't tell a waiting turn from a finished one, and needs to open the threads.

## Validation

`npm run verify` (see PR checks). `braid check`.

## Open

The `braid-pm` skill (0054) is not on main; the coordinator captures the same line for it after this merges.

For later items: add the same ⏳ line to `braid-pm` once 0054 is on main.
Needs the user: none
