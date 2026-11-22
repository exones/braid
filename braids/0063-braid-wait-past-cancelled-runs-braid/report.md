# 0063 report

## What changed

- `braid wait` (`src/commands/wait.ts`): each `ci` check is now answered by the newest commit, from the branch tip down to the CI commit, that has a run for it. A `CANCELLED` run on a commit with a newer commit above it stays pending while that commit may still start a run, then (or with nothing newer) fails as before. The output names the answering commit(s), next to the existing `tip … CI runs on …` line.
- `braid clean` (`src/commands/clean.ts`): a recorded reviewer's `t3/…` branch is force-deleted (`git branch -D`) when its tip is the merged PR's head (`card.pr.head`) or is on an `origin/*` remote-tracking ref (`git branch -r --contains`). Otherwise `git branch -d` runs as before and keeps a branch with commits found nowhere else.
- Help line (`src/cli.ts`), header comments, `docs/cli.md` (wait, clean) and a dated note on D71 in `docs/decisions.md`.

## Decisions

- **Window for a cancelled run with a newer commit and no run yet: 5 minutes from the start of the call** (the existing `START_MS` start limit, so one constant). After it the cancelled run counts as failed (exit 1); a shorter `--timeout` ends as 3.
- When a newer commit has a run, it answers even if the CI commit's run passed (newest wins), so a failing run on a `braids/`-only commit fails the wait.

## Validation

`npm run verify` passes (470 tests). New tests: wait with cancelled CI-commit run and green / failing run above, cancelled with nothing newer (exit 1), cancelled with newer commit without a run (exit 3 at a short timeout; a late run answers; never-starting run fails after 5 minutes); clean with a branch tip on origin, one at the PR head (both removed) and one with its own commit (kept).

## Exit 126

No path in this repository's CLI exits 126: `dist/cli.js` exits 2 for every `wait` error and usage error (checked `wait 1` and `title 0063` outside a braid checkout, exits 2 and 1). The installed `braid` on this machine exits 126 for both, including `wait`'s own exit-2 errors, so the 126 comes from the installed launcher, not from `src/`. A wait failure itself is exit 1. Not changed (out of scope); worth a look at how `braid` is installed.

## Docs

Updated `docs/cli.md`, `docs/braids-format.md` (wait, clean), `docs/decisions.md` (notes on D71 and D42), the `wait` and `clean` help lines. Others unaffected.

A commit whose check runs GitHub could not be read keeps the answer pending (what is found below it is not final); an empty answer still falls through to the older commit.

For later items: the installed `braid` launcher mapping errors to 126 (see above).

Needs the user: none
