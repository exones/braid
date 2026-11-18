# Report: 0020/F Sweep commands: take, pass, drop, reopen

## What changed

- `src/commands/sweep.ts` (new), dispatched from `inboxCommand` in `src/commands/inbox.ts`: `braid inbox take <entry>... --into <ids>`, `pass <leftover>...`, `drop <entry>... --why <reason>` and `reopen <entry>`.
  - Each command runs in 0020/A's `writeInbox`: the `change` function loads every named entry from the current branch view and validates them all before returning, so one unknown or ill-formed id, or one refused entry, throws and nothing is committed. After a refused push it re-runs on the fetched tip, so `passed + 1` stays correct.
  - One commit per command, pushed, with a message like `docs(inbox): sweep: pass 1, drop 1` (`docs(inbox): reopen <id>`).
  - `pass`: `passed` + 1; at 2 the leftover becomes `dropped` with `why: passed over in 2 sweeps` (`passed` stays 2). An idea is refused with "ideas are never passed over".
  - `reopen`: back to `open`, `why` and `into` removed, `passed` reset to 0.
- `braid help`, `docs/cli.md` and `docs/braids-format.md` describe the commands.

## Why

The sweep needs commands that change entries on `braid-inbox` without hand-editing, one verb each, with a typo changing nothing.

## Validation

- `test/inbox-sweep.test.ts` (3 tests, temporary repositories with a bare remote and an isolated HOME and Git config): all four verbs change the files and push as one commit each; two passes drop a leftover with the reason; reopen resets it; an idea is refused by `pass` with nothing changed; an unknown id, a malformed id, a missing `--why` or `--into`, bad braid ids and a wrong state leave the branch head unchanged (local and remote).
- `npm run verify` passes.

## Open

- My choices where the brief was silent: take, pass and drop work only on an `open` entry (a taken or dropped one must be reopened first); reopen accepts a dropped or taken entry (so a wrong `--into` can be undone) and also clears `into`; `--into` ids must be four digits; an entry named twice is refused. A pass that drops counts as `pass` in the commit message, with `drop` added.

For later items: none.
Needs the user: none.
