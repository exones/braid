---
id: '0044/A'
title: "ntfy notifications from the board"
status: In Progress
labels: ["kind:story", "tier:L", "ask:security", "ask:outward", "ask:architecture"]
dependencies: []
order: 10
---

## Goal

The user gets an ntfy push on their phone when an item moves onto their side of the board (Needs You or To Review), and when a braid is Done, so they no longer have to keep watching the board or chats. `braid notify` sets it up once per machine; the running `braid board` sends.

Expected size: about 500 lines in 8 files, half of them tests.

## Start here

- `docs/board.md`: the lanes and the two broke alarms (`checks failed`, `stalled`); these, and the open requests, are what a push reports.
- `src/board/model.ts`: `derive`, `Need` and `toBoard`; a card's `lane`, `reason` and `need` (text, age, `who`, `pr`) are what a push says.
- `src/commands/board.ts`: `startBoardWith`, the refresh loop (`begin`, `refresh`) and `current`, the snapshot each refresh makes; `runBoard` for the flags and the printed lines.
- `src/board/signals.ts`: how `.braid/broke.json` in the main checkout keeps a first-seen clock across restarts (temp file, then rename); the sent-state file follows the same pattern.
- `src/braids/title.ts`: `titleRepoName`, the repo name thread titles use.
- `src/cli.ts`: command dispatch and the help text.

## Change

- New `src/notify/` (config, message, sender) and `src/commands/notify.ts`: `braid notify setup [--topic <t>] [--server <url>]`, `braid notify test`, `braid notify off`, and `braid notify` alone printing the state (server, topic shown in part, on or off, where the token comes from).
- `setup` without `--topic` makes an unguessable topic (`braid-` plus at least 20 random characters from `node:crypto`), stores it and prints how to subscribe in the ntfy app (server, topic and the full subscribe URL).
- The settings live in one per-user file, `notify.json` under `~/.braid/` (where the installed skills already live), so one topic covers every project on the machine. The access token for a protected self-hosted server is read only from the environment variable `BRAID_NTFY_TOKEN` and sent as `Authorization: Bearer`; it is never written to any file or printed.
- `src/commands/board.ts`: after each refresh that read GitHub and T3 successfully, hand the snapshot to the notifier when notifications are on. One push per item that is newly in Needs You or To Review; a need is new when its key (item id, lane, reason or request kind, and the request's or alarm's start time) wasn't sent before. Keep the sent keys in `.braid/notified.json` of the main checkout, written like `broke.json`, and drop keys whose item has left the user's side, so a need that comes back is sent again. On the first run, needs already on the board are sent once.
- A braid Done: when a top-level braid card (a story or a goal) moves into Done while the board runs, one push (key: braid number and `done`), default priority, body the title and its PR. Done braids already on the board at the first run, or seen Done before, are recorded as sent without a push, so setup never floods the phone with history. Strands merging send nothing.
- A braid card with strands carries its strands' needs (`need.who`, `more`): push per strand need, not one per braid.
- The push: title `<repo> <id>: <lane as the board names it>`, body the item's title and the need line, a tag per reason (ntfy `Tags`), `Priority: high` for Needs You and default for To Review, and `Click` the item's T3 thread link when it has one, else none. Nothing else from the repository: no brief text, log, diff, branch or path, because a topic on ntfy.sh is readable by anyone who knows its name.
- A failed send (network, HTTP error, timeout of 10 seconds) is printed to the board's standard error and retried at the next refresh; it never stops or slows the board's refresh or its pages.
- `runBoard` prints one line saying notifications are on (server and partial topic) or how to turn them on; `--demo` never sends.
- `docs/cli.md`, `docs/board.md` (a Notifications section: what triggers a push, what it contains, privacy of ntfy.sh topics, self-hosting and the token variable) and a decision entry in `docs/decisions.md`.
- Tests: config read and write, and topic generation; key building and dedupe across a simulated restart; strand needs on a braid card; leaving and returning; a braid becoming Done pushes once, and Done braids present at the first run push nothing; the message fields (no extra repository text); a failed send retried and not marking the key sent; the board never blocked by a hanging send; the token only from the environment. Tests use a temporary home and a fake sender, never the network or the real `~/.braid`.

## Already decided

