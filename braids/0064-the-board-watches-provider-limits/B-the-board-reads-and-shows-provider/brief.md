---
id: '0064/B'
title: "The board reads and shows provider limits"
status: In Progress
labels: ["kind:story", "tier:M", "ui"]
dependencies: ['0064/A']
order: 20
---

## Goal

The running board reads every provider's usage at each refresh and shows it against its threshold: header chips, a limits panel and the phone strip, as the approved mockups show. It neither acts nor pushes yet; C does both.

Expected size: about 350 lines in 8 files (0064/A's estimate).

## Start here

- `braids/0064-the-board-watches-provider-limits/A-spike-steering-thread-board-limits-view/report.md` (Q2 targets, Q6 and "Proposed strands"), and `mockups/limits.html` screens 1, 3 and 5 as the user approved them (2026-11-22).
- `src/braids/limits.ts` (`readProvider`, `readProviders`), `src/commands/limits.ts`: the verdicts to reuse, not reimplement.
- `src/board/t3.ts` (`T3Thread`: `providerInstanceId` is kept only for coordinators today), `src/board/model.ts`, `src/board/combined.ts`, `src/board/demo.ts`, `src/braids/roles.ts`, `src/braids/title.ts`, `web/src/`.
- `docs/board.md`, "Paused", "Several projects" and "On the phone".

## Change

- The board snapshot gets each provider's reading and verdict. The providers are every instance in `BRAID.md` `models` of the listed projects, plus any provider a running thread uses. They are read at each refresh from T3's caches, without extra `t3` calls.
- `providerInstanceId` is kept on worker and reviewer threads as well as coordinators (C needs it for targets).
- The header chips (ok, near, over, paused, unknown, not measured), the limits panel opened from a chip (windows, roles, agents per provider; the steering line stays empty until C), and the phone strip, all as in the mockups, also in `--demo` with demo readings.
- The steering role: `steering: "🚦"` in the roles and a title pattern for `🚦 <repo> steering: …` threads, so no item reads such a thread as one of its agents.

## Plan

- `src/braids/limits.ts`: export the not-measured reason marker (the verdicts stay as they are).
- `src/board/limits.ts` (new): `LimitsView`, per provider the reading, a chip state (ok, near within 10 points, over, paused when a pause record names it, unknown, not measured), its roles and the paused and running agents. Built from `readProviders` over BRAID.md `models` plus the providers running threads use. Pure; merged across projects by provider.
- `src/board/t3.ts`: `provider` on every `T3Thread` (the list's `providerInstanceId`, `show` for reviewers); a steering title (`🚦 <repo> steering: …`) is no agent; `ROLES.steering`.
- `Sources.limits(t3)` read in each snapshot (T3 caches only), `BoardData.limits`, `/api/all` `limits`; demo readings.
- `web/src/App.tsx`: header chips, the limits panel from a chip, the phone strip with a full-screen panel, as mockups 1, 3 and 5.
- Tests for the view, the thread provider, the steering title, the board data and the page; `docs/board.md`.

## Already decided

- See the braid's brief, including "Decided after spike 0064/A". Reuse the code and thresholds of `braid limits`.
- Starts after 0062 merges into `main` (both change `src/board/` and `web/src/`): merge `main` into the braid branch first (the user, 2026-11-22).

## Out of scope

- Pausing, resuming and pushes (C); skill changes (D).

## Completion

- [ ] The board data and page show each provider's usage, threshold and verdict as the approved mockups' screens 1, 3 and 5, in a real run and in `--demo`
- [ ] Worker and reviewer threads carry their `providerInstanceId`; `🚦 … steering:` threads are no item's agent; tests cover both
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
