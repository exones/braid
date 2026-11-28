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

## Behaviour that differs from before

- After upgrading, the board clears the old per-item pushes and sends each open request once more under its own ID.
- The card shows the **oldest** open question (0084/F showed the newest).
- A look beside a handover also puts the item in Needs You (any request other than a handover does, as a lone look did already).
- The wake line for a dismissal is `Wake: <handle> dismissed by the user without an answer; if you still need it, ask again with what changed.`, with the `Wake:` prefix the other board messages have.

## Validation

- New suite `test/board-acknowledge-dismiss.test.ts` (CLI, board action, wake once or never, three questions and their pushes, a programme's two, Decided, the demo). Existing tests updated where they expected one request per item, the newest request, or per-item push IDs.
- Demo board driven in headless Edge at 1900 px and 390 px: the screens above; the last tab survives a reload; no horizontal overflow; no page errors.
- Gate: `npm run verify` on Windows, exit 0: 878 tests, 877 passed, 1 skipped, none failed (node tests 774 s).

## Docs

`docs/board.md` (Several open requests on one item, Acknowledge and Dismiss, wakes, the answer action, the phone, notifications), `docs/cli.md`, `docs/braids-format.md`, `docs/decisions.md` (D123), `docs/getting-started.md`, `README.md`, and the CLI help.

## Anything open

- The details panel has no Dismiss or Acknowledge, as the user decided.

For later items: 0084/D: the skills' text must say a dismissed request is asked again only when still needed, and that `Wake: … dismissed by the user` is a board message (`.agents/skills/braid/SKILL.md` "The board's messages"); `docs/braids-format.md` still says `braid forward <id>`. P5: cards now read `asks` per item and strand (`ItemNeeds` in `web/src/App.tsx`), requests carry buttons (`web/src/Close.tsx`), and on a phone the Questions panel is a tab, not below the board.
Needs the user: none
