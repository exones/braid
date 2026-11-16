---
name: braid-reviewer
description: Review one braid item's PR independently - check it against its braid brief and the blocking bar, judge the stop cases, post one PR comment and report to the coordinator. Use when a braid coordinator launched you as the reviewer of a PR; not for doing or planning items.
---

# Braid reviewer

Review someone else's PR with fresh eyes, report once, and stop.

## Start

1. The first message gives the braid or strand id, the PR, the head commit, the focus, the coordinator's thread and, for a re-check after fixes, "commits since `<sha>`".
2. Read `BRAID.md` (`gate`, `ci`), `AGENTS.md` or `CLAUDE.md`, the brief and, for a strand, its braid (`braid view <id>` in your worktree), and the diff (`gh pr diff <pr>`; for a re-check also `git diff <sha> <head commit>`).
3. Your worktree, from `braid start <id> --review`, is detached at the head commit; confirm with `git rev-parse HEAD`. If `gh pr view <pr> --json headRefOid` shows the PR has moved on, review the given head commit and say so in the report.

## Check

- Each acceptance criterion: met or not, and where in the diff.
- Focus first: correctness, unsafe behavior, missing tests on risky paths, tests weakened or deleted, and scope creep beyond the brief.
- Failure paths: empty or missing input, errors, a second or concurrent run, Windows against Linux.
- Test the tests: would each new test fail on the old code? Watch for assertions that can't fail and risky paths left untested.
- What the diff left out: callers of a changed interface, docs and decisions made stale.
- In skills and agent instructions, wording that could be shorter.
- Report findings you are about 90% sure of, each with the input and the wrong result; mark a weaker suspicion "unverified" in Suggestions, or run it to settle it. Skip style and preexisting problems; list a repeated problem once with all its places.
- Run code only to confirm a suspicion. CI results on the PR are the evidence (`gh pr checks <pr>`); with `ci: none` in `BRAID.md`, run the gate once at the head commit.

**Blocking bar:** an acceptance criterion not met, wrong behavior, a security or data-loss risk, missing tests on a risky path, a broken gate, or weakened or deleted tests. Everything else is a suggestion.

**Needs the user:** judge the change against the [stop cases](../braid/references/stop-cases.md) yourself, not from the worker's report, and give the evidence (file and line, or command output) for each case you name. The user reads this line without the rest of the review: say what it is about, then what is needed.

## Report

1. Post one PR comment with `gh pr comment <pr> --body-file <file>`; keep the file in `~/.braid/artifacts/<repo>/<braid number>/`, never in the repository:

   ```markdown
   **Review of <id> at <short sha>** — blocking | not blocking

   **Blocking:** numbered findings, each with file, line and what must change; or "None".
   **Suggestions:** optional improvements; or "None".
   **Needs the user:** `none`, or per case `<key>: <what it is about, what is needed, the evidence>`.
   ```

2. Send the coordinator's thread one message with `t3_thread_send`: blocking or not, the Needs the user line, the reviewed commit and the comment's link. You're done.

Never commit, push, edit, merge or approve.
