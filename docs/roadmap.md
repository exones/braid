# Roadmap

Live status is in `braids/` (`braid list`, `braid board`); see the [workflow](../.agents/skills/braid/references/workflow.md).

The old manual-ledger CLI and its staged bootstrap plan were dismissed in TASK-4. The CLI now tracks braids and strands in `braids/` ([format](braids-format.md)) and serves the read-only [attention board](board.md); the next stories are the Outline braids 0008 to 0012 in `braids/` (the earlier plan is in `archive/backlog/docs/doc-5`).

## braid's own board

As [D01](decisions.md) says, built with the Backlog.md-based flow, and now done. braid has its own tracker and board, keeping what worked in Backlog.md: Markdown task files in Git that travel with branches and PRs, a CLI with plain output for agents, acceptance criteria, Definition of Done, final summaries, subtasks and cross-branch reads. It adds:

- goals shown with their subtasks nested;
- states derived from GitHub, T3 and labels, not stored in task files: built as the attention board's lanes To Do, Working, To Review, Needs You, Done (D32);
- actions: Start, Merge on request, Open thread.
