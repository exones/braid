# 0078/O report

The board page now keeps its live updates going by itself. Before, it relied on one `EventSource` with no error handling, so a stream that a phone browser or a board restart closed for good left the page frozen until a manual reload.

What changed:

- `src/board/live.ts` (new, no DOM types): reopens a stream that errors or closes (1 s doubling to 30 s) and, at once, one silent for 90 s, and reads the board once it is back; on becoming visible, `online` or a restore from the back-forward cache, reads the board once (a fresh read at most every 30 s) and reopens a stream that is down; polls every 60 s only while visible with the stream down.
- `web/src/api.ts`: wires it to `EventSource` and the page events. A refetch that gets no reply now leaves the board on screen (before, it replaced it with the error); an error the board itself answers still shows.
- `web/src/App.tsx`: "stale · last updated 17:19" in the header once no board read arrived for over 90 s; the next read clears it.
- Docs: `docs/board.md` ("Refresh"). The server's event stream is unchanged.

Validation:

- `test/board-live.test.ts`: 10 tests with a fake stream and clock (one reopen per 90 s of silence, at most one fresh read per 30 s, a read with no reply keeping the board and going stale, backoff, late events of a dropped stream, closed without an error, poll only visible and down, silent stream, resume, stop).
- `npm run verify`: passed; node tests 872, 871 passed, 1 skipped, 0 failed (about 13.5 min). A run before it had one failure in `test/request-words.test.ts` ("no braid 9902"); the file passed alone (8/8) and in the next full run.
- Live, 2026-11-28: headless Edge over the DevTools protocol, phone viewport 390x844 (mobile emulation), against this branch's `braid board --demo --no-pause --port 18765` with a temp HOME, through a local TCP proxy that could cut the connection. `--demo` so that no real project was read or written; both processes and the browser were stopped afterwards.
  - Loaded: one stream, board shown, no marker.
  - Board stopped 105 s: board stayed on screen, "stale · last updated" shown, 7 reconnect attempts. Restarted: within 35 s a new stream, reads and no marker.
  - Offline (connection cut and the browser's offline emulation) 105 s: board stayed, marker shown. Online again: 3 s later a new stream, one fresh read, no marker.
  - Backgrounded and frozen 100 s with the connection dropped meanwhile: 3 s after coming back to front a new stream and one fresh read, no marker; 35 s later the pushes were being read again.
  - Screenshots: `~/.braid/artifacts/braid/0078/O-phone-stale.png`, `O-phone-recovered.png`.

Open: not tried on a real phone. The board service serves this only once it runs a build with the change, and an already open page needs one reload to get it.

Review round 1: the docs now say a silent stream is reopened at once; the fresh read on resume is limited to one per 30 s; the read and stale rules moved into `live.ts` so they are tested. The live check ran before these changes and was not repeated. The review's other suggestions (reset on `message`, order in `drop`, `online` while hidden) were left.

Decisions: "a fresh read" on resume is the Refresh button's `?fresh=1` read, at most once every 30 s (a plain read otherwise), so a flipping tab doesn't keep asking GitHub. A stream that is open but silent for 90 s is reopened too (a dropped network can leave it looking open). A refetch with no reply keeps the shown data, else the poll would blank the page while offline.
For later items: `test/request-words.test.ts` "every command takes the name loosely" failed once in a full gate on 2026-11-28 with "no braid 9902" after 40 s, then passed alone and in the next run (likely load; the cause was not looked into).
Needs the user: none
