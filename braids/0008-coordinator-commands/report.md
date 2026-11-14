# 0008: Coordinator commands — report

**What changed.** Story 5, first cut: the coordinator's hand-run steps became `braid` commands, and the skills call them.

- 0008/A (PR #80): `braid status <n>` (per strand: stored status, lane, branch, PR, each `ci` check, T3 thread) and `braid next <n>` (the next ready strand by order and dependencies, or why none); numbers and letters ignore T3's checkpoint refs (they had made new strands come out as F and G).
- 0008/F (PR #81): an `ask:<key>` label is a flag only and no longer moves the lane; an open PR wins over a stored Done, so a strand shows To Review until its PR merges.
- 0008/B (PR #82): `braid start <id>` (branch from the braid tip, pushed, worktree in `$BRAID_WORKTREES_DIR` or `~/braid-worktrees`) and `braid clean` (removes merged items' worktrees and local branches only when their commits are in HEAD; dry run by default; inspired by wtw); D42.
- 0008/C (PR #83): the braid skill and workflow call status, next, start and clean; `ask:quality` after two blocking fix rounds; the `epic/**` CI trigger is gone; the gh-sharing test no longer depends on timing. Skills 6,274 to 6,158 words.
- 0008/G (PR #85): the final review's fixes (seam tests, D40, workflow, docs and help).

**Why.** The coordinator ran several git, gh and t3 commands per step; one command each is shorter, repeatable and testable.

**Validation.** `npm run verify` on the braid branch (110+ tests); every strand PR green on Windows and Ubuntu; independent reviews (blocking rounds on 0008/B's squash leftovers and 0008/C's skill wording, both fixed); this braid itself ran on `braid next`, `braid start` and `braid clean`, and T3 accepted a worktree in `~/braid-worktrees`.

**Open.** After the merge, reinstall the skills and `braid` from `main`.

For later items: braid 0014 (facts, recap, merge) starts with spike 0014/A, who marks an item Done (user, 2026-11-14); braid 0015 covers Needs You when the coordinator waits; 0009 has the open question of letting T3 create the worktree.

Needs the user: architecture (new CLI commands and board rules) and process (skills and CI), from the reviewers and plan labels; both planned with the user.