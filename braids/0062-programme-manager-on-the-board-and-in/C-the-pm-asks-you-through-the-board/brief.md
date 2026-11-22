---
id: '0062/C'
title: "The PM asks you through the board"
status: Done
labels: ["kind:story", "tier:M"]
dependencies: ['0062/A', '0062/B']
order: 30
---

## Goal

The PM asks the user through the board, not only in its chat. Its question about the whole programme (`braid ask pm/<slug>`), about one braid (`--by pm`), or something only the user can do (the new kind `action`) is an open request. It shows in Needs You and is pushed at high priority, opening the PM thread. A PM request on a braid no longer replaces that braid's coordinator request. This is the design the user approved in 0062/A (report question 3).

Expected size: about 350 lines in 8 files.

## Start here

- `braids/0062-*/A-*/report.md`: questions 3 (the PM's own requests), 4 (pushes), 9 (across projects) and "Strands, restated", C. Mockup screens 60 and 66.
- `src/braids/requests.ts` as strand B left it, `src/commands/requests.ts`, `src/board/model.ts`, `src/notify/`.

## Change

- **The request store keys by item and asker:** `by: coordinator | pm`, a missing one reading as `coordinator`. A PM request and the coordinator's on the same braid are both open and both shown. `braid answer` and `braid requests` name which one.
- **`braid ask pm/<slug> "<text>"`** opens a programme request. `pm/<slug>` must be a `pm/*` branch of the project (local or `origin`).
- **`braid ask <braid> "<text>" --by pm`** opens a PM request on one braid.
- **`--kind action`:** something only the user can do. It reads "The PM asks you to: <text>".
- **The board:**
  - Until strand D builds the programmes panel, a programme request shows as a plain card in Needs You, with the slug and the request.
  - A `--by pm` request shows on its braid's card as "The PM asks you: …" or "The PM asks you to: …" (screen 60).
- **Pushes:** a programme request is titled `<repo> <slug>: the PM asks` (the project name when two repositories share a name, D83), at high priority, with the 🧭 tag and the PM thread as its click. A `--by pm` request is pushed the same way under its braid's id.
- Tests, and `docs/board.md` and `docs/cli.md`.

## Already decided

- The user approved the design (logged on 0062/A).
- Options stay plain lines in the request text; no options field.
- Depends on strand B (the request record changes there first).

## Out of scope

- The programmes panel and the stalled programme: strand D. Skill changes: strand E.

## Plan

- Store: `by` on a request (a record without it is the coordinator's); one open request per (item, asker); `closeRequest` takes an asker (none: both).
- Signals: `requests` stays the coordinator's by item; new `asks` (the PM's, by item) and `programmes` (`pm/<slug>`).
- Board: `pmAsk` on cards, strands and details; a PM request puts the item in Needs You and is its need when nothing else is asked; a programme request is a plain card "Programme <slug>". T3 gives `links` (thread id to link) for the PM thread click.
- Pushes: own key and sequence ID, `<repo> <id|slug>: the PM asks`, high, `compass`, the PM thread.
- CLI: `ask --by pm`, `ask pm/<slug>` (branch check), `--kind action`, `answer --by pm`, `requests` and `status` show the asker. Tests in test/pm-asks.test.ts; docs board, cli, braids-format.

## Completion

- [x] A PM request on a braid and that braid's coordinator request are both open and both shown; tests cover the store with old records
- [x] `braid ask pm/<slug>` opens a programme request that shows in Needs You and is pushed at high priority with the PM thread as its click; an unknown slug is refused
- [x] `--kind action` reads "The PM asks you to: …" on the board and in the push
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
