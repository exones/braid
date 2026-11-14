# 0007: Skills on braid, with the import — report

**What changed.** The braid skills (coordinator, worker, reviewer) keep items in `braids/` through the `braid` CLI instead of Backlog.md; this is the end of the MVP (stories 1 to 4).

- 0007/A (PR #72): `braid import-backlog [--dry-run]`, a lasting command that turns a project's `backlog/` into `braids/`.
- 0007/B (PR #73): `scripts/Install-Skills.ps1` also builds and installs the matching `braid` CLI from the same ref (`-SkipCli` skips it).
- 0007/C (PR #74): the skills on `braids/` (direct edits plus `braid check`; `braid new`, `strand new`, `edit`, `log`, `report`, `view`), branches `braid/<n>-<slug>` and `braid/<n>/<letter>-<slug>`; added the Outline step, the report rule, the converge loop, decided means documented, side ideas get a home, the CI-tick rule, worktree removal after the worker's session ends; D33 replaces D30.
- 0007/D (PR #75): this repository switched: braids 0001 to 0007 imported, Outline braids 0008 to 0012 for stories 5 to 9, D34 to D41 from the plan, `backlog/` moved to `archive/backlog/`.
- 0007/E (PR #77): the trial. Braid 0013 (PR #76, `braid view` shows strand dependencies) ran from plan to merge on the new skills and `braid`, installed from the braid branch. Fixes: `--dep none` and `--labels none` clear a list, log and report text goes through `--file -` (the Windows `braid.cmd` shim splits quoted phrases and drops empty arguments), and the coordinator starts a worker idle, then sends a first message with the worker's own thread id.

**Why.** Story 4 of the plan (`archive/backlog/docs/doc-5 - New-braid-implementation-plan-draft.md`): one store, braid's own, for this repository and every project on the skills.

**Validation.** `npm run verify` on the braid branch (85 tests); every strand PR green on Windows and Ubuntu; the installer ran for real from the braid branch; an independent review of the final PR found nothing blocking.

**Open.** The `epic/**` CI trigger and its README line can go (planned in 0008). After the merge into `main`, reinstall the skills and `braid` from `main`. T3 exposing a thread's id to its agent would make the worker thread-id step simpler.

For later items: next is 0008 (coordinator commands) before 0003 (skills diet), as recommended to the user; 0003's brief now points at `assets/brief.md`.

Needs the user: process, architecture, data (reviewer, plan labels): the skills, `AGENTS.md`, `BRAID.md` and CI triggers change; a new public command and a global CLI install; `backlog/` moved to `archive/backlog/`. All were decided with the user in the plan.