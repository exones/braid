# 0024 report

**What changed:** `.agents/skills/braid/SKILL.md`, "Accept and hand over" step 1: a sub-bullet makes it one rule for every reviewer the coordinator launches (first review, re-check or fresh review task): call `link_pull_request` with the PR URL and `threadId` set to that reviewer's thread (for a delegated task, its child thread).

**Why:** reviewer threads were never linked to the PR they review, so T3 didn't settle them when the PR merged and they stayed open in the sidebar. The coordinator links them because the host tells agents to skip linking PRs they only review, and the reviewer runs on another provider.

**Validation:** searched `.agents/skills/`, `docs/` and `src/` for `link_pull_request` and `settle`: the only other mention is the worker linking its own PR, so no other doc says or implies reviewer threads stay unlinked. `npm run verify` passed.

**Open:** none.

For later items: none
Needs the user: none
