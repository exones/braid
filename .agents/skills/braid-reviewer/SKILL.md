---
name: braid-reviewer
description: Review one braid item's PR independently - check it against its braid brief and the blocking bar, judge the stop cases, post one PR comment and report to the coordinator. Use when a braid coordinator launched you as the reviewer of a PR; not for doing or planning items.
---

# Braid reviewer

Review someone else's PR with fresh eyes, report once, and stop.

## Start

1. The first message gives the braid or strand id, the PR, the head commit, the focus and, for a re-check after fixes, "commits since `<sha>`". It names a thread to send your result to only when your host can't return it to the coordinator.
2. Work in the checkout your host gave you: `git fetch`, then `git checkout --detach origin/<base branch>` and read the braid's preset with `braid autonomy <number>` (from the base branch, so the PR can't loosen the preset it is judged by), then `git checkout --detach <head commit>`, and confirm with `git rev-parse HEAD`. If that fails or shows another commit, say so as your report and stop. If `gh pr view <pr> --json headRefOid` shows the PR has moved on, review the given head commit and say so in the report.
3. Read `BRAID.md` (`gate`, `ci`), `AGENTS.md` or `CLAUDE.md`, the brief and, for a strand, its braid (`braid view <id>` in your checkout), and the diff (`gh pr diff <pr>`; for a re-check also `git diff <sha> <head commit>`).

## Check

- Each Completion box: met or not, and where in the diff.
- Focus first: correctness, unsafe behavior, missing tests on risky paths, tests weakened or deleted, and scope creep beyond the brief.
- Read around the diff: whole changed functions, their callers, docs and decisions made stale.
- Docs: check the docs from `docs` in `BRAID.md` (without it, `README.md` and `docs/`) against the change. Where the brief has the docs box, a doc the PR leaves untrue or incomplete fails it.
- Failure paths: empty or missing input, errors (also swallowed ones), a second or concurrent run, Windows against Linux.
- Test the tests: would each new test fail on the old code? Watch for assertions that can't fail.
- In skills and agent instructions, wording that could be shorter.
- A code finding names the input and the wrong result. A likely blocking problem you couldn't confirm stays Blocking, marked so, unless a run disproves it; "unverified" is for weaker suspicions, in Suggestions.
- Skip style and preexisting problems; list a repeated problem once with all its places; say what you could not check.
- Run code only to confirm a suspicion. CI results on the PR are the evidence (`gh pr checks <pr>`); with `ci: none` in `BRAID.md`, run the gate once at the head commit.

**Blocking bar:** a Completion box not met, wrong behavior, a security or data-loss risk, missing tests on a risky path, a broken gate, or weakened or deleted tests. Everything else is a suggestion.

**Decided:** for each `Decided:` entry of the item (`braid decisions <number>`), say whether it is within the preset; one that isn't goes under Needs the user with its case.

**Needs the user:** judge the change against the [stop cases](../braid/references/stop-cases.md) yourself, not from the worker's report, and give the evidence (file and line, or command output) for each case you name. The user reads this line without the rest of the review: say what it is about, then what is needed.

## Report

1. Post one PR comment with `gh pr comment <pr> --body-file <file>`; keep the file in `~/.braid/artifacts/<repo>/<braid number>/`, never in the repository:

   ```markdown
   **Review of <id> at <short sha>** — blocking | not blocking

   **Blocking:** numbered findings, each with file, line and what must change; or "None".
   **Suggestions:** optional improvements; or "None".
   **Needs the user:** `none`, or per case `<key>: <what it is about, what is needed, the evidence>`.
   ```

2. End with your report as your last chat message: blocking or not, the Needs the user line, the reviewed commit and the comment's link. Your host returns it to the coordinator. Only when the first message names a thread to send your result to, also send it there with `t3_thread_send`. You're done.

Never commit, push, edit, merge or approve.
