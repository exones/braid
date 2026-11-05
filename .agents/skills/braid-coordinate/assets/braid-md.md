---
gate: <command that must pass before every PR, run from the repository root>
main: main
epics: epics/
ci: []
run: <optional: command that starts the app locally for manual or UI checks, and its URL if it serves one>
coordinator_model: <provider / model / options>
worker_model: <provider / model / options>
reviewer_model: <provider / model / options>
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- `ci`: the CI check names that must be green on a PR. Leave it empty to require every check.
- `run`: how agents start the app to try it or take screenshots. Leave it out if there is nothing to run.
- Setup: <how to install the toolchain and dependencies before the gate works>
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
