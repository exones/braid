# 0069/D report

## What changed

- `braid notify send "<line>" --thread <id> [--programme <slug>]` (`src/commands/notify.ts`): the PM's own push with no board item, sent at once without the board, storing nothing. Title `<repo> pm/<slug>: the PM` (no `--programme`: `<repo>: the PM`), the line as body (whitespace collapsed, cut at 200 characters with an ellipsis), 🧭, high, sequence ID `braid-<repo>-pm-<slug>-send` (no programme: `braid-<repo>-pm---send`), so a newer line replaces the older. The click is T3's link to the thread (`t3 thread show <id> --json`, `link`), as `t3code://threads/<env>/<thread>`; when T3 doesn't know the thread the body ends with "Open the board", like the board's pushes.
- Off, not set up, or a failed send: prints `Not sent: <why>` and exits 0, so a PM never fails on it. The output names the server's host, never the topic or the token.
- `showThread` (`src/board/t3.ts`) also returns the thread's `link`.
- Help line in `src/cli.ts`; the usage line of `braid notify`.
- `.agents/skills/braid-pm/SKILL.md` "The digest": the digest and "nothing can run until the user acts" are also pushed with `braid notify send`, one line saying what waits, no repository details (the topic may be public). Words replaced, not added: before 150 lines, 3063 words; after 150 lines, 3063 words (`wc -lw`).

## Why

The PM's digest and "nothing can run until you act" reached the user only in chat; under the one rule nothing else pushes them. ntfy only, never T3's push tool, so nothing arrives twice.

## Validation

- `test/notify.test.ts` "braid notify send pushes the PM's line …": not set up and off (no send, `Not sent: …`), the exact push and its ntfy JSON body (`ntfyBody`: topic, title, message, tags, priority 4, click, sequence_id), the `thread show` call, the token from `BRAID_NTFY_TOKEN`, an unknown thread (no click, "Open the board"), the 200-character cut, a failed send (no throw), usage errors, the CLI's exit 0 when not set up, and that no output holds the topic or the token.
- `npm run verify`: passes (559 tests).

## Docs

- `docs/board.md` "Notifications": a bullet for the PM's own line; "the PM pushes … itself" points to it.
- `docs/cli.md`: a row for `braid notify send`.
- `docs/decisions.md`: not changed; 0069/E writes the braid's decision entry.

## Open

- A failed send also exits 0 (the brief named only off and not set up); a PM never fails on it either way. Logged as decided.

For later items: 0069/E can fold the board.md bullet into its rewrite of "Notifications" and add `braid notify send` to D92 or its own decision row.
Needs the user: none
