---
id: '0078/O'
title: "The board page recovers its live updates by itself"
status: To Do
labels: ["kind:task", "tier:S"]
dependencies: []
order: 65
---

## Goal

The board page in a browser, on a phone above all, keeps updating after it was backgrounded, went offline or the board service restarted, without a manual reload. A bug the user reported through the PM (2026-11-28): "I think there's a bug on the board (phone): it seemingly never gets updated." Added to 0078 at the PM's request.

Expected size: about 60 to 120 lines in 2 to 4 files.

## Start here

- `web/src/api.ts:103-111`: the page updates only through one `EventSource("/api/events")`, with no `onerror`, no `visibilitychange` handling and no fallback poll.
- The server side is fine (the PM checked): `curl -N <board>/api/events` gets `data: refresh` every 30 s, and the log is clean.
- Likely cause: on a phone, Chrome freezes a backgrounded tab and drops the connection. If a reconnect fails once (a network switch, the Tailscale relay, a board restart), the EventSource ends CLOSED and the page never updates again. The board service restarted twice on 2026-11-28, and the phone went on and off Tailscale.

## Change

- When the stream errors or closes, reopen it with backoff (for example 1 s doubling to 30 s).
- On `visibilitychange` to visible, and on `online` and `pageshow`, refresh once (a fresh read) and reopen the stream if it is closed.
- A quiet fallback poll, about every 60 s, only while the page is visible and the stream is down.
- A small "last updated <time>" or stale marker when no refresh came for over 90 s; it clears on the next refresh.
- Tests where feasible (the reconnect and the visibility logic, with fake EventSource and timers).

## Already decided

- Tier S, after 0078/F and before 0078/G (the PM, 2026-11-28). One worker at a time, focused tests before the gate.
- Live-check on a phone-sized viewport: background or offline the tab, then return; restart the board; the page must recover by itself. Say in report.md how it was checked.

## Out of scope

- The server's event stream; other board views.

## Plan

1. `src/board/live.ts`: the reconnect, resume, poll and silent-stream logic with an injected environment (testable without a DOM).
2. `web/src/api.ts`: wire it to `EventSource` and the page events; keep the shown data when a refetch gets no reply; note when a read last answered.
3. `web/src/App.tsx`: the stale marker in the header.
4. `test/board-live.test.ts` (fake stream and timers), docs/board.md, a live check on a phone viewport against a temp HOME.

## Completion

- [x] The page reopens a dropped or closed stream with backoff, and refreshes on becoming visible, online or shown again, tested where feasible
- [x] A fallback poll runs only while visible with the stream down, and a stale marker shows after 90 s without a refresh
- [x] Live-checked on a phone-sized viewport (backgrounded, offline, board restart), recorded in report.md
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated (docs/board.md), or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
