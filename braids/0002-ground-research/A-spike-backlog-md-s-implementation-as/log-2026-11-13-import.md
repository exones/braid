## 2026-11-13 12:37Z

Bun use is concentrated in tests: product code has 119 Bun.* calls in 23 files; tests have 922 more and 324 files on bun:test. Product total is 66,604 lines (web UI 15,800 TS/TSX + 375 CSS/HTML), tests 88,487.

Review (PR #54) fixes: the shown copy is chosen by selectTaskRecord (working copy first), not newest updated_date; the fork size is ~52k with the web UI kept, ~36k without; the last 100 upstream commits go back to 2026-10-11.

On 2026-11-13, at the user's request, the spike's output moved from docs/ into this report attached to the task, marked as research, not decisions; docs/ and the roadmap are unchanged by TASK-2. Report: doc-1 (was docs/backlog-md.md).
