# 0084/C: Several open questions on the board

The board now shows every open question of an item as the approved mockups do, each answered, dismissed and pushed on its own; Dismiss and Acknowledge and the phone's Board | Requests switch are built.

## What changed

- **Every open request** (`src/board/model.ts`): each item, strand and programme carries `asks`, all open requests that reach the user, the PM's counted with the coordinator's, oldest first. `requestOf` from 0084/F is replaced by `asksOf`; `openItemRequests` stays the source.
- **Card**: the oldest question, then "+N more" (opens the Requests tab); a folded braid card "+N more in strands"; with Details off the ? icon counts them and its tooltip lists them. A handover with a question is in Needs You, its box and Merge button above (D46 amended by D122).
- **Details, Questions panel, programmes panel**: one "Needs you · n open" box for the coordinator's several; PM requests keep "from the PM"; every `pm/<slug>` and every forwarded request is listed.
- **Pushes** (`src/notify/message.ts`): one per request (`<id>#<code>`), so a second question no longer replaces the first and closing one clears only its own.
- **Dismiss and Acknowledge**: `braid answer <name> --dismiss | --ack`; the board's `answer` action takes `{ close: "dismiss" | "ack" }`; buttons with words in the Questions panel and in a card's request box. Dismiss: `withdrawn` by the user, the asker woken once. Ack (looks only): `answered` by the user with the wake's own mark in the same write, so nobody is woken. Both show under Decided. No new state, event or field.
- **Phone**: Board | Requests under the project selector, count badge, last tab kept per device, Requests the first time something waits.
- **Demo**: 0004/B has three open requests, `working-product` two, Decided a dismissed and an acknowledged one.
- `origin/main` (PR #388) is merged in; conflicts only in `docs/decisions.md` and `requestLines` in `src/commands/coordinate.ts` (main's version kept, which matches the PM's own request).

Screens (demo data): [card and programmes](screens/desktop-card-and-programmes.png), [details](screens/desktop-details-requests.png), [phone Requests](screens/phone-requests.png), [phone Board](screens/phone-board.png).

## Presses that did nothing on the phone (shiny-monkey-mo72)

**Open: why the presses on the live board recorded nothing.** The user then answered in chat; the live board (`main`, port 7800) logs no actions, so those presses left no trace. What is known:

- The route from the phone works: on this branch's demo board over Tailscale the user's press of A arrived from 100.106.113.74 and was done after 11.0 s (2026-11-28 17:08).
- The server cuts nothing at 11 s; a real answer can take far longer (record fetch, up to 60 s for its lock, write, push, wake of the asker).
- Any unexpected error in an action answered a bare `500 error` and was logged nowhere, and `main`'s page shows an error only at the top of the Questions panel, off screen on a phone.

Once a board with this change runs, the next real press says which it is in `board-<port>.err.log`: no "arrived" line (it never reached the board), "refused <status> … <reason>", "failed after N s: <error>" (the record write), "the page went away after N s" (the phone gave up), or "done after N s".

**Found by the phone test: the "sent" line vanished.** On success the tall card collapsed and the next question opened, and for a request that closed the only line was at the top of the panel, off screen. Now the card keeps its line until a read drops the request, the line is scrolled into view, and a closed request's line is pinned to the bottom of the window ([sent](screens/phone-sent.png), [sent and closed](screens/phone-sent-and-closed.png); the "closes" case was driven by rewriting the board's data in the browser).
Fixed whatever the cause: every action is logged (arrived, done, refused or failed with the reason, page gone, with listener and peer), an error answers in words, and the page shows each send in place (below).

- **While sending** (`src/board/sends.ts`, `web/src/sends.ts`): "Sending…" on the pressed button, "still sending (the record is being written)" after 5 s, errors in words, "already answered by …: …" instead of buttons, the send kept across a reload, the "sent" line until a read drops the request.
- Screens at 390 px with an 11 s fake write (`BRAID_DEMO_ACTION_MS`): [sending](screens/phone-sending.png), [still sending](screens/phone-still-sending.png), [after a reload](screens/phone-sending-after-reload.png), [already answered](screens/phone-already-answered.png) (that refusal was faked in the browser).

## Behaviour that differs from before

- After upgrading, the board clears the old per-item pushes and sends each open request once more under its own ID.
- The card shows the **oldest** open question (0084/F showed the newest).
- A look beside a handover also puts the item in Needs You (any request other than a handover does, as a lone look did already).
- The wake line for a dismissal is `Wake: <handle> dismissed by the user without an answer; if you still need it, ask again with what changed.`, with the `Wake:` prefix the other board messages have.

## Validation

- New suite `test/board-acknowledge-dismiss.test.ts` (CLI, board action, wake once or never, three questions and their pushes, a programme's two, Decided, the demo). Existing tests updated where they expected one request per item, the newest request, or per-item push IDs.
- Demo board driven in headless Edge at 1900 px and 390 px: the screens above; the last tab survives a reload; no horizontal overflow; no page errors.
- `test/board-sends.test.ts`: the stages of a send, the list across a reload, the refusal naming who and what, the action log without token or text.
- Gate on the commits before the sending fix: `npm run verify` on Windows, exit 0: 878 tests, 877 passed, 1 skipped, none failed (node tests 774 s). **Not yet run on the sending fix** (typecheck, build and the touched suites pass).

## Docs

`docs/board.md` (Several open requests on one item, Acknowledge and Dismiss, wakes, the answer action, the phone, notifications), `docs/cli.md`, `docs/braids-format.md`, `docs/decisions.md` (D123), `docs/getting-started.md`, `README.md`, and the CLI help.

## Anything open

- The details panel has no Dismiss or Acknowledge, as the user decided.

For later items: 0084/D: the skills' text must say a dismissed request is asked again only when still needed, and that `Wake: … dismissed by the user` is a board message (`.agents/skills/braid/SKILL.md` "The board's messages"); `docs/braids-format.md` still says `braid forward <id>`. P5: cards now read `asks` per item and strand (`ItemNeeds` in `web/src/App.tsx`), requests carry buttons (`web/src/Close.tsx`), and on a phone the Questions panel is a tab, not below the board.
Needs the user: none
