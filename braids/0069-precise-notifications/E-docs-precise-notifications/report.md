# 0069/E report

## What changed

- `docs/board.md` "Notifications": the intro said the board pushes when an item comes onto your side and when a braid is Done; it now says the one rule (only what someone explicitly asks of you, no mode setting) and points to D93. The strands' triggers, thread, merge group and the PM's direct push were already there from A–D and still hold.
- `docs/decisions.md`: new D93 (one rule from the request record, each push opens the thread that needs the user, no `mode` setting, `braid notify send`); D88's "Done at `low`" marked superseded by D92; log line.
- CLI help (`src/cli.ts` `forward`): no longer says a forward reaches Needs You; it is the PM's ask in the programme's Needs you, opening the PM's thread.
- `docs/getting-started.md` (PM paragraph, board paragraph), `README.md` (programme bullet), `docs/roadmap.md` (a built entry for 0069).

## Docs from BRAID.md `docs`

Updated: README.md, docs/getting-started.md, docs/board.md, the CLI's help text, docs/decisions.md, docs/roadmap.md. Unchanged: docs/cli.md (`braid notify send` and `forward` already by D and B/C), docs/autonomy.md, docs/development.md, docs/braids-format.md, docs/npm-distribution.md.

## Validation

`npm run verify` (gate).

For later items: none.
Needs the user: none.
