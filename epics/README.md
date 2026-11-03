# Epics

Record what was asked, done, proven, and left so work can resume without chat history. Structure is loosely based on `inspiration/`.

- [braid 001: seed](braid/001-seed/epic.md): first CLI, manual progress, PowerShell verification, GitHub Actions, packaged installation.
- [braid 002: trusted npm publishing](braid/002-trusted-publish/epic.md): GitHub Actions OIDC publish and the npm 12 install-script policy. Planning only until execution is requested.

Each epic has an `epic.md`, a `backlog/` of stories/tasks/spikes, a resumable `checkpoints/current.md`, completion `reports/`, and a stage `retro.md`. Backlog items exist before work starts. Reports link actual evidence and distinguish local checks from remote results. Keep binaries small and exclude secrets and scratch data. Use the [Agile workflow](../docs/agile-workflow.md) for work division and Ready/Done criteria.

Until braid is adopted as the controller, the epic's prioritized backlog table owns work status. After adopting a released controller, machine state owns execution status and the epic references it. Avoid two independently maintained authorities. The [coordinator skill](../.agents/skills/braid-coordinate/SKILL.md) analyzes goals, refines this backlog, and coordinates requested delivery.

Backlog flow: `backlog`, `ready`, `in-progress`, `in-review`, `done`; also `blocked` and `cancelled` with reasons. A Done story is not a released milestone; release gates remain separate.
