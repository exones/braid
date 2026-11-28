# 0074/H report

**What changed:**

- A paused braid whose card sits in Needs You (a failed or partial pause keeps its record) has the same ▶ Resume now as in To Do and Working. The rule is `resumeOnCard` in `src/board/pause.ts`, used by `web/src/App.tsx`; tooltip, confirm dialog and thread access are unchanged.
- Each steerer tick first clears the board record of a braid that is Done as the board reads it (a merged PR included), with no send and no push, before the count, resume and pause steps, so it is in no PM's resume message. As with every other write, only the board acting for the provider does it. Holds and coordinator or PM pauses are left alone.

**Why:** the PM's live check of #339 found both.

**Validation:** two new tests in `test/board-steer.test.ts`: a failed pause's card is in Needs You and carries ▶ (checked through the card model and `resumeOnCard`; the page has no render tests, and no browser check was made); a braid that turns Done during a pause loses its record with no send and the PM is asked for the other braid only. Local `npm run verify` (2026-11-26): 728 of 729 pass; the one failure is the requests lock test in `test/requests.test.ts` (known flake, fixed on main by #335). CI on the PR is the gate evidence.

**Docs:** `docs/board.md` (▶ in Needs You, a Done braid leaves no pause, the "Ask the coordinator to resume" tooltip). No others affected.

**Open:**

- `braid resume --limit --all` run between a braid turning Done and the board's next refresh would still list it: the CLI doesn't read the board's snapshot.

For later items: a paused braid whose card sits in To Review has no ▶ either (not in this brief).
Needs the user: none.
