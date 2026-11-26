---
id: '0077/H'
title: "A request-record write with few git processes"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0077/B']
order: 28
---

## Goal

One write to the request record holds its lock for a short time. Today a write to `braid-requests` (`writeBranchUnlocked` under `lockedBranch`, src/braids/gitbranch.ts) spawns about 38 git processes and takes 7 to 9 s under load, so queued writers wait past 60 s (leftover 2026-11-25-gprw, measured in 0078/J, PR #332). The same long hold makes two lock tests in test/requests.test.ts time out on a loaded machine (leftover 2026-11-25-x9jg).

Expected size: about 200 lines in 4 files.

## Start here

- `writeBranchUnlocked`, `lockedBranch` and the generator algorithm with its sync and async drivers in src/braids/gitbranch.ts (0077/B).
- src/braids/requests.ts: what one record write does.
- PR #332 (0078/J): how the 38 processes were counted.
- test/requests.test.ts: "overlapping writers in separate processes lose no update" and the same "when they start on a stale lock".
- `spyOnGit` in src/braids/gitio.ts: counting git processes in a test.

## Change

- Fewer git processes per write: plumbing in as few processes as possible (for example one `git cat-file --batch` for reads, `git hash-object`/`mktree`/`commit-tree`/`update-ref` batched, `git update-ref --stdin` for several refs), and the refs it already knows read once.
- A test that counts the git processes of one write and fails if it grows back (state the count before and after in report.md).
- The two lock tests pass on a loaded machine, or their wait scales with the measured write time; say which in report.md.

## Already decided

- Added by the coordinator under the free preset (2026-11-26) from leftovers gprw (the PM handed it over) and x9jg: it fits the braid's git runner work and shortens the lock that queues board writes.
- The record's commits, their content, pushes and their order stay exactly as they are; the generator algorithm and its two drivers (0077/B) stay. A record written by the new code reads the same with the old.

## Out of scope

- The record's format; the lock's design.

## Completion

- [x] One record write spawns far fewer git processes than today, with a test that counts them; the counts before and after are in report.md
- [x] The commits a write makes are the same as before (a test compares trees and messages)
- [x] The two lock tests no longer time out under load, or report.md says why they still can
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

In src/braids/gitbranch.ts only, the write path (both drivers): fetch first and ask the remote what is wrong only when it fails (no remote get-url / ls-remote); read local, tracking and checkout of the branch with one for-each-ref (worktree list only when there is no local branch); one rev-list for a branch that is only behind; build blobs, tree and commit with one git fast-import, the identities from git var (as commit-tree resolves them), replacing hash-object, the temporary index, write-tree and commit-tree; move both refs with one update-ref --stdin. Tests: the processes of one write counted by name; each commit's sha equals the same commit rebuilt with the old plumbing. Then time the two lock tests under load.
