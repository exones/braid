---
gate: <command that must pass before every PR, run from the repository root>
main: main
epics: epics/
ci: []
shell: "<optional: shell the agents' commands run in, for example pwsh 7>"
setup: "<optional: run first in a new worktree, for example npm ci>"
test: "<optional: focused test command, for example npx vitest run <file>>"
run: <optional: command that starts the app locally for manual or UI checks, and its URL if it serves one>
models:
  coordinator: <provider / model / options>
  worker: <provider / model / options>
  worker.spike: <optional override for spikes>
  reviewer: <provider / model / options; skill: <skill name> (optional)>
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- `ci`: check names that must be green on a PR. `[]` means every reported check; `none` means the project has no hosted CI, and the gate run before the PR is the evidence.
- `run`: how agents start the app to try it or take screenshots. Leave it out if there is nothing to run.
- `models`: `provider / model-id / key=value, …`, with the exact IDs and option names the host lists (in T3: `orchestrator_capabilities`), for example `cursor / claude-sonnet-4-6 / effort=medium`. Options left out mean host defaults. `<role>.<kind>` (kind: story, task, spike) overrides the role for that kind of item. `skill:` names a skill the agent must use, for example a review skill.
- Real user data: <where the app keeps it, for example `%LOCALAPPDATA%\<app>`>. Agents never touch it; a brief may allow a read-only look.
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
