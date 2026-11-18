# Report: 0020/A The inbox branch: braid note and braid inbox

## What changed

- `src/inbox/entries.ts`: the entry model (`leftover`, `idea`; `open`, `taken`, `dropped`), new ids (`<YYYY-MM-DD>-<4 random>`), `parseEntry` (a malformed entry becomes a problem naming its file and field) and `formatEntry` (front matter `from`, `ref`, `status`, `passed`, `into`, `why`, then the text).
- `src/inbox/branch.ts`: the `braid-inbox` branch.
  - Reading for 0020/B and 0020/C: `readInbox(root, { fetch })` (refs only unless `fetch`), `readInboxAt`, `fetchInbox`. It reads the descendant of local `braid-inbox` and `origin/braid-inbox`; when they have diverged, the remote's entries plus the files the local-only commits add or change (as the next write replays them), so a listing never hides an unpushed entry. Age is the author time of the commit that added the file.
  - Writing for this strand and 0020/F: `writeInbox(root, change)`. `change` gets a view of the current branch and returns files and a commit message; it runs again on each retry, so 0020/F's read-modify-write (`passed + 1`) stays correct. The commit is built with `hash-object`, a temporary `GIT_INDEX_FILE`, `commit-tree` and `update-ref`; no checkout, index or HEAD changes. Pushes are fast-forward only; a refused push (porcelain `!`) is fetched and redone, up to 5 times; offline or another push failure keeps the commit on the local branch with a warning. Local commits the remote lacks are replayed on top of the remote tip (files, message, author), which also restores entries after the remote branch was deleted or force-pushed. A lock in the main checkout's `.braid/inbox.lock` (the requests lock, now exported as `locked`) serialises writers on one machine.
- `src/commands/inbox.ts`, `src/cli.ts`: `braid note` (leftover needs `--from`, validated as `0012/A`, `review 0012/A`, `PR #12` or `user`; `--ref` repeats; `--file -`), `braid note --idea`, `braid inbox [--leftovers|--ideas] [--all] [--no-fetch]` and `braid inbox show <id>` (with the item folder `from` names). Warnings go to standard error; a lock timeout now exits 1 with its message (`LockError`) instead of "unexpected failure".
- Docs: `braid help`, `docs/cli.md`, `docs/braids-format.md` ("The inbox": layout, fields, writers, readers, recovery after a deletion or force-push) and D53 in `docs/decisions.md`.

## Why

The braid's plan: one branch of its own that any thread or worktree can write without a checkout, never losing an entry and never forcing.

## Validation

- `test/inbox.test.ts` (9 tests, temporary repositories with a bare remote and an isolated HOME and Git config): first capture creates an orphan `braid-inbox`; ideas with `from: user`; listing, filters and `show`; `--from` required and validated; `--file -`; two clones racing (a pre-push hook in one clone makes the other push first, so the first push is refused, redone on top, both entries land in a linear history; nothing forced: the other clone's commit is an ancestor of the remote tip); offline capture stays local with a warning and the next note pushes it; an offline commit replayed after someone else pushed, and listed together with the other clone's newer entries before that replay; a note from a worktree with staged, unstaged and untracked changes leaves status, index, diff, HEAD and branch identical; a hand-edited malformed entry is named while the rest list, and `--all` shows a dropped one.
- `npm run verify` passes (216 tests).

Review fixes (review at 89ba95f): reading unions diverged local and remote branches instead of picking the newer one, with a test; the race test checks ancestry instead of only the reflog.

## Open

- Size: about 940 lines with tests and docs, above the brief's 400 to 550 but under twice that; the replay and the tests account for most of it.
- The lock waits at most 10 s (as for requests); a write that takes longer, such as five slow push retries, makes a second writer on the same machine give up with an error. Rare; the entry is not lost, the command can be run again.
- When two writers change the same file (0020/F's sweeps), the later write's version wins, because `change` re-runs on the fetched tip. A replayed offline commit that changed an existing file overwrites the remote's newer version of that file.

For later items: 0020/F can use `writeInbox` with a `change` that reads the entry from the view, edits its front matter with `parseEntry`/`formatEntry`, and returns it; 0020/B and 0020/C read with `readInbox(root)` (no fetch).
Needs the user: architecture: the inbox's storage and write path (the `braid-inbox` branch, plumbing writes with fetch-and-redo, replay of offline commits) is built as planned; the user reviews it before merge, as the label asks.
