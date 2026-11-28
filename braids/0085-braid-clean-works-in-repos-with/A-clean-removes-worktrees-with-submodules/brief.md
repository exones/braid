---
id: '0085/A'
title: "clean removes worktrees with submodules, safely"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
order: 10
---

## Goal

`braid clean --yes` removes a merged item's worktree that has checked-out submodules, safely: only after it proved that nothing would be lost. Today every removal in clean is a plain `git worktree remove`, which refuses such a worktree, and the line that says so is easy to miss. This covers every place clean removes a worktree: item worktrees, merged planning worktrees, recorded children's checkouts (reviewers, workers as T3 subagents) and old review checkouts.

Expected size: about 200 lines in 3 files, tests included.

## Start here

- `src/commands/clean.ts`: the four removal sites (`plans`, `reviewThreads`, the old review checkout, the item branch loop), each `git worktree remove` without `--force`, and the checks before them (`free`, `held`, merged into HEAD, `status --porcelain`).
- `test/start-clean.test.ts` and `test/reviews.test.ts`: how clean is tested today (temp repos, faked GitHub and T3 through `Sources`).
- `src/braids/gitio.ts` on `braid/0077-the-board-stays-fast-under-load` (`gitSync`): 0077 moves clean's git calls there; if 0077 is in `main` when you start, the braid branch has it merged (ask the coordinator if not) and you build on it.

## Change

- One function (in `clean.ts` or a small module beside it) that removes one worktree safely and returns either "removed" or the reason it kept it. Before removing, it checks, for the worktree and recursively for every initialised submodule in it:
  - no uncommitted change, staged change or untracked file (`git status --porcelain --ignore-submodules=none`, and the same inside each submodule);
  - no unpushed commit: the worktree's HEAD is in this checkout's HEAD (today's rule for item branches) or on a remote-tracking ref, and each submodule's HEAD is on one of the submodule's remote-tracking refs (`git rev-list HEAD --not --remotes` is empty);
  - a submodule that can't be read (broken `.git`, missing objects) counts as unsafe and keeps the worktree.
  Only then: `git worktree remove --force`, then `git worktree prune`. No `git submodule deinit`: it edits the shared `.git/config` and de-registers the submodule in the main checkout too (found by this item's test, logged). A worktree without submodules goes the same way.
- All four removal sites use it; their existing checks (held, running thread, in use, not a worktree of this repository) stay in front of it.
- The kept line names the reason precisely: which submodule, and whether it has changes or unpushed commits.

## Already decided

- Data loss is a stop case: no `--force` before the checks. Ignored files (build output) are not work: they go with the worktree, as with a worktree without submodules today.
- Stashes are shared by every worktree of a repository: removing a worktree loses none, so they are not checked.
- Tests build fixture repositories with submodules in temp folders (a superproject and one or two submodule repos, `file://` remotes, `-c protocol.file.allow=always`), never real ones; `C:\code\everix4` is read-only. The tests run in the gate, so CI runs them on Windows and Linux.
- `git submodule deinit` (and any forced removal) never runs against the main checkout and never touches another worktree's submodules: it runs only with the cwd set to the one worktree being removed, after that worktree's path was verified to be a linked worktree (not the main checkout, not the caller's checkout). Why: everix4's main checkout had its docs and data submodules emptied on disk (cause unknown); the user restored them. (The user via the PM, 2026-11-28.)

## Failure modes and required regression tests

- A merged worktree with a clean submodule is removed, its submodule data under `.git/worktrees/<name>/modules` with it.
- Kept, with a line naming the submodule: an uncommitted change in a submodule; an untracked file in a submodule; a commit in a submodule that is on no remote; a nested submodule (submodule inside a submodule) with a change.
- Kept: an uncommitted change in the worktree itself (as today).
- A failed `worktree remove` (clean runs no `deinit`) leaves a kept line, never a half-removed folder reported as removed; a second `braid clean --yes` finishes or names it again.
- A dry run (no `--yes`) changes nothing and says "would remove" for the submodule worktree.
- After `braid clean --yes` removes a linked worktree with submodules, the main checkout's submodules and a second, kept linked worktree's submodules are untouched: still initialised, their files on disk and `git submodule status` unchanged.

## Out of scope

- One line per kept worktree outside the items clean cleans, and the sweep without a number: 0085/B. Requests for the user: 0085/C.
- Sharing submodules between worktrees; disk-use display.

## Plan

1. New module `src/braids/remove-worktree.ts`: `worktreeUnsafe(root, path)` returns the reason to keep a worktree or null (its own status with `--ignore-submodules=none`, its HEAD in this checkout's HEAD or on a remote-tracking ref, then every gitlink from `git ls-files -s` whose folder has a `.git`, recursively: status, `rev-list HEAD --not --remotes`, unreadable counts as unsafe; the line names the submodule path). `notLinkedWorktree(root, path)` refuses the main checkout, the caller's checkout and anything not a linked worktree of this repository. `removeWorktree(root, path)` runs those checks, then `worktree remove --force` and `worktree prune` (no deinit, see the log), and reports "removed" only when the folder is gone. A test-only fault hook makes the removal fail.
2. `clean.ts`: the four sites (plans, reviewThreads, old review checkout, item loop) call `worktreeUnsafe` in their skip chain (so a dry run names the reason too) and `removeWorktree` under `--yes`, behind their existing checks.
3. Tests in `test/clean-submodules.test.ts` on fixture repos with one submodule that has a nested one (`file://`, `protocol.file.allow=always`): every case under "Failure modes"; update the old messages in `start-clean.test.ts`.
4. Docs: `docs/cli.md` clean section; decision record if one is needed.

## Completion

- [ ] `braid clean --yes` removes a merged item's worktree with checked-out submodules (fixture repo, test)
- [ ] It keeps, with a line naming the submodule and reason, every case under "Failure modes", each with a test
- [ ] Every removal site in clean uses the safe removal
- [ ] deinit and forced removal never touch the main checkout or another worktree's submodules, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
