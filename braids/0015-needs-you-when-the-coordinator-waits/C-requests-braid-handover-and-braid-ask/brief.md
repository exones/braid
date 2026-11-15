---
id: '0015/C'
title: "Requests: braid handover and braid ask"
status: In Progress
labels: ["kind:story", "tier:M", "ask:architecture"]
dependencies: []
order: 30
---

## Goal

The coordinator records, with one command, that it needs the user: a request. Requests are the only way an item is put on the user's side of the board on purpose (`../states.md`).

Expected size: about 300 to 450 lines in 6 files, with tests.

## Start here

- `../states.md`: "The one new thing: a request" and "Decided".
- `src/commands/facts.ts` (`braid recap`), `src/commands/done.ts`, `src/commands/start.ts` (finding the main checkout), `src/cli.ts`.
- `docs/braids-format.md` (commands), `docs/decisions.md`.

## Change

- A requests store: one JSON file under `.braid/` of the main checkout (found from any worktree), written atomically. A request: item id, kind (`review`, `question`, `decision`, `plan`), the one-line text of what is needed, the time, the asking thread, and for a review the PR number and head commit. At most one open request per item; a new one replaces it.
- `braid handover <id> --head <sha> [--thread <id>]`: checks like `braid done` that the PR is open, at that head and green, opens a `review` request and prints the `braid recap` draft.
- `braid ask <id> "<what is needed>" [--kind question|decision|plan] [--key <stop case>] [--thread <id>]`: opens a request. The text can come from `--file -`.
- `braid answer <id> [--log -]`: closes the item's request; with `--log` it adds the user's decision to the braid log.
- Self-closing, applied whenever requests are read: a `review` request is void when its PR is merged, closed or at another head; any request on an item is closed by `braid start` and `braid done` on that item.
- `braid requests`: lists open requests (item, kind, age, text).
- Tests on temporary repositories with a fake gh; `braid help`, `docs/braids-format.md`, and a decision in `docs/decisions.md` (requests, their store, why explicit rather than inferred from T3; cite 0015/A's report).

## Already decided

- Local `.braid/` file, no commits (user, 2026-11-15). Only this machine sees it.
- Requests are written only by braid commands.

## Out of scope

- The board and `braid status` reading requests (0015/D). The skills (0015/E).

## Acceptance

- [ ] handover, ask, answer and requests work from any worktree of the repository and share one store, covered by tests
- [ ] A review request is void after a merge, a close or a moved head; start and done close an item's request; covered by tests
- [ ] handover refuses a PR that is not open, not at the head given or not green

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

- `src/braids/requests.ts`: the store. `.braid/requests.json` in the main checkout (from `git rev-parse --git-common-dir`, so any worktree shares it), written to a temp file and renamed. One request per item id; `openRequest` replaces. `liveRequests` reads and applies the self-closing rule: a `review` request is dropped when its PR (gh `pr view`) is not OPEN or its head differs; a PR that can't be read keeps the request.
- `src/commands/requests.ts`: `braid handover`, `ask`, `answer`, `requests`. handover reuses `view` and `checksProblem` of done.ts (open, at `--head`, `ci` green), stores a review request, then prints the `braid recap` draft. ask takes the text as a positional or `--file -`. answer closes and, with `--log`, calls the `braid log` code on the item.
- `braid start` and `braid done` close the item's request on success.
- `src/cli.ts` routes the four commands and the help text; docs in `docs/braids-format.md`, a decision in `docs/decisions.md`.
- Tests (`test/requests.test.ts`) on temporary repositories with a fake gh, including a second worktree.
