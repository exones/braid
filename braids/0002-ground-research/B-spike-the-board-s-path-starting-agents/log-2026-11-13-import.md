## 2026-11-13 12:37Z

Evidence (2026-11-13): `t3 --help`, `t3 thread start|send|show|list --help` (t3 v0.1.6); `t3 thread list --project C:\code\agento --json` (72 threads, 1.2 s; statuses running/completed/interrupted/cancelled) and `t3 thread show --json` (fields incl. branch, worktreePath, pendingRequestCount, ~0.95 s). Timings: `gh pr list --state all --limit 100` with statusCheckRollup 3.5 s (55 PRs), lean 0.9 s; open with checks 0.8 s; `git ls-remote` 0.5 s; GraphQL budget 5,000/h. Backlog.md v1.55.3 cloned into gitignored inspiration/: src/ui/board.ts buildColumnTasks, src/web/components/TaskDetailsModal.tsx; web Board/TaskColumn/TaskCard have no parent grouping.
Decision: proposed moving the read-only T3 source into goal 1 phase (b), since the t3 CLI makes it cheap; actions stay in goal 4.

Review fixes (PR #56): list and show fields split (branch, worktreePath, pendingRequestCount are show-only; branch can be null); join key via list pullRequests, then show worktreePath against git worktree list, branch as fallback; refresh re-costed (list 1.3 s for 73 threads, show ~1 s per running thread of an open item, 1.5-2.5 s parallel); --wait exit codes and seen statuses added; goal 1 size 5,500-8,400 with module rows; Failed split into Failed (red checks) and Stopped (interrupted/cancelled, no PR).

On 2026-11-13, at the user's request, the spike's output moved from docs/ into this report attached to the task, marked as research, not decisions; docs/ and the roadmap are unchanged by TASK-2. Report: doc-3 (was the "Proposed path" section of docs/roadmap.md).
