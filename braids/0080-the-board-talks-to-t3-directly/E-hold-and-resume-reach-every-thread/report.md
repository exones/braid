# 0080/E report: Hold and Resume reach every thread

## What changed

- **Stop before the words** (`src/board/stop.ts`, new). Signed in to T3 with `access: auto`, the board reads T3's live threads once per refresh. That is one `t3_thread_list` call (`allProjects`, `includeSubagents`, the five live statuses, limit 100), and every braid shares it. When it pauses a braid for a limit (steerer step 3) or acts on a hold, it calls `t3_thread_interrupt` `stop: true` on each working top-level target first, then sends the texts as before. Children stop with their parent and are never interrupted directly. Idle threads get only the text.
- **Holds** (`src/board/steerer.ts`, the new hold step). A hold record the board hasn't acted on yet, in a repository whose lease it holds, gets targets: the braid's working threads on every provider (`targetsOf` with provider `null`), minus the thread that ran `braid pause --hold`. The board stops them, then sends each the fixed hold text (`holdText` in `src/board/steer.ts`). The count reads `Held:` replies the way it reads `Paused:`, and a hold settles without a push. The record carries `targets`, `replies` and `stop`; `patchPauses` now takes a filter for which records it may change.
- **Who still works.** For 10 minutes after a stop, while replies are counted or a thread still runs, each refresh's list gives the braid's threads still running: targets that haven't answered, and live children of targets. The card's pause note adds "still working: …" (`stopNote` in `src/board/pause.ts`), and one push goes out 2 minutes after the stop if any thread still runs.
- **Refused stops.** `runtime_mode_escalation_denied` or any other failed interrupt: the thread still gets its text, and the card adds "stop refused: <item> (<why>)". A 401 signs the board out (the sign-in's client does that), and the rest of the refresh goes by the CLI.
- **The limit clash.** The count counts a thread whose last run failed on a usage limit as answered. It reads `failureOf` on the `error` from the `thread show` it already makes. The nudger and the reminder skip a thread whose 0080/C failure is `limit`.
- **Wiring.** `braid board` hands the steerer `mcp: () => signin.client()`. Signed out, `access: cli` or no sign-in: the client is null and nothing changes.
- Resume is unchanged (0074's one path).

## Why

A pause text waits until a busy turn ends and never reaches a delegated child, and a hold was a record that people forwarded by hand (idea 2026-11-25-b1yb). The first pass showed that only `stop: true` reaches children.

## Validation

- `test/board-stop.test.ts` (new, 10 tests, against the mock T3 `test/fixtures/t3-mcp-mock.ts`, which now has a settable live list and a 401-on-interrupt switch):
  - a limit pause stops the top-level threads once, before any text, and never a child;
  - idle threads get only the text;
  - a refused stop still gets the text and the card shows why;
  - a 401 mid-tick means no more MCP calls and every text still goes;
  - signed out sends exactly the same texts as signed in with nothing live, and makes no MCP request;
  - a hold stops once, sends the hold text, and counts `Held:` to `paused`;
  - signed out, a hold stays a record;
  - still-working shows on the card, pushes once at 2 minutes and clears when quiet, with at most one list per tick;
  - a usage-limit failure counts as answered;
  - a signed-in pause starts no synchronous process.
- `test/board-nudge.test.ts` and `test/board-remind.test.ts`: a `limit` failure is neither nudged nor reminded, and a provider 429 still is.
- Nothing runs on the request path. The stop runs only in the steerer's tick, which `observe` queues off the snapshot, never inside an HTTP handler.
- The gate (`npm run verify`): see the gate note below.

## Docs

- `docs/board.md`: a new "Stop before the words" section under T3 sign-in, the hold line on the card, and the limit clash under Provider limits.
- `docs/cli.md`: the `braid pause --hold` row.
- `docs/braids-format.md`: the `stop` part, and the hold's `targets` and `replies`.

## Open

- **Live check** (Completion box left open): a hold on a scratch braid with a scratch coordinator thread and one delegated child, signed in. Per the brief it runs later, through the coordinator, with the user's sign-in. Nothing here touched a real T3.
- The live list is one page of 100 live threads across all projects, with no paging. Braid's live threads are far fewer (0083 measured 6).
- Killing child shell processes that outlive a stop is P26's.

For later items: P5's Hold button can write the same hold record; the board then acts on it through this path.
Needs the user: none
