---
gate: <command that must pass before every PR, run from the repository root>
main: main
epics: epics/
ci: []
run: <optional: command that starts the app locally for manual or UI checks, and its URL if it serves one>
models:
  coordinator: <provider / model / options>
  worker: <provider / model / options>
  worker.spike: <optional override for spikes>
  reviewer: <provider / model / options; skill: <skill name> (optional)>
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- `ci`: the CI check names that must be green on a PR. Leave it empty to require every check.
- `run`: how agents start the app to try it or take screenshots. Leave it out if there is nothing to run.
- `models`: who runs each role, as `provider / model / options`, for example `cursor / claude-opus-5.5 / medium / non-fast`. `<role>.<kind>` (kind: story, task, spike) overrides the role for that kind of item. `skill:` names a skill the agent must use, for example a review skill.
- Setup: <how to install the toolchain and dependencies before the gate works>
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
