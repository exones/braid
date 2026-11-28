---
id: '0088/E'
title: "Leftover threads: unsettled finished ones, orphaned subagents"
status: To Do
labels: ["kind:story", "tier:M", "ask:data"]
dependencies: ['0088/D']
order: 50
---

## Goal

Threads braid left behind are found and handed to an agent to settle or archive: finished braid threads T3 still lists as unsettled, and settled subagents whose parent is deleted (806 settled subagents were still active on 2026-11-28, 570 of them with a deleted parent; the UI doesn't show them). Archived threads leave T3's active lists, and their refs become prunable by 0088/D. braid's code can't write to T3 yet, so `braid t3 tidy` lists and an agent applies with `t3_thread_organize`.

Expected size: about 250 lines in 5 files.

## Start here

- 0088/D's command and its read-only store reader: reuse it.
- The goal's "Already decided": the live unsettled list of 2026-11-28 and what T3's interfaces allow.
- `src/board/t3.ts` and the braid thread title format (`<emoji> <repo> <id> <role>: <title>`, the skill's "Ground rules"): how braid knows a thread is its own.

## Change

- `braid t3 tidy` (dry run only; it writes nothing): two lists, as text and `--json`.
  - **Settle:** unsettled, unarchived threads with braid titles whose item is Done (or whose braid is Done, for a coordinator) and that aren't live; from `t3 thread list` where it gives the fact, the store read-only where it doesn't.
  - **Archive:** settled, unarchived subagent threads whose parent is deleted, from the store read-only (T3's lists hide them).
  - Per list a count, and the ids an agent passes to `t3_thread_organize {action: "settle"|"archive", threadId}`.
- The braid-pm skill, or the docs if the skill stays as it is (decide, log it): how an agent applies the lists, in small batches.
- Tests on a synthetic store and a fake `t3`.

## Already decided

- Archive, never delete (no T3 interface deletes); both are reversible (`unsettle`, `unarchive`).
- Only braid's threads, by title, and subagents of deleted parents; never a user's own top-level thread.
- If the live check shows `t3_thread_organize` can't archive a subagent whose parent is deleted, the strand keeps the lists and records it as a finding for the user's upstream issue, in report.md.

## Out of scope

- Applying the lists to the real T3 store in this strand: the PM or the user does it after the merge.

## Completion

- [ ] `braid t3 tidy` lists, on a synthetic store and a fake `t3`, exactly the unsettled finished braid threads and the settled subagents of deleted parents, and never a live thread or a user's thread; tests show it
- [ ] On scratch threads: `t3_thread_organize` settles and archives a finished subagent (and one whose parent is archived, the closest safe stand-in for deleted); recorded in report.md, or the finding for upstream
- [ ] Read-only check against the real store: the two lists' counts, in report.md (nothing applied)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated (`docs/cli.md`, the help text), or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
