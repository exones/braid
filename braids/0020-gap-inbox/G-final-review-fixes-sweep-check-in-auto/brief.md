---
id: '0020/G'
title: "Final review fixes: sweep check in auto mode, offline warning, checked-out inbox"
status: Done
labels: ["kind:task", "tier:S", "ask:process"]
dependencies: []
order: 50
---

## Goal

Fix three findings of the final review of 0020 (Fable, https://github.com/exones/braid/pull/132#issuecomment-6978180578) before the goal goes into `main`: auto mode never notices a sweep is due, the offline warning quotes the wrong line of Git's error, and a write while `braid-inbox` is checked out in a worktree leaves that worktree ready to delete newer entries.

Expected size: about 40 to 80 lines in 4 to 6 files, with tests.

## Start here

- The review comment above, suggestions 1 to 3.
- `.agents/skills/braid/SKILL.md` ("Sweep", step 1 "When") and `.agents/skills/braid/references/auto-mode.md` ("Merging", step 3).
- `src/inbox/branch.ts`: `firstLine` (line 48) and `writeInbox`; `docs/braids-format.md` ("The inbox").

## Change

1. **Sweep due in auto mode.** In auto mode a strand is merged with `braid accept --merge` and no `braid handover` or `braid recap` runs, so the "Sweep due" trigger never fires. Name the check where auto mode merges (`auto-mode.md`, "Merging", step 3): after each merge, look at the `Inbox:` line of `braid list` (or the draft of `braid recap <id>`); at 3 or more open leftovers, propose the sweep as the skill's "Sweep" says, on the braid's number, while the strands go on. Adjust the skill's "Sweep" step 1 so it doesn't read as if auto mode already saw the line. State the rule once and link it.
2. **Offline warning.** `firstLine` returns the last line of Git's error. Return the first non-empty line (the `fatal:` line that says why), with a test of the warning text for an unreachable remote.
3. **`braid-inbox` checked out in a worktree.** A write moves the branch under a worktree that has it checked out, and that worktree then shows every newer entry as a staged deletion; a commit there would delete them. Before writing, if any worktree of the repository has `braid-inbox` checked out, refuse with a message that says which worktree and how to leave it (`git switch --detach` or remove it), and change nothing. Test it, and say it in `docs/braids-format.md`.

## Already decided

- The rest of the review's suggestions stay out: old D numbers in this braid's logs are history (a later entry explains the renumbering), and the report's four leftovers are noted with `braid note` after the install.
- The user asked for the skill changes in this goal, and merges them with the final PR.

## Out of scope

- The four leftovers in `braids/0020-gap-inbox/report.md`.

## Completion

- [x] Auto mode names the inbox check after each strand merge and proposes a sweep at 3 or more open leftovers; the skill's "Sweep" agrees with it
- [x] The offline warning quotes the first line of Git's error; covered by a test
- [x] A write refuses while `braid-inbox` is checked out in a worktree and changes nothing; covered by a test; `docs/braids-format.md` says so
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
