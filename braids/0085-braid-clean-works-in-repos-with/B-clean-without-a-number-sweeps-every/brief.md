---
id: '0085/B'
title: "clean without a number sweeps every finished item, and names each kept worktree"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0085/A']
order: 20
---

## Goal

`braid clean` without a number sweeps every finished item of the project (idea 2026-11-25-npvd), and nothing is skipped silently: every worktree of the repository that clean keeps gets one line saying why. The user then sees at once what stays and why.

Expected size: about 150 lines in 2-3 files, tests included.

## Start here

- `src/commands/clean.ts` (after 0085/A): `cleanCommand` loops over `loadLiveBraids(root)` without a number; find which finished braids that misses (a Done braid merged into `main` whose item branches, records or worktrees remain) and which worktrees clean never looks at.
- `src/braids/branches.ts` (`loadLiveBraids`, `loadKnownBraids`), `src/braids/reviews.ts` (the children records), `src/braids/worktree-folders.ts` (`agentsDirs`).
- Idea 2026-11-25-npvd (`braid inbox --no-fetch`): "`braid clean --yes` without a braid number cleans every braid's checkouts, including other coordinators' in the same repository".

## Change

- Without a number, clean covers every item of the project whose PR is merged, whichever braid it belongs to and wherever its brief lives, plus merged planning branches. Another coordinator's unfinished braid stays untouched (its braid branch, its running threads' checkouts), as today's `held` checks and "its braid is not Done" ensure; say in report.md how npvd's concern is met.
- After its removals, clean lists each remaining worktree of the repository (other than the main checkout) once, with why it stays: the item isn't finished, a thread runs in it, in use, has work (0085/A's reason), not a braid worktree (no record, not in a braid worktree folder), or the reason git gave. One line per worktree, never two; a dry run says the same.
- A short count at the end: removed, kept.

## Already decided

- Clean still removes only what a record or a braid's branch ties to a finished item; an unknown worktree is named, never removed.
- Tests use temp repos and faked GitHub and T3 (`Sources`), never real ones.

## Out of scope

- Opening requests for the user: 0085/C.

## Completion

- [ ] `braid clean` without a number cleans a finished braid's leftovers that it misses today, with a test
- [ ] It leaves another coordinator's unfinished braid and its running threads' checkouts alone, with a test
- [ ] Every worktree it keeps gets exactly one line with its reason, dry run and `--yes`, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
