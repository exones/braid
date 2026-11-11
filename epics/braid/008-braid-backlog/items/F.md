# F: Model per tier and a PR watch for the coordinator

- Kind: task.
- Tier: L.
- UI: no.
- Expected size: about 15 changed lines in 4 files.
- Branch: `item/008-f-tier-model-watch` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

Two small fixes to the coordinator skills found while running this epic. A project can give tier L
items a stronger worker model in `BRAID.md`, and a coordinator learns that a worker's CI finished
even when the worker, idle while it waits for CI, never reports.

## Start here

- `BRAID.md` in this repository: `models.worker.L` is the first tier key.
- `.agents/skills/braid/SKILL.md` "Project facts" and "Run an item" step 3, and
  `assets/braid-md.md` (the `models` line).
- `.agents/skills/braid-coordinate/SKILL.md` "Project facts" and "Run an item" step 3.

## Change

- Both coordinator skills: model lookup is `models.<role>.<tier>` (tier key `S`, `M` or `L`), then
  `models.<role>.<kind>`, then `models.<role>`.
- `braid/assets/braid-md.md`: document the tier key and its precedence in the `models` line.
- Both coordinator skills, "Run an item": once the worker's PR exists, the coordinator also calls
  `watch_pull_request` on it, because `t3_thread_wait` returns at once on an idle worker that is
  waiting for CI. On a wake, read `gh pr checks` and the worker's thread; if checks are green and
  no report came, take the result from the thread. Unwatch the PR before handing back to the user.
  In `braid-coordinate`, which has no `t3_thread_wait` step, add just the watch as a fallback to
  "wait for the worker's message".
- The same holds per subitem in an epic: one item PR watched at a time, unwatched once merged. The
  coordinator also watches the PRs it opens itself (a planning PR, the final epic PR into `main`)
  for checks and comments; a watch doesn't wake on a merge, so the user's "merged" or
  `gh pr list --state all` still decides that.

## Already decided

- User, 2026-11-11: keep workers and reviewers as top-level threads; tier L workers use Opus 5.5
  medium, others Sonnet 5.5 medium (already in this repository's `BRAID.md`).
- The tier key wins over the kind key; a spike of tier L uses `L`.
- The user asked for the `braid-coordinate` change too: it runs this repository until the trial.

## Out of scope

- `braid-worker`, the installer, README and decisions.
- Per-tier reviewer models (the key works for any role, but no new values).

## Done when

- A fresh coordinator reading either skill picks `worker.L` for a tier L story, `worker.spike` for
  a tier S spike, and `worker` for anything else when no other key matches.
- A coordinator whose worker is idle waiting for CI is woken by the PR watch, in both skills.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
```
