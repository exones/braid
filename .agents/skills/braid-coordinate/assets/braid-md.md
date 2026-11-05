---
gate: <command that must pass before every PR, run from the repository root>
main: main
epics: epics/
ci: []
coordinator_model: <provider / model / options>
worker_model: <provider / model / options>
reviewer_model: <provider / model / options>
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- `ci`: the CI check names that must be green on a PR. Leave it empty to require every check.
- Setup: <how to install the toolchain and dependencies before the gate works>
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
