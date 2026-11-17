---
id: '0020/A'
title: "The inbox branch: braid note and braid inbox"
status: To Do
labels: ["kind:story", "tier:L", "ask:architecture"]
dependencies: []
order: 10
---

## Goal

The project gets an inbox on its own branch, `braid-inbox`, with one small file per entry in `leftovers/` or `ideas/`. `braid note` captures an entry from any thread or worktree, committing and pushing it at once, and `braid inbox` lists the entries. The sweep commands (0020/F), the counts (0020/B), the board (0020/C) and the skills build on this storage and its reading functions.

Expected size: about 400 to 550 lines in 6 to 8 files, with tests.

## Start here

- `../brief.md`: the goal, the two kinds and "Already decided", especially why the inbox is a separate branch.
- `src/braids/branches.ts`: how braid already reads files from branches without a checkout (`git ls-tree`, `git show`) and lists branches. The inbox reader is similar, but reads one known branch.
- `src/commands/done.ts` (`stamp`, `stampBranch`): how braid commits and pushes today. `braid note` must not need a checkout, so it uses Git's low-level commands instead.
- `src/braids/logs.ts` (`braid log`): the closest existing capture command, for text input and `--file -`.
- `src/cli.ts` (`BRAID_COMMANDS`, `dispatch`, help text), `docs/braids-format.md`, `docs/cli.md`, `docs/decisions.md`.

## Change

- The branch `braid-inbox` has its own history, separate from `main` (it starts as an orphan commit). It holds `leftovers/<name>.md` and `ideas/<name>.md`, where `<name>` is `<YYYY-MM-DD>-<short random>`, and the whole `<name>` is the entry id.
- An entry is front matter, then a short Markdown text whose first line is its title. A leftover's body says what is wrong or missing, where (files, functions), and why it matters, so an agent who never saw the item can understand it. An idea is written by the `braid-idea` skill (0020/E). Front matter:
  - `from`: `<item id>` (such as `0012/A`), `review <item id>`, `PR #<n>` or `user`. Required for leftovers.
  - `ref`: optional links to where the context is, such as the review comment URL, the PR or a commit
  - `status`: `open`, `taken` or `dropped`
  - `passed`: leftovers only; how many sweeps passed it over, starting at 0
  - `into`: the braid ids it went to, when taken
  - `why`: the reason, when dropped
- A shared write function for this strand and 0020/F. It starts from the latest remote `braid-inbox` (fetching it first), or creates the branch when it exists nowhere yet. It builds the new commit with Git's low-level commands (`hash-object`, `mktree` or a temporary index, `commit-tree`), so it never touches any checkout or index. It pushes as a fast-forward. When the push is refused because someone else pushed first, it fetches and redoes the commit on top, a few times. It never force-pushes. When the push fails for another reason (offline, no remote), it keeps the commit on the local `braid-inbox`, warns, and the next write pushes it. A lock in the main checkout's `.braid/` (as `src/braids/requests.ts` does) keeps two writers on one machine apart.
- Commit messages: `docs(inbox): <entry id> <what>`, for example `docs(inbox): 2026-11-18-k3f9 note`.
- `braid note "<text>" --from <source> [--ref <url>]... [--file -]` writes an open leftover; without `--from` it refuses. `braid note --idea "<text>" [--file -]` writes an open idea, with `from: user` unless `--from` is given. Both print the entry id and the push result.
- `braid inbox [--leftovers|--ideas] [--all] [--no-fetch]` fetches `braid-inbox`, then lists the open entries: kind, id, age (from the commit that created the file), source, passed, and the title or text. `--all` adds the taken and dropped ones. `braid inbox show <id>` prints one entry in full: front matter, text, and the item folder that `from` names, when it exists. It reads whichever is newer of the local branch and the remote-tracking one. A malformed entry is reported with its file and field, and the rest are still listed.
- Reading functions for 0020/B and 0020/C: read the entries from the refs without fetching, and fetch on request.
- Tests on temporary repositories with a bare remote. Cover: the first capture, which creates the branch; two clones capturing at once, where one push is refused, retried and both entries end up on the branch; capturing while offline, then pushing on the next write; and a capture from a worktree with uncommitted changes, whose working tree and index stay untouched.
- Update `braid help`, `docs/braids-format.md` and `docs/cli.md`, and add a decision to `docs/decisions.md`: the inbox, its two kinds, its branch, its writers and why, citing this braid.

## Already decided

- Storage, kinds and writers: see the braid's "Already decided". braid never deletes entries; taken and dropped ones stay as records.
- `braid check` and the `braids/` folder are not touched: the inbox doesn't live there.
- The branch name `braid-inbox` doesn't match the branch shapes `braid/<n>-<slug>` and `braid/<n>/<letter>-<slug>`, so `braidBranches` and `braid clean` ignore it.

## Failure modes and regression tests

- Concurrent writers from two clones: there is no lost entry and no force-push. This is tested.
- Offline: the entry is never lost; it stays on the local branch with a warning. This is tested.
- A capture never changes the capturer's checkout, index or current branch. This is tested.
- A malformed entry on the branch (for example, edited by hand on GitHub): `braid inbox` names it and still lists the rest. This is tested.
- Someone force-pushes or deletes `braid-inbox`: document how to recover it from a local copy.

## Out of scope

- The sweep commands (0020/F); the counts (0020/B); the board (0020/C); the skills (0020/D and 0020/E).

## Completion

- [ ] `braid note` and `braid note --idea` commit an entry to `braid-inbox` and push it, creating the branch the first time, without touching the checkout or index; covered by tests
- [ ] Concurrent captures from two clones both land, without a force-push; covered by a test
- [ ] An offline capture stays local with a warning and is pushed by the next write; covered by a test
- [ ] `braid inbox` lists open entries of both kinds, `--all` adds taken and dropped ones, and a malformed entry is named while the rest are listed; covered by tests
- [ ] `braid note` refuses a leftover without `--from` and stores `--ref` links; `braid inbox show` prints an entry in full; covered by tests
- [ ] `braid help`, `docs/braids-format.md`, `docs/cli.md` and `docs/decisions.md` describe the inbox
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
