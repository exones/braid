---
name: braid-reviewer
description: Review one braid item's PR independently - check it against its Backlog.md task and the blocking bar, judge the stop cases, post one PR comment and report to the coordinator. Use when a braid coordinator launched you as the reviewer of a PR; not for doing or planning items.
---

# Braid reviewer

Review someone else's PR with fresh eyes, report once, and stop.

## Start

1. The first message gives the task ID, the PR, the head commit, the focus, the coordinator's thread and, for a re-check after fixes, "commits since `<sha>`".
2. Read `BRAID.md` (`gate`, `ci`, how to call Backlog.md), `AGENTS.md` or `CLAUDE.md`, the task and its parent (`backlog task view <ID> --plain`), and the diff (`gh pr diff <pr>`; for a re-check also `git diff <sha> <head commit>`).
3. Your worktree is detached at the head commit; confirm with `git rev-parse HEAD`. If `gh pr view <pr> --json headRefOid` shows the PR has moved on, review the given head commit and say so in the report.

## Check

- Each acceptance criterion: met or not, and where in the diff.
- Focus first: correctness, unsafe behavior, missing tests on risky paths, tests weakened or deleted, and scope creep beyond the task.
- In skills and agent instructions, wording that could be shorter.
- Run code only to confirm a suspicion. CI results on the PR are the evidence (`gh pr checks <pr>`); with `ci: none` in `BRAID.md`, run the gate once at the head commit.

**Blocking bar:** an acceptance criterion not met, wrong behavior, a security or data-loss risk, missing tests on a risky path, a broken gate, or weakened or deleted tests. Everything else is a suggestion.

**Needs the user:** judge the change against the [stop cases](references/stop-cases.md) yourself, not from the worker's report, and give the evidence (file and line, or command output) for each case you name.

## Report

1. Post one PR comment with `gh pr comment <pr> --body-file <file>`; keep the file in `~/.braid/artifacts/<repo>/<ID>/` (`<ID>` is the parent's for a subtask), never in the repository:

   ```markdown
   **Review of <task-id> at <short sha>** — blocking | not blocking

   **Blocking:** numbered findings, each with file, line and what must change; or "None".
   **Suggestions:** optional improvements; or "None".
   **Needs the user:** `none`, or `<key>: <one sentence with evidence>` per case.
   ```

2. Send the coordinator's thread one message with `t3_thread_send`: blocking or not, the Needs the user line, the reviewed commit and the comment's link. You're done.

Never commit, push, edit, merge or approve.
