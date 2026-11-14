---
id: doc-3
title: 'TASK-2.2 report: the board''s path'
type: other
created_date: '2026-11-13T15:19:00Z'
---

# The board's path: starting agents, derived states, the first version

> Research report for TASK-2.2, 2026-11-13. Findings and recommendations, not decisions: nothing here is decided until the user says so. The user's decisions: [TASK-2 report](doc-4%20-%20TASK-2-report-research-results-and-the-users-decisions.md).

Built on [Backlog.md as braid's reference](doc-1%20-%20TASK-2.1-report-Backlog.md-as-braids-reference.md) and [the new braid CLI](doc-2%20-%20TASK-2.3-report-how-the-braid-CLI-could-be-built.md): a fresh Node tracker that reads Backlog.md's files, React board served on 127.0.0.1, `backlog` stays the writer at first.

**Starting agents.** T3 Code ships a `t3` CLI (v0.1.6 here, `~/.t3/bin/t3.cmd`) that talks to the running T3 server: `t3 thread start <project> <message|-> --worktree <base> --branch <item branch> --provider <id> --model <slug> --title … --json` starts a thread in a new worktree and prints its id; `t3 thread send <thread> <message|->` queues a message for an existing thread (a busy thread gets it as its next turn); with `--wait`, `start` and `send` wait for the agent and exit 0 on its reply, 1 if the run fails and 2 if it waits for an answer. `t3 thread list --project <path> --json` gives per thread `status` (seen: `running`, `completed`, `interrupted`, `cancelled`), `title`, `link` (opens the thread), `linkedPullRequest` and `pullRequests`; only `t3 thread show <thread> --json` adds `thread.branch`, `thread.worktreePath`, `thread.pendingRequestCount` and `activeRunId`. `branch` can be null (this worker's own thread: branch null, worktreePath set). So the board's Start, Open thread and messages need no T3 internals. Limits: it needs the T3 desktop app or service running; `start` has no flag for reasoning effort or other options (BRAID.md's `effort=`), so those come from the project's defaults until T3 adds one; each call costs about 1 s (an Electron process start). Fallback without T3: `claude -p` or `codex exec` in a worktree braid creates. That loses the visible thread the user can read and answer, T3's MCP tools the skills use (thread messages, PR links and watches), and live state; braid would have to keep the session id and log itself.

**Derived states.** Stored statuses stay To Do, In Progress, Done; the lanes are computed at read time from the task, its `item/<id>-*` branch and PR, and its T3 thread. Measured on this repository (55 PRs, 73 threads).

Joining a thread to a task: (1) the thread's `pullRequests` from `list` give the PR, whose head branch `item/<id>-*` names the task; this covers a thread once it has linked a PR (35 of 73 here). (2) Before that, `show`'s `worktreePath` matched against `git worktree list --porcelain` gives the worktree's branch, which names the task; a worktree path never changes, so it is cached per thread id after one `show`. (3) `branch` from `show` is a fallback when set. Later, threads braid starts itself are recorded in `runs/` with their task (goal 5), and no join is needed.

| State | Rule | Source | Reliability | Cost per refresh |
