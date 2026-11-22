# Report: 0062/C The PM asks you through the board

**What changed**

- **Store:** a request has `by: coordinator | pm` (a record without it is the coordinator's). An item has one open request per asker, so a PM request and the coordinator's on one braid are both open; a new one replaces only its own asker's. `closeRequest` takes an asker (none: both, for `start` and `accept`). A programme request has the id `pm/<slug>`. New kind `action`.
- **CLI:** `braid ask <braid> … --by pm` (thread: `--thread`, else the brief's `PM-run` line); `braid ask pm/<slug> …` (the slug must be a `pm/*` branch, local or on `origin`, else nothing opens); `--kind action` (PM only). `braid answer <id> --by pm` (or `pm/<slug>`) closes the PM's; without `--by` it closes the coordinator's and names the PM's when only that is open. `braid forward` touches only the coordinator's. `braid requests` says `from the PM`; `braid status` shows the PM's request under its item.
- **Board:** a PM request puts its item in Needs You with "The PM asks you: …" (`action`: "The PM asks you to: …"). Cards, strands and details gain `pmAsk`: it is the need when nothing else is asked, and shows next to the coordinator's need when both are open (card line and a details box). A programme request is a plain card "Programme <slug>" in Needs You, opening the PM thread. T3's read gained `links` (thread id to link) for that click.
- **Pushes:** a PM request is pushed once, at high priority, tag `compass`, titled `<repo> <slug>: the PM asks` (a braid: `<repo> <id>: the PM asks`), clicking to the PM thread. It has its own key and sequence ID (`…#pm`), so the coordinator's push for the same item stays and each clears on its own. The `<repo>` is already the project name when two repositories share one (D83).
- The demo board has a PM action on 0004/B and a programme request.

**Why:** the design the user approved in 0062/A (question 3, screens 60 and 66).

**Validation**

- `npm run verify` passes. New `test/pm-asks.test.ts` (7 tests): the store with old records (both open, replace and close per asker), the card with both requests, `action` on card, push and status, the push (priority, tag, click, own key), the programme request end to end through `readSignals`, `toBoard` and `pushesOf` (an unknown slug refused, nothing opened), `--by`/`--kind`/`--to` checks, `requests`/`answer`/`forward`. Existing tests updated for the new fields.
- Not drawn in a browser: the page changes (extra need lines, details box) are typechecked and built only. Not sent to a real ntfy topic.

**Docs:** updated `docs/board.md` (Requests, Notifications), `docs/cli.md` (ask, answer, requests) and `docs/braids-format.md` (requests record). No README change; `docs/decisions.md` is not touched (the design record is 0062/F).

Decisions: Decided: the PM's request is a second field (`pmAsk`) next to `need`, so both asks show without changing what `need` meant. Decided: a programme request is a synthetic card until strand D's panel; it is not a braid, so its details page is empty. Decided: `--kind action` is refused for a coordinator's request. Decided: `--to pm` with `--by pm` is refused (a PM request is already yours).
For later items: strand D replaces the synthetic programme card (`programmeCard` in `src/board/model.ts`; `Signals.programmes`). Strand E: the PM asks with `braid ask --by pm` and `braid ask pm/<slug>`, and closes with `braid answer --by pm`; it should pass `--thread` with its own thread id.
Needs the user: none
