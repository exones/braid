---
id: '0080/E'
title: "Hold and Resume reach every thread"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: ['0080/C', '0080/D']
order: 50
---

## Goal

Signed in to T3 (0080/D), the board stops the working threads of a braid it pauses or holds at once, delegated children included, instead of queueing text behind a busy turn. Today a limit pause sends its text with `t3 thread send` (it lands only when the turn ends, never in a child), and a hold (`braid pause <n> --hold`) is only a record: coordinators and the PM forward it by hand (idea 2026-11-25-b1yb: about 10 threads kept working after every coordinator said "held"). Also the limit clash: a thread whose last run failed on a usage limit counts as paused. Signed out, everything works as today.

Expected size: about 450 lines in 6 to 8 files.

## Start here

- `src/board/steerer.ts` (0074/C, D, H): the tick: count, resume, pause by code (step 3: claim records, send each target its text with `t3 thread send`), wake. `src/board/steer.ts`: `targetsOf` (who a braid's pause reaches), the texts. `src/board/resume.ts`: the one resume path, already retrying a failed send until delivered (idea qcf4).
- `src/braids/pauses.ts`, `src/commands/pauses.ts`: the records; a hold is `reason: "hold"` with the words, no provider.
- `src/t3/signin.ts`: `BoardSignIn.client()` gives an MCP client while signed in and `access: auto`, else null (use the CLI). A 401 through it signs the board out.
- `src/t3mcp/client.ts`: `callTool`; failures `unauthorized`, `unreachable`, `error` with T3's code (`runtime_mode_escalation_denied` for a thread above the board's level).
- `src/board/failure.ts` (0080/C): `failureOf`, kind `limit` for a usage limit (a 429 is `provider`).
- `src/board/nudge.ts`, `src/board/remind.ts`, `src/board/wake.ts`: the board's other sends.
- `braids/0080-…/brief.md` "First-pass test results": only `t3_thread_interrupt` with `stop: true` stops the children (about 1 to 4 s); the parent is told and invited to restart its tasks; children's shell processes may outlive the stop (P26's).
- `braids/0083-how-braid-can-read-t3-lightly/report.md` (in `main`), "Recommendation for braid": cheap calls are `t3_thread_list` with live `statuses`, `t3_thread_read {limit: 1}`, `task_status`; avoid an unfiltered list paged to the end and status filters with non-live statuses.

## Change

- **Stop before the words.** When the board pauses a braid for a limit (steerer step 3) or a hold record appears for a braid, and the board holds the lease and is signed in: for each working thread of that braid (coordinator, workers, recorded reviewers, and their running children from one live-only `t3_thread_list` with `includeSubagents: true`), call `t3_thread_interrupt` with `stop: true` on the top-level threads (children stop with their parent), then send the text as today. A hold's text is new and fixed by code: the hold's words, "stop at a clean point, commit or note where you are, start nothing, reply `Held: <id>`, and don't restart your stopped tasks until a resume". Threads already idle get only the text.
- **Who still works.** After the stop, one live-only list shows any thread of the braid still running; the board shows them on the braid's card ("still working: …") and pushes once if any remain after 2 minutes. Replies (`Held:` / `Paused:`) are counted as 0074 counts `Paused:`.
- **Refused stops.** `runtime_mode_escalation_denied` or any other failure of an interrupt: the thread gets the text as today and the card says why (e.g. "stop refused: thread runs above the board's level"). An `unauthorized` falls back to the CLI path for the rest of the tick.
- **The limit clash.** A thread whose last run failed on a usage limit (`failureOf` kind `limit`) counts as paused: the board doesn't nudge or remind it and doesn't count it as missing a `Paused:` reply; only the resume reaches it. T3's own usage-limit auto-resume stays off (documented by 0080/H).
- **Resume.** Unchanged: 0074's one path, which already retries until T3 answers. Lifting a hold (`braid resume <n>`) stays the user's and sends nothing new here; the Go button and its message are P5's.
- **Signed out or `access: cli`:** exactly today's behaviour, and the hold stays a record only.
- Tests with the mock T3 (`test/fixtures/` from 0080/B and D): a pause and a hold each stop the working top-level threads once and then send the text; idle threads get only the text; children aren't interrupted directly; a refused stop falls back and shows why; a 401 mid-tick falls back to the CLI; signed out sends exactly as before; a `limit`-failed thread is neither nudged nor counted missing; no call on the request path, nothing synchronous (test/board-async.test.ts).

## Already decided

- Only `stop: true` reaches children (first pass); a stopped parent is invited to restart its tasks, so the hold text says not to.
- Holds: the board acts on the hold record; the Hold button, Held lane and Hold all are P5's (after this braid). The board never resumes or nudges a held braid (0074 already leaves holds alone).
- Light T3 use (the user's priority, 2026-11-28; 0083): at most one live-only list per affected braid per tick and one interrupt per working top-level thread; no per-record reads, nothing on a timer beyond the existing tick.
- Killing child shell processes that outlive a stop is P26's, not this strand's.

## Out of scope

- The Hold/Go buttons, the Held lane, Hold all (P5); events (0080/F); settling threads (P35).

## Plan

1. `src/board/stop.ts` (new): the stop by MCP. `liveThreads(client)` is one `t3_thread_list {allProjects, includeSubagents, statuses: the 5 live, limit: 100}` per tick, shared by every braid; `stopTargets` interrupts each live top-level target with `stop: true` (children are left to their parent), notes refusals with their reason, and turns an `unauthorized` into "CLI for the rest of the tick"; `stillWorking` reads the braid's threads and their live children off the same list.
2. `src/braids/pauses.ts`: a record's optional `stop` part (`at`, `stopped`, `refused`, `still`, `pushed`); `patchPauses` takes which records it may change, so a hold (by coordinator or PM) can carry `targets`, `replies` and `stop`.
3. `src/board/steer.ts`: `targetsOf` with `provider: null` (a hold: every provider), the fixed hold text, `heldLine`.
4. `src/board/steerer.ts`: an `mcp` getter in the options; step 3 stops the claimed braids' threads before the texts; a new hold step (repository lease) acts once on a hold record without `replies`; the count reads `Held:` too and counts a thread whose last run failed on a usage limit as answered; a still-working step each tick for 10 minutes after a stop, one push at 2 minutes if any thread still works.
5. `src/board/pause.ts`: the card's note shows "still working: …" and "stop refused: … (why)".
6. Limit clash: `nudge.ts` and `remind.ts` skip a thread whose failure is `limit`.
7. `src/commands/board.ts`: the steerer gets `mcp: () => signin.client()`.
8. Tests (`test/board-stop.test.ts`) on the mock T3 (`test/fixtures/t3-mcp-mock.ts` gets a settable thread list); docs/board.md.

## Completion

- [x] Signed in, a limit pause and a hold stop each working top-level thread of the braid with `stop: true` before sending the text; idle threads get the text only
- [x] The card shows threads still working after the stop and refused stops with their reason; one push if threads still work after 2 minutes
- [x] A thread whose last run failed on a usage limit counts as paused (no nudge, not missing a reply)
- [x] Signed out or `access: cli`, behaviour is unchanged (tests prove it)
- [x] Tests cover the cases under Change against the mock T3, with no synchronous call and nothing on the request path
- [ ] Live check (with 0080/D's, before the final PR, the user signed in): a hold on a scratch braid with a scratch coordinator thread and one delegated child stops both; or report.md says what is left
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
