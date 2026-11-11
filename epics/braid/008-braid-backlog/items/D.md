# D: Install, route and record the decision

- Kind: task.
- Tier: L.
- UI: no.
- Expected size: about 60 lines in 5 files.
- Branch: `item/008-d-install-route` at `<short sha>`.
- PR into: `epic/008-braid-backlog`.
- Result to: thread `<coordinator thread id>`.

## Goal

The user can install `braid` like the other skills, a project knows how to set up Backlog.md for
it, and the repository records why braid's skills now keep items in Backlog.md.

## Start here

- `scripts/Install-Skills.ps1` lines 51–54: it only copies folders matching `braid-[a-z0-9-]+`, so a
  folder named `braid` is skipped today.
- `test/pester/` and the existing installer tests: where the installer's behavior is checked.
- `README.md`, section "Braid skills in other projects"; `AGENTS.md`, section "Where to look";
  `docs/decisions.md`.
- `../reports/A.md`: setup steps for a target project.

## Change

- `scripts/Install-Skills.ps1`: also install `.agents/skills/braid`; keep refusing other names.
- A Pester test (or the existing installer test) that `braid` and `braid-*` are installed and
  another folder name is not.
- `README.md`: the `braid` skill, the Backlog.md setup for a target project (pinned version,
  `config.yml`, `BRAID.md` facts), and that `braid-coordinate` remains until the user's trial.
- `AGENTS.md`, "Where to look": route goals and stories to `braid`.
- `docs/decisions.md`: D30, Backlog.md as the item store for the braid skills, with the reason and
  what it means for the CLI ledger (unchanged for now, roadmap revisited after the user's trial); a dated
  log line.

## Already decided

- `braid-coordinate` and `braid-worker` stay installed and documented.
- Target-project setup follows `../reports/A.md`: global `backlog.md@1.55.3`, copy the skill's
  `assets/backlog-config.yml` to `backlog/config.yml`, no Backlog.md block in `AGENTS.md`.
- D doesn't change `BRAID.md`: braid's own epics stay in `epics/`. (The coordinator already set
  this epic's models there.)

## Out of scope

- Adding Backlog.md to this repository.
- Roadmap rewrites beyond one line pointing at D30.

## Done when

- `Install-Skills.ps1 -Target <temp>` from this branch installs `braid`, `braid-coordinate` and
  `braid-worker`, and the test proves it.
- README, `AGENTS.md` and decisions say the same thing about which skill to use when.
- The `gate` command from `BRAID.md` passes and the PR checks are green.

## Check with

```powershell
npm run verify
pwsh -NoProfile -File scripts/Test-Pester.ps1
```
