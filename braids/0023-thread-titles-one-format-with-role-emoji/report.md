## What changed

- `src/braids/title.ts`: one builder and one parser for `<emoji> <repo> <id> <role>: <title>` (🧠 coordinator, 💻 worker, 👀 review, 🧪 research). The parser also reads titles without the emoji. The repo is the GitHub repository's name (`origin`), else the folder's.
- `braid title <id> --role <role>` prints the full title with the brief's title exactly. Start uses the same builder.
- The board places an idle thread by its title (item id and role, repo must be this one's GitHub or folder name); no `t3 thread show` for idle threads, `IDLE_SHOW_CAP` is gone. Running threads keep their `show`.
- `braid clean` follows from that, and now reads GitHub and T3 once for all braids instead of once per braid.
- A running coordinator titled in either format (or with the checkout's old folder name as repo) is found, so 0022's rule (a To Do braid reads Working while its coordinator runs) works with the new titles; tested. The skill tells a coordinator to retitle its own thread when it takes a braid.
- braid SKILL.md ground rule, `docs/board.md` and `docs/decisions.md` describe the format and the matching.

## Why

`braid clean` and every board refresh ran `t3 thread show` for up to 40 idle threads (about 3 s each); the title tells the same.

## Validation

- `npm run verify` passes (222 tests); `main` (0022) merged in. New `test/title.test.ts`; `test/board-start.test.ts` uses a fake `t3` that records `show` calls and finds idle worker, review and coordinator threads by title, with and without emoji.
- `braid clean` (dry run) on this repo: 1m53 before, about 15 s now (the remaining time is the one GitHub read, the one T3 read for running threads, and git checks).

## Open

- Existing threads keep their old titles; those without a parseable title no longer get an idle Open thread button (renaming is out of scope).

For later items: none.
Needs the user: none.
