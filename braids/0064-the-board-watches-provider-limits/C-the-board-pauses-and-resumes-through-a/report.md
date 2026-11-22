# Report: 0064/C The board pauses and resumes through a steering thread

A running board now pauses every agent on a provider over its threshold through a 🚦 steering thread, resumes them after the reset plus the buffer, and pushes each event. This is the board's one exception to the click-only rule, for limits only (D90). `--no-pause` turns it off for a run, and `--demo` never acts.

## What changed

- **`src/braids/pauses.ts`:** `by: board` joins `PAUSERS`. A board record also carries `targets` (thread, kind, item, project), `steering` (thread, link, provider, model, started, outcome `pausing`/`paused`/`partial`/`failed`, counts, children, no answer, reason, `self`) and `resumed`. `claimPauses` adds records only for braids that have none, in one `locked()` call: that is the claim against a second board. `patchPauses` changes the board's own records under the lock. `clearPause` takes a filter.
- **`src/board/steer.ts` (new, pure):**
  - the `models.steering.first`/`fallback` lines and their pick (the first under its threshold, else `first`, steering from the over provider);
  - the targets of a braid on the provider: coordinator (running, else idle), workers (running or idle), running recorded reviewers, and PM threads whose plan lists the braid (T3 now keeps `providers` per thread for them);
  - the first-message template, with the worker pause text of `limits.md` unchanged plus a coordinator and a PM variant, the children search, an explicit 10-minute wait, settling, and the last line;
  - the `Steering:` parser (children as `<id>:<item>`, T3 ids with colons), the resume messages, and the limit pushes of mockup 6 with their keys.
- **`src/board/steerer.ts` (new):** one board-wide steerer that every served project's feed hands its good snapshot to (`Sources.act`). Ticks run one at a time:
  1. **Follow** each pausing steering thread with `t3 thread show --messages 3 --json`: its line, a `failed`/`interrupted` run, or 15 minutes with no line.
  2. **Resume** each `by: board` record whose `resumeAt` has passed, after a re-check. `ok`/`unknown`: one `t3 thread send` per thread, then a clear of the board's own limit record only. A failed send is retried for that thread alone and given up after 5 tries. `pause`: the record is kept with the new time.
  3. **Pause** per provider over its threshold: claim the records, then start one thread in the first project that has a steering role, trying the fallback line once if the start fails.
- **Board (`src/commands/board.ts`):** `--no-pause`, and the start line `Limits: …` (on with the steering lines, or no `steering` role, `--no-pause`, demo).
- **Pushes (`src/notify/notifier.ts`):** `limitPusher` sends each limit push once, keyed in `notified.json` (`pause:<provider>:<window>:<reset>:<event>`, kept 8 days). The need notifier keeps those keys. A `limit` need is not pushed again per braid.
- **Model and page:**
  - reason `limit` (⚖) in Needs You for a weekly window until its reset, and for a failed pause; derived from the record, with no request file;
  - card lines for pausing (pulsing icon), paused by the board with "n of m agents answered", didn't answer (amber), resume due, and failed;
  - the chip's `pausing…` note and the panel's steering line with Open thread;
  - the demo's 0025 is now a board pause steered from codex.
- **Hold rule** (leftover `2026-11-22-7kqa`, added in the sweep): of the brief's two options I chose the simpler one, **don't target a held braid**. The board skips any braid that has a record and clears only its own `by: board` limit record, so a hold put on later survives the board's resume. `braid pause --provider` refuses a held braid. The new `braid resume --limit` clears a limit pause and leaves a hold; plain `braid resume` still lifts a hold.

**Why:** the user wants one watcher with pushes, instead of each coordinator's and PM's check task (0064). The record comes first because it is the lock and survives a failed steering run; the resume is a plain send because idle threads start on it (0064/A).

## Validation

- `npm run verify` passes.
- New `test/board-steer.test.ts` (12 tests) with a fake T3 runner and cache files written per test:
  - the claim and one start, with codex's braid untouched; a later refresh and a second board start nothing;
  - the template's content;
  - partial and full outcomes, with children joining the targets;
  - the "pausing" push after a minute; a failed run and the 15-minute limit, as Needs You and not as a need push;
  - fallback once, failed start, both providers over;
  - no steering role;
  - still over then resumed, with the exact messages; a missed resume after a restart, with a send failure retried for one thread;
  - the weekly push and Needs You;
  - the hold rule (board and CLI);
  - the parser;
  - limit keys kept by the need notifier.
- **Live runs, 2026-11-22.** They used the real steerer and real `t3`, in a throwaway T3 project whose own BRAID.md had the steering role, with fixture caches (Claude_Everix at 98%, reset 5 min after the start, buffer 0). The target was a busy Claude haiku probe thread. The probe and steering threads are archived, and the project is deleted from T3.
  - **Claude steering** (codex also set over, so `first` steered in the margin and pushed "over, steering from it"):
    - steering thread started 19:43:49Z;
    - its `Steering: Claude_Everix paused 1/1` line was read 19:47:46Z;
    - resumed and cleared 19:48:34Z, right after resumeAt 19:48:21Z.
    
    The 4 minutes are the probe finishing its 240 s command, as the pause text lets it.
  - **Codex probe** (`codex / gpt-6-luna`):
    - started 19:49:19.8Z;
    - `t3_thread_list` with `includeSubagents` at +7 s, `mode:"auto"` send at +13 s, then `t3_thread_wait`;
    - the probe's `Paused:` came 19:50:37Z (after its 90 s command); line and settle 19:50:41Z; settled itself (`settled: true`);
    - the board read `paused 1/1` 19:50:45Z, then resumed and cleared at 19:54:08Z.
    
    **Codex steering works.**
  - **A first Codex run found a template gap:** it sent and settled without waiting and reported `0/1` after 30 s. The late `Paused:` then woke it into an empty turn, which is correct. The template now names `t3_thread_wait` and forbids ending before all replies or 10 minutes; the rerun above waited.
  - **Real start:** `braid board --no-open --no-pause` against the listed projects printed `Limits: shown only (--no-pause: the board pauses and resumes nothing)`.

## Docs

- `docs/board.md`: Paused, and Provider limits with a new "The board pauses and resumes"; the Refresh write list; the Notifications limit pushes.
- `docs/cli.md`: `--no-pause`, `--by board`, `resume --limit`, the hold rule, and who writes pauses.
- `docs/braids-format.md`: the record fields.
- `docs/autonomy.md`: the hold rule.
- `docs/getting-started.md`: one sentence on the board.
- `docs/decisions.md`: D90 replaces D87's pauser, and its log line.
- The CLI help in `src/cli.ts`.

## Open

- The pausing card line says how many agents were asked, not "1 of 2 answered" as in mockup 2: the board learns the answers only from the `Steering:` line at the end.
- No spinner graphic: the pause icon pulses instead.
- This repository's BRAID.md still has no `steering` role, so a board here pauses nothing and says so on its start line. That is the user's edit.

For later items:
- D: switch the skills' limit resume to `braid resume --limit`, so a coordinator's or PM's resume can never lift a hold.
- D: workers' `Paused:` lines should carry their item id (one probe used its thread id); the board matches by thread anyway.
- The spike's "Pause now" chip button, and archiving older settled steering threads.

Needs the user:
- process: the `steering` role in BRAID.md `models` (`first: Claude_Everix / claude-haiku-5-5 / effort=low`, `fallback: codex / gpt-6-luna / effort=low`), so the board here pauses at all; it is your edit.
