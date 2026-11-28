# 0077/H: A request-record write with few git processes

## What changed

The write path of the data branches (`src/braids/gitbranch.ts`, used by `braid-requests` and `braid-inbox`) starts 8 to 13 git processes where it started 14 to 19. The generator algorithm and both drivers stay.

| Before | After |
| --- | --- |
| `worktree list`, two `rev-parse` | one `for-each-ref` (tips and where the branch is checked out); `worktree list` only when there is no local branch yet |
| `remote get-url`, `ls-remote`, `fetch` | `fetch`; `remote get-url` only when it fails |
| `hash-object` per file, `read-tree`, `update-index`, `write-tree`, `commit-tree` | `git var` twice (author, committer), `git config` for `i18n.commitEncoding`, one `git fast-import` |
| two `update-ref` | one `update-ref --stdin` |
| `merge-base --is-ancestor` and `rev-list` for a branch only behind | one `rev-list` |

Processes braid starts for one write, counted with `spyOnGit` in a scratch repository (in brackets: every git process in Git's trace, with those of fetch and push):

| Write | Before | After |
| --- | --- | --- |
| first write of a new branch | 14 (21) | 11 (19) |
| open a request replacing one | 17 (27) | 10 (20) |
| close (with the read before the lock) | 19 (29) | 13 (23) |
| lifecycle event | 15 (25) | 9 (19) |

The 38 in the leftover was a Git trace of PR #332's time; the same trace here gave 21 to 29 before.

## How much faster

The machine was busy and noisy; medians of 6 writes, old and new alternating: 2.3 → 1.8 s, 3.2 → 2.2 s, 4.5 → 2.6 s. Three rounds before the encoding fix, on a busier machine, gave 4.5 → 3.6 s, 7.8 → 6.3 s and 7.2 → 7.5 s. Most of what is left is `fetch` and `push` with the processes Git itself starts for them (10 of the 20), which this item doesn't change.

## The commits are the same

A new test rebuilds every commit on the branch the old way (index, `write-tree`, `commit-tree -m`, same identities and dates) and gets the same sha, so tree, message, parent and identities are byte for byte the same. It covers the first commit, a normal one, non-ASCII text and an offline commit replayed with a merge, and runs a second time with `i18n.commitEncoding` set to ISO-8859-1. Pushes and their order are unchanged. Another test covers a machine with no Git identity (written as `braid`) and a branch deleted on the remote.

With `i18n.commitEncoding` set and not UTF-8, `commit-tree` adds an `encoding` header; the write passes it to `fast-import`'s `encoding` command (one `git config` per commit), so the commits match under that setting too (PM decision Q-jgl9, from the review). The ISO-8859-1 case fails without it.

## The two lock tests

Both passed in both full gate runs and alone (69 s and 72 s for 16 and 18 writes). The old code, run alone the same way, failed the stale-lock test in 2 of 2 runs of it (one writer exited 1; stderr not captured, so no proven cause).

They can still fail: waiting no longer times out while the queue moves (0078/J), but a lock older than 30 s is taken over as stale, and a write that is slow enough under heavy load would pass that. I did not change their waits. They were not run under added artificial load.

## Validation

Gate (`npm run verify` through this branch's `braid gate`): passed with the encoding fix, 727 passed, 1 skipped, 0 failed, node tests 846 s. Before the fix it passed on the second run; the first run, on a busier machine (1594 s), failed 3 tests that all pass alone: `board-async` "/api/session answers within a second" (only 2 slow git calls in its 4 s window), `board-projects` "pushes name the project" (one name missing) and a `done-merge` test (`git init`: Permission denied on `~/.gitconfig`).

## Docs

`docs/braids-format.md`: the inbox's writers paragraph names `fast-import` and `update-ref`. No other doc from `docs` names these commands. No user decision to record.

## Anything open

For later items:
- A record write's remaining time is mostly `fetch` and `push` (Git starts `upload-pack`, `receive-pack`, `rev-list`, `maintenance` under them). Skipping the fetch and pushing straight onto the known tip, fetching only after a refused push, would remove one network round trip; it changes when remote changes are seen, so it needs its own item.
- A live lock can still be taken over as stale after 30 s (already proposed by 0078/J): the holder could refresh the lock's time between its git calls.
- The installed `braid` on this machine has no `gate` command; the gate was run with this branch's `node dist/cli.js gate`.

Needs the user: none
