# Epics

Record what was asked, done, proven, and left so work can resume without chat history. Structure is loosely based on `inspiration/`.

- [braid 001: seed](braid/001-seed/epic.md): first CLI, manual ledger, PowerShell verification, GitHub Actions, and packaged installation.
- [braid 002: trusted npm publishing](braid/002-trusted-publish/epic.md): GitHub Actions OIDC publish and the npm 12 install-script policy.
- [braid 003: worker skill](braid/003-worker-skill/epic.md): worker skill, assignment packets, resumable checkpoints, and worker-owned pull-request delivery.
- [braid 004: performance optimization](braid/004-performance-optimization/epic.md): shared versioned development toolchains and evidence-based setup and verification improvements.

Each epic has an `epic.md`, a `backlog/` of stories, tasks, and spikes, committed `assignments/`, `checkpoints/current.md`, `checkpoints/log.md`, `reports/`, and a `retro.md`. Who writes them is [Record ownership](../docs/agile-workflow.md#record-ownership). Item status has [one home](../docs/agile-workflow.md#one-home-for-status). Reports distinguish local checks from remote results. Keep binaries small and exclude secrets and scratch data.

The [coordinator skill](../.agents/skills/braid-coordinate/SKILL.md) analyzes goals, refines backlog items, and coordinates requested delivery. Item Done is the human merge into the declared epic branch. That is not the epic's pull request into main, and it is not a release.
