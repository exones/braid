# G: Drop `braid-coordinate`; this repository moves to `braid`

- Kind: task.
- Tier: L.
- UI: no.
- Expected size: one skill folder deleted, about 80 changed lines in about 12 files.
- Branch: `item/008-g-drop-coordinate` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

`braid` is the only coordinator skill, here and in other projects. This repository keeps its
items in Backlog.md like any target project, `epics/` becomes read-only history, and reinstalling
the skills removes the old `braid-coordinate` from the user's skill folders.

## Start here

- `.agents/skills/braid-coordinate/`: the folder to delete.
- `.agents/skills/braid/`: `SKILL.md` (setup rule), `assets/braid-md.md`, `assets/backlog-config.yml`,
  `references/workflow.md` (the new target of every workflow link).
- `BRAID.md`, `AGENTS.md` ("Hard limits" merge line, "Where to look"), `README.md` (lines 11, 54–79,
  171–175), `docs/decisions.md` (D28, D29, D30, log), `docs/roadmap.md` (lines 3, 15, 17),
  `epics/README.md`.
- `scripts/Install-Skills.ps1` and `test/pester/Install-Skills.Tests.ps1`.
- `epics/braid/008-braid-backlog/trial.md`.
- Find the rest with `git grep -n braid-coordinate -- ':!epics/braid/00[1-8]*' ':!epics/reports'`.

## Change

- Delete `.agents/skills/braid-coordinate/`.
- `BRAID.md`: the `braid` template's format. `backlog: backlog/` replaces `epics:`; add the
  Backlog.md invocation rule from the template. Keep the gate, CI, setup, test, run and models
  values as they are. The body line about epics 001–005 becomes: past epics are in `epics/`
  (read-only), those before 006 in tag `archive/process-v1`.
- Add `backlog/config.yml` from the skill's asset with `project_name: braid`. No `backlog init`,
  no Backlog.md block in `AGENTS.md`.
- `AGENTS.md`: "Where to look" routes goals and stories to `braid`; `braid-worker` stays as is;
  the workflow link points at `braid`'s. The merge hard limit says the user merges every item PR
  and everything into `main`; agents don't merge.
- README, `docs/roadmap.md`, `epics/README.md`: drop `braid-coordinate`, point workflow links at
  `braid`'s, and say `epics/` holds past records while new work lives in `backlog/`.
- `docs/decisions.md`: D28 and D29 lose the `braid-coordinate` and `epics` specifics (D29: `BRAID.md`
  has `backlog`). D30: `braid-coordinate` was dropped on 2026-11-12 at the user's request, before
  the trial; this repository uses `braid` and Backlog.md too. A dated log line.
- `scripts/Install-Skills.ps1`:
  - before copying anything, check every target for an unstamped folder of a skill being
    installed (today the check runs per target, so a clash in the third target fails after the
    first two were replaced);
  - after installing, remove braid skill folders in each target that carry the installer's stamp
    but are no longer in the ref (so an installed `braid-coordinate` goes). Never remove an
    unstamped folder.
- Pester tests for both installer changes, temp destinations only.
- `trial.md`: with the old coordinator removed by the installer, the trial uses the normal install
  from the epic branch. Drop the separate `CLAUDE_CONFIG_DIR` and the move-out fallback; undo is
  "reinstall from `main`". Keep the scenarios and the findings table.

## Already decided

- The user decided on 2026-11-12 to drop `braid-coordinate` now, not after the trial.
- Existing records in `epics/` stay as they are; nothing is converted into Backlog.md tasks.
- Epic 008 itself finishes under the old rules (its coordinator already has them).
- `braid-worker` keeps both brief forms (file and task ID); no skill text changes besides the
  deletion.

## Out of scope

- Changing the `braid` or `braid-worker` skills.
- `scripts/Test-CoordinatorRecordsGate.ps1` and other old tooling, unless the gate fails without a
  change.
- Creating Backlog.md tasks in this repository.

## Done when

- No file outside `epics/` history links to `braid-coordinate`, and the docs gate passes.
- `Install-Skills.ps1 -Target <temp>` over an earlier install that had `braid-coordinate` leaves
  `braid` and `braid-worker` only, and keeps unstamped folders; the tests prove it.
- `BRAID.md` follows the `braid` template and `backlog/config.yml` exists.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
pwsh -NoProfile -File scripts/Test-Pester.ps1
```
