# Sources for 0060

From the research and tests in the thread "Subagents for Project Workflows", 2026-11-21.

- S1 docs/decisions.md D69, D71, D77 and the 2026-11-19 log entry — repo · version: main bc379957 · accessed 2026-11-21 · read: part (those entries) · says: workers stayed top-level because a subagent couldn't watch its PR and everything would pass through the coordinator; background waits were dropped · adopted.
- S2 src/board/t3.ts, src/braids/reviews.ts — repo · version: bc379957 · accessed 2026-11-21 · read: whole / part · says: the board finds workers by worktree path or title, reviewers by `.braid/reviews.json` and `t3 thread show` · adopted.
- S3 .agents/skills/braid-worker/SKILL.md — repo · version: bc379957 · accessed 2026-11-21 · read: part · says: a worker has several turns (converge loop, growth, review fix rounds) · adopted.
- S4 T3 MCP schemas `delegate_task`, `t3_thread_send`, `t3_background_wait` · version: none shown (t3 CLI v0.1.6) · accessed 2026-11-21 · read: whole · says: isolation `shared` or `worktree`; a send to a finished child starts a new task; background wait is Claude only · adopted.
- S5 Research note of braid 0040 on background wakes (coordinator memory) · version: 2026-11-20 · accessed 2026-11-21 · read: whole · says: a background Bash wake raced T3's query close and killed the session (1 of 6 worked) · adopted, agrees with D77.
- S6 `t3 thread --help`, `t3 thread list --help` · version: t3 v0.1.6 · accessed 2026-11-21 · read: whole · says: list, start, send, show; no option for children · adopted.
- S7 Runs, 2026-11-21, Windows 11, T3 v0.1.6, Claude_Everix child on claude-haiku-5-5:
  - `t3 thread list --project C:\code\agento --json`: 319 threads, `relationshipToParent` null on all.
  - A child was told a secret word and finished; `t3_thread_send` to it started run 2, which answered the word; run 3, sent without waiting, woke the parent with its result; the user typed "Hey" in the child's thread in the T3 UI, run 4 answered and woke the parent.
  - `t3 thread show thread:delegated-task:…braid-0049-final-review-2 --json`: completed, subagent, worktree `c:\worktrees\agento\t3-82526e9d`, link present (a day after it finished).
  - `gh run list --limit 40`: run time min 17 s, median 458 s, max 566 s.
