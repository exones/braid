---
id: '0085/C'
title: "What clean cannot remove becomes a request for the user"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: ['0085/B']
order: 30
---

## Goal

When `braid clean --yes` can't remove a worktree it should remove (a finished item's), the user is asked to act: one request per project on the board, under "Needs you", listing each such folder with its size and the reason. The user: "if it's not good I will see it and at least asked to take action to clean up".

Expected size: about 150 lines in 3 files, tests included.

## Start here

- `src/commands/clean.ts` (after 0085/A and B): the kept reasons, and which mean the user must act (work in the worktree or a submodule, a folder git won't remove, not a worktree of this repository) and which pass by themselves (a running thread, "still in use, retry later", the item isn't finished).
- `src/braids/requests.ts` (`openRequest`, `KINDS`: `action` is the kind for "do this"; the replace rule in `openRequest`'s comment) and `src/commands/requests.ts` (`askCommand`, `withdrawCommand`): the request record as it is on `main`.
- `docs/board.md`: where an `action` request on an item shows (Needs you), also for a Done braid.

## Change

- One open cleanup request per project (the PM, 2026-11-28: everix4 has ~70 worktrees, one request per folder would flood the Questions panel): an `action` request to the user with key `cleanup`, listing every folder clean kept for a reason that needs the user, each with its size (human-readable; computed only for these folders) and reason, so the board shows it under Needs you. A dry run opens or changes nothing and says what it would ask.
- Each `clean --yes` run brings that one request up to date with its list: it opens it when there is none, updates it when the list changed (through the record's existing calls, for example a new request replacing the old one, or an update event if the record has one), leaves it as it is when the list is the same, and closes it (withdrawn: "nothing left to clean") when the list is empty. The record stays the only state; no new file.
- Which item id the project's request is on is yours to choose with the record as it is (for example the newest braid with a kept folder, carried over between runs by finding the open `cleanup` request); say why in report.md.
- The cleanup request must not replace a coordinator's own open question or handover on that item (today `openRequest` withdraws an open request of the same asker and sort). Find the way that keeps both with the record as it is (the item id, the kind, the asker); if it needs a change to the record's rules, stop and propose it: that is a contract with 0084 (P31, several open questions per item), which changes that rule.
- Clean's lines for these folders give the request's handle.

## Already decided

- Reasons that pass by themselves open no request: a running thread, "still in use", an unfinished item.
- The request is to the user, also in a PM-run braid: the user asked to see it themselves.
- Tests use temp repos and a temp request record, never the real `braid-requests` branch.

## Out of scope

- Disk use on the board (P26). Removing anything the user hasn't acted on.

## Completion

- [ ] Finished items' worktrees kept for unpushed or uncommitted work give one `action` request for the project listing each folder with size and reason, shown under Needs you, with a test
- [ ] A second clean opens no second request; a changed list updates it; an empty list closes it, with tests
- [ ] A coordinator's open question or handover on the item stays open, with a test
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
