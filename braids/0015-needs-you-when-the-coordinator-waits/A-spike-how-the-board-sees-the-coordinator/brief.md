---
id: '0015/A'
title: "Spike: how the board sees the coordinator"
status: Done
labels: ["kind:spike", "tier:M"]
dependencies: []
order: 10
---

## Goal

Answer, for the user's decision: how should the board (1) tell the coordinator's T3 thread from a worker's, and (2) know that the coordinator is waiting for the user, so its braid shows in Needs You with a reason? Preferably from T3's thread state, not a label to remember. Time box: about 2 hours. The answer feeds the build strands of 0015.

Expected size: a report.md of about 150 lines; no product code.

## Start here

- `docs/board.md`: lanes, rules, and "Where the states come from" (how a thread joins an item: linked PR, a single PR, worktree path, branch).
- `src/board/t3.ts`: how threads are read and matched; `src/board/model.ts` (`derive`).
- `src/commands/done.ts`: the caller skip from 0014/F.
- `.agents/skills/braid/SKILL.md`: how the coordinator launches workers and where it stops for the user ("Talking to the user", "Accept and hand over", stop cases).
- `t3 thread list --project <main checkout> --json`, `t3 thread show <id> --json`, `t3 --help` (T3 v0.1.6 here).

## Change

- `report.md` only: the question, the options with evidence, a recommendation, and proposed build strands (title, tier, acceptance). Probes may run against the live T3 but change nothing.
- Scope addition (user, 2026-11-15, up to about 1 more hour): also weigh other ways the coordinator could show it waits for the user: harness hooks (Claude Code Stop/Notification, Codex and Cursor equivalents), a small state file the board reads, GitHub signals (PR label, draft, review request), T3 inbox or notification state and its MCP tools, and how other orchestrators and human-in-the-loop tools mark "waiting for a human". For each: reliability (does it depend on remembering?), whether it works across Claude, Codex and Cursor, and build cost; fold them into the same comparison and recommendation.

## Already decided

Facts the coordinator found on 2026-11-15; check, don't re-derive:

- `t3 thread show --json` gives, per thread: `status` (`running`, `completed`, `interrupted`, `cancelled`), `activeRunId`, `pendingRequestCount`, `settled`/`settledAt`, `snoozed`, `createdBy`, `creationSource`, `parentThreadId`, `relationshipToParent`, `linkedPullRequest`, `pullRequests`, `branch`, `worktreePath`.
- Workers and reviewers launched with `t3_thread_launch` show `createdBy: agent`, `creationSource: mcp` and no `parentThreadId`, the same as the coordinator. `t3_thread_launch` takes a `delegatedFrom` (environment, thread id, title) that may set the parent.
- When the coordinator's turn ends (it waits for the user), its thread status becomes `completed`; `settled` is false until the user settles it or a linked PR merges. Unwatching a PR "returns the thread to the user's inbox".
- A question asked with the host's question tool shows as `pendingRequestCount > 0`, as for workers today.

Options to weigh, alone or combined:

- Mark workers as children: launch with `delegatedFrom`, so a thread with children, or with none and no parent, is a coordinator.
- Read the waiting coordinator as `completed` and not `settled` (T3's inbox), joined to its braid by its worktree or its linked PR.
- The coordinator asks with the question tool for every stop, so `pendingRequestCount` covers it; questions in plain chat don't count.
- A `stop:<key>` label set and removed by the coordinator (works everywhere, depends on remembering).
- The PR side: a recap that asks for a merge already shows To Review; maybe only non-merge stops need this.

## Out of scope

- Building any of it, and editing docs, skills or decisions: the report proposes, the user decides.

## Acceptance

- [x] report.md answers both questions with evidence from the live T3 (commands and the fields they returned)
- [x] It recommends one approach and says what it needs from the skills and from T3
- [x] It proposes the build strands with tier and acceptance

## Definition of done

- [x] report.md written: the answer, evidence, recommendation and proposed follow-ups

## Plan

1. Read the coordinator thread and the project thread list from the live T3 (CLI and MCP), and record the fields that tell coordinator, worker, reviewer and subagent apart.
2. Probe `delegatedFrom` with an idle test thread of my own (no message, no worktree), then archive it.
3. Check the waiting signals against what the coordinator does now (waiting on a worker, on CI, on the user) and against the board code (`readT3`, `derive`, `toCard`).
4. Scope addition: weigh hooks, a state file, GitHub signals, T3 inbox and MCP state, and other orchestrators, for reliability, provider coverage and cost.
5. Write report.md: answers, evidence, one recommendation with what it needs from skills and T3, proposed strands.
