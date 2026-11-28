## 2026-11-28 00:31Z checkpoint

done: src/braids/remove-worktree.ts (worktreeUnsafe: worktree and recursive submodule status/unpushed checks, unreadable = unsafe; removeWorktree: deinit --all --force, worktree remove --force, prune, removed only when the folder is gone; test fault hook failRemovalForTest); all four removal sites in clean.ts use it, and dry runs name the keep reason; builds. next: run test/start-clean.test.ts and test/reviews.test.ts (the run was stopped by the hold, results unknown; old messages "its worktree has changes" / "worktree not removed" changed, update those tests), write test/clean-submodules.test.ts with fixture repos for every failure mode, docs/cli.md clean section, report.md, gate, PR into braid/0085-braid-clean-works-in-repos-with. open: none.

## 2026-11-28 10:12Z

Resumed after the hold. Added the user's binding addition (via the PM) to the brief: deinit and forced removal only in the one verified linked worktree, never the main checkout or another worktree's submodules; regression test and Completion box. `notLinkedWorktree` guards `removeWorktree`.

Merged origin/braid/0085-braid-clean-works-in-repos-with (0077 in main): clean.ts conflict was only the import (spawnSync -> gitSync); remove-worktree.ts uses gitSync too.

Finding: the regression test failed with deinit in place. `git submodule deinit --all --force` run inside a linked worktree removes `submodule.<name>.*` from the shared .git/config, so the main checkout's `git submodule status` turned `-` (uninitialised) although its files stayed. That is the damage class seen in everix4's main checkout.

Decided (data, the safer side; reported to the coordinator): clean runs no deinit at all. `git worktree remove --force` after the checks removes a worktree with submodules and their git dirs under .git/worktrees/<name>/modules. The brief's Change and Failure modes are adjusted; D121 records it.

Tests consolidated into one fixture with subtests: the machine is heavily loaded (one fixture test took 9 min), each fixture costs many git runs.

## 2026-11-28 12:01Z checkpoint

done: safe removal (no deinit, linked-worktree guard, recursive submodule checks) in all four clean sites; braid branch merged (with 0077, at c9140b9d); test/clean-submodules.test.ts passes (12/12, one fixture); start-clean messages updated; docs/cli.md and D121 updated; brief has the binding addition. next: run the gate once (stopped by the restart hold, result unknown; start-clean.test.ts and reviews.test.ts not yet run on the new code), fix what fails, tick boxes, write report.md, push, PR into braid/0085-braid-clean-works-in-repos-with. open: none.
