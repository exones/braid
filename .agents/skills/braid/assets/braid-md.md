---
gate: <command that must pass before every PR, run from the repository root>
main: main
ci: []
auto: "<optional: allowed>"
shell: "pwsh 7 or bash; <optional: other shell facts>"
setup: "<optional: run first in a new worktree, for example npm ci>"
test: "<optional: focused test command, for example npx vitest run <file>>"
run: <optional: command that starts the app locally for manual or UI checks, and its URL if it serves one>
models:
  coordinator: <provider / model / options>
  worker:
    story: <provider / model / options>
    task: <provider / model / options>
    spike: <provider / model / options>
    L: <provider / model / options; optional tier key, also S: or M:; wins over the kind keys>
  reviewer: <provider / model / options>; skill braid-reviewer
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- Items are braids in `braids/`, kept with the `braid` CLI that the braid skills' installer installs. Edit briefs and reports directly, then run `braid check`. `.gitignore` holds `braids/**/temp/`.
- `ci`: check names that must be green on a PR. `[]` means every reported check; `none` means the project has no hosted CI, and the gate run before the PR is the evidence.
- `auto: allowed`: the user may switch on auto mode for a goal, where the coordinator merges its strand PRs into the braid branch itself; absent means not allowed. Never with `ci: none`.
- `run`: how agents start the app to try it or take screenshots. Leave it out if there is nothing to run.
- `models`: `provider / model-id / key=value, ...`, with the exact IDs and option names the host lists (in T3: `orchestrator_capabilities`). Options left out mean host defaults. `<role>.<tier>` (tier: S, M, L) is the model for items of that tier, `<role>.<kind>` (kind: story, task, spike) for that kind of item, and a plain `<role>` for every item; the tier key wins over the kind key, so a tier L spike uses `L`. `skill <name>` after the options names a skill the agent must use.
- Real user data: <where the app keeps it>. Agents never touch it; a brief may allow a read-only look.
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
