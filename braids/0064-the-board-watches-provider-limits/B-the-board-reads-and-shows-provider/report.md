The board now reads every provider's usage at each refresh and shows it against its threshold, as the approved mockups' screens 1, 3 and 5 show. It neither pauses nor pushes: that is C.

**What changed**

- `src/board/limits.ts` (new): one `ProviderView` per provider, built with `readProvider` of `braid limits` (nothing reimplemented) over every instance in BRAID.md `models`, plus any provider a running thread uses. It is read from T3's cache files in each snapshot, with no extra `t3` call. The chip state is ok, near (within 10 points), over, paused (a limit pause record names the provider), unknown, or not measured (T3 reports it unsupported, as for cursor). It lists the paused braids and the running agents per provider. `mergeLimits` joins the projects of the combined board by provider.
- `BoardData.limits` and `AllBoard.limits` (`/api/board`, `/api/all`). `Sources.limits(t3, pauses)` is the one new source; `--demo` supplies Claude_Everix paused, codex ok, cursor not measured through the same builder.
- `src/board/t3.ts`: `T3Thread.provider` (T3's `providerInstanceId`) on worker threads (the list's value, else `thread show`) and reviewer threads (`thread show`), as coordinators already had. A running thread titled `🚦 <repo> steering: …` is no item's agent, wherever it runs.
- `src/braids/title.ts`, `roles.ts`: `STEERING_EMOJI` (🚦), `steeringTitle` and `parseSteeringTitle`.
- `web/src/Limits.tsx` (new), `App.tsx`: the header chips, the limits panel opened from a chip (windows with bars and thresholds, roles, paused and running agents; no steering line yet) and the phone strip with a full-screen panel. The words are in `src/board/limits-view.ts`.
- `docs/board.md`: new "Provider limits" section with screenshots 110 to 112.

**Why:** the board, not each coordinator and PM, is to watch the limits (0064). B is the read-only part, so the user can see the chips before C makes the board act on them.

**Validation:** `npm run verify` passes (527 tests). New `test/board-limits.test.ts` (8 tests): chip states from the cache fixtures, a stale cache, the paused record and a hold (names no provider), a provider only a running thread uses, a BRAID.md without `models`, merging projects, the thread provider on worker, reviewer and coordinator threads, a steering thread placed in an item's worktree being no agent, the title pattern, and the demo data. `test/reviews.test.ts` expects the new `provider` key. A real run: `braid board --demo` in headless Edge, desktop and 390 px phone (screenshots in the final report).

**Not proved:** a run against the real `~/.t3` caches. That is a read of real data, which the brief doesn't permit, so the first box stays open: the fixtures and `--demo` cover the same code.

**Docs:** `docs/board.md` updated. The decisions record, `docs/cli.md` and the CLI help are unaffected (no new command or flag; C and E document the pause itself).

**Open:** the demo project names prefix the agent list in the panel ("demo: 0009") because the demo serves four projects; with one project it shows the plain id. The "over" chip has no "pausing…" text; that comes with C.

Decisions:
- The user approved mockups 1, 3 and 5 (2026-11-22); built to them without a new round.
- `STEERING_EMOJI` is a constant next to `ROLES`, not a key of `ROLES`: `ROLES` feeds `braid title --role` and `TitleRole`, and a steering thread has no item id to title.
- A paused chip's resume time is the earliest `resumeAt` among the limit pause records of that provider, else the reading's own.
- The panel lists a paused braid as `<number>` and reads the pause record's provider; a hold (no provider) shows on no chip.

For later items: C reads `ProviderView.state` and `agents`, and `T3Thread.provider` for targets; the PM threads have no provider in the snapshot (T3 lists none for `pmChecks`), so C finds PMs by title. `LimitsView` has no steering field yet: add it with `pausing…` text and the pause-failed states. `readLimitsView(root, t3, pauses, now, caches)` is the function to call for a re-check at resume time.
Needs the user: none