- The running board sends; there is no separate daemon, watcher or scheduled task (0044, "Already decided").
- ntfy over HTTPS with the built-in `fetch`; no new npm dependency. Default server `https://ntfy.sh`.
- Settings per user in `~/.braid/notify.json`; the token only in `BRAID_NTFY_TOKEN`.
- Triggers are exactly the lanes Needs You and To Review as the board derives them; this strand adds no new reason. The only other push is a braid becoming Done (user, 2026-11-20).

## Failure modes

- No network or ntfy down: the board runs on, each failed key stays unsent and is retried, and the error prints once per outage, not per refresh.
- GitHub or T3 unreadable for a refresh: no push and no change to the sent keys from that refresh, so a lane that only looks changed because a source is down sends nothing.
- `notified.json` missing or corrupt: start empty, which may resend current needs once; never crash.
- Two board processes on one repository: both read and write `notified.json`; a duplicate push is acceptable, a crash or a lost file is not.
- A topic or token never appears in logs, errors, board pages or `braid notify` output beyond the partial topic.

## Out of scope

- The braid-level stall (0044/B).
- Other channels, other events (a strand merged, a PR opened), ntfy action buttons, per-project topics, quiet hours.

## Completion

- [ ] `braid notify setup`, `test`, `off` and the bare state work as described, with the token only from `BRAID_NTFY_TOKEN`
- [ ] The running board sends one push per new Needs You or To Review need (strand needs per strand), never twice across a restart, and again when a need returns; and one push when a braid becomes Done, none for braids already Done at the first run
- [ ] A push carries only the repo, item id, lane, title, need line, tag, priority and thread link
- [ ] A failing or hanging send never stops or delays the board, and is retried at the next refresh
- [ ] Tests listed under Change, without network or the real `~/.braid`
- [ ] `docs/cli.md`, `docs/board.md` and `docs/decisions.md` updated
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

- `src/board/model.ts`: `Need` gains `since` (ISO start of the request or alarm; null for an agent's pending question or a stored Done waiting for its merge), so a push key can name when the need began.
- `src/notify/config.ts`: `~/.braid/notify.json` (`server`, `topic`, `enabled`), read tolerant (missing or corrupt: not set up), written temp-then-rename; `newTopic()` = `braid-` + 24 chars from `crypto.randomInt`; `partialTopic`; the token only from `BRAID_NTFY_TOKEN`; the server must be `https://`.
- `src/notify/message.ts`: from a `BoardData`, the pushes it calls for: one per item in Needs You or To Review (strands of a braid card per strand; a braid's own need when it is the card's top need), and one per Done braid card. Key `<id>|<lane>|<kind>|<since or #pr>`; title `<repo> <id>: <lane label>`; body title + need text; tag per reason; priority high for Needs You; click the thread's `t3code://` app link (T3's own link is a 127.0.0.1 page the phone can't open).
- `src/notify/sender.ts`: ntfy JSON publish (`POST <server>` with `{topic,title,message,tags,priority,click}`, UTF-8 safe), `Authorization: Bearer` from the env, 10 s `AbortSignal.timeout`; errors name the server and status only.
- `src/notify/notifier.ts`: `.braid/notified.json` of the main checkout (`{ keys: { key: itemId } }`); each successful refresh (GitHub and T3 ok) prunes keys no longer current, records Done braids without a push on the first run (no file or corrupt), and sends the new keys without awaiting; a key is written only after its send succeeds; in-flight keys are not sent twice; the error prints once per outage. Re-reads the file before each write so two boards don't lose each other's keys.
- `src/commands/notify.ts` + `src/cli.ts`: `braid notify [setup [--topic t] [--server url] [--new-topic] | test | off]`. Setup keeps an existing topic unless `--topic`/`--new-topic` (so re-enabling after `off` doesn't break the phone's subscription).
- `src/commands/board.ts`: `Sources.notify?(board)` called after each ok snapshot (try/catch, never awaited); `repoSources` builds it from the config read at each refresh, so `braid notify off` takes effect without a restart; `runBoard` prints the notifications line; the demo has none.
- Tests (`test/notify.test.ts`) against `dist/`, a temp home and a fake sender; docs: cli.md, board.md Notifications, decisions D70.
