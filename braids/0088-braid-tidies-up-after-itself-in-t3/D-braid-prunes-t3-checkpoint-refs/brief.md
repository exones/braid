---
id: '0088/D'
title: "braid prunes T3 checkpoint refs"
status: To Do
labels: ["kind:story", "tier:L", "ask:data"]
dependencies: []
order: 40
---

## Goal

`braid t3 prune-refs` removes the T3 checkpoint refs T3 never prunes, by 0083's rule, so `git for-each-ref` and T3's own `vcs.listRefs` stay fast (0083 part 5: 5,643 refs in agento; listings from up to 1.1 s to under 0.1 s after the PM's prune). Dry run by default; also a `braid clean` step.

Expected size: about 400 lines in 6 files.

## Start here

- `braids/0083-how-braid-can-read-t3-lightly/report.md`, part 5: what reads the refs and what a missing ref costs, how a ref name is made, the rule, the recipe and the groups it found.
- `~/.braid/artifacts/agento/0083/seg.mjs` (the segment, and `--verify` against every scope), `unmatched.mjs` (the read-only store select and the rule), `prune-refs.ps1` (the one `git update-ref --no-deref -z --stdin` transaction).
- `src/commands/clean.ts` (after 0085 is merged in) and `src/braids/gitio.ts`.
- `src/cli.ts` and `docs/cli.md`: how commands and their help are laid out.

## Change

- A command (name `braid t3 prune-refs` unless the CLI's layout suggests better; record the choice): lists the segments under `refs/t3/orchestration-v2/checkpoints/` of the repository's common dir, maps each to its thread through T3's scope table, and applies the rule. Dry run prints per group (archived, deleted, not live with parent not live; kept: live, parent live, unknown) segments and refs, and the segments to prune; `--apply` deletes their refs in one `update-ref --stdin` transaction; `--gc` (opt-in) runs `git gc` after.
- Liveness from T3's interface, never guessed: the live thread ids come from `--live <file>` (one id per line, written by an agent from `t3_thread_list {projectId, includeSubagents: true, statuses: [the 5 live]}`; the skill or docs give the call). Without a live list the command still lists, but `--apply` refuses. A segment whose scope isn't in the store, or whose thread can't be read, is kept.
- A `braid clean` step: with `--live <file>` it runs the prune as part of the clean (dry run unless `clean --yes`), otherwise it prints one line that refs can be pruned and how.
- Tests on a synthetic store (a SQLite file with the scope and thread tables' columns the select uses) and a scratch repository with refs made by the segment recipe.

## Already decided

- The rule, the segment and the read-only store access are in the goal's "Already decided"; the store path is T3's user data folder (`~/.t3/userdata/statev2.sqlite`; find how T3 locates it rather than hard-coding the user's).
- Never: live threads, children of live parents, `pre-rewind` refs (anything not under `…/<segment>/ordinal/`), refs outside `refs/t3/orchestration-v2/checkpoints/`. Multi-repo scopes (`repository:<path>`) are pruned in the repository they belong to only.
- Starts after 0085 is in `main` and `main` is merged into this braid branch.
- A data case: refs removed cost those threads' turn diffs and rewinds (0083 part 5). Dry run by default and the rule are the user's agreement; nothing else is removed.

## Out of scope

- T3 writes (archive, settle) and the store itself: read-only. Wiring to 0080's MCP client (a later item).
- Pruning in `C:\code\everix4` or the real agento repository during this strand: a user runs it.

## Failure modes and required tests

- A live thread or a child of a live parent pruned: tests for both, and for a waiting thread (live but with no live run, the gap 0083 found in the run index).
- A `pre-rewind` ref pruned: a test.
- A stale live list: the command says the list's age (file time) and refuses `--apply` past a short limit (state it).
- A half-applied transaction: `update-ref --stdin` is atomic; a test that a failed transaction leaves every ref.
- The store locked or missing, or its schema changed (a column renamed, as `compacted-at` was): the command lists nothing to prune and says why; a test.

## Completion

- [ ] Dry run on a scratch repository and a synthetic store lists, per group, exactly the segments 0083's rule marks safe; `--apply` removes their refs and only theirs; tests cover live, child of live parent, waiting, archived, deleted, `pre-rewind`, unknown scope and missing store
- [ ] `--apply` refuses without a live list or with a stale one
- [ ] The store is opened read-only only (a test or a read of the open call), and only `SELECT`s run
- [ ] `braid clean` offers the prune as a step, dry run unless `--yes`
- [ ] Read-only check on the real agento repository: the dry run's counts, compared with a fresh run of `unmatched.mjs --safe`, in report.md (no `--apply`)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (`docs/cli.md`, the help text), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
