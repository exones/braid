# Roadmap

Live status is in the Backlog.md tasks under `backlog/`; see the [workflow](../.agents/skills/braid/references/workflow.md).

The old manual-ledger CLI and its staged bootstrap plan were dismissed in TASK-4. The CLI is now a minimal skeleton (`braid --version`, `braid help`) that the next story builds on.

## braid's own board

As [D01](decisions.md) says, built with the Backlog.md-based flow. braid gets its own task tracker and board, keeping what works in Backlog.md: Markdown task files in Git that travel with branches and PRs, a CLI with plain output for agents, acceptance criteria, Definition of Done, final summaries, subtasks and cross-branch reads. It adds:

- goals shown with their subtasks nested;
- states derived from GitHub, T3 and labels, not stored in task files: Running, In Review, Waiting for you (with the stop case), Done;
- actions: Start, Merge on request, Open thread.

Backlog.md stays the store until braid reads the same files, so existing tasks need no conversion.
