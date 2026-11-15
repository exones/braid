# 0015/C: Requests: braid handover and braid ask

## What changed

- `src/braids/requests.ts`: the store, `.braid/requests.json` in the main checkout (from `git rev-parse --git-common-dir`, so every worktree shares it), written to a temp file and renamed, every change a short read-modify-write under a lock file. One request per item, a new one replaces it. A review request is dropped when its PR is not open or at another head; a PR GitHub can't be read for keeps it.
- `src/commands/requests.ts`: `braid handover <id> --head <sha>` (PR open, at the head, `ci` checks green, else nothing changes; then it opens a `review` request and prints the `braid recap` draft), `braid ask <id> "<text>" [--kind] [--key] [--thread]` (or `--file -`), `braid answer <id> [--log -]`, `braid requests` (item, kind, age, text).
- `braid start` and `braid done` close the request on their item (done only when it succeeds).
- `src/cli.ts` routes the commands and the help; `docs/braids-format.md` describes them; `docs/decisions.md` has D45, citing 0015/A's findings and the user's choice.

## Why

States design in `states.md`: an item goes to the user's side only by an explicit request, which can't go stale because GitHub facts and any next step close it.

## Validation

`test/requests.test.ts` (10 tests, temporary repositories with a bare remote, a second worktree and a fake gh): shared store across worktrees, replace, answer (with and without `--log`, refused log), handover and its three refusals, review void on merge, close and moved head, GitHub unreadable, start and done closing. `npm run verify` passes.

## Review round 1

- Lost updates fixed: `openRequest`, `closeRequest` and the drop in `liveRequests` are locked read-modify-writes (`.braid/requests.json.lock`, exclusive create, retry up to 10 s, a lock older than 30 s is taken over). `liveRequests` asks GitHub without the lock, then under it re-reads and drops only the requests it found void (same item and time), so a request opened meanwhile survives.
- `PrNow` is the `gh pr view` shape (`state`, full `headRefOid`); the state is compared in any letter case.
- Each store call asks Git for the main checkout once. `age` moved next to the store; `filterLive` is the pure filter.
- Tests added: a write during the GitHub call, four processes writing at once (32 requests, none lost), a stale lock, `filterLive`.

## Open

- The request's `--thread` is stored but nothing reads it yet.

For later items: D must use `src/braids/requests.ts` only: `loadRequests` and the pure `filterLive(requests, prOf)` to derive lanes without writing (`prOf` returns `{ state, headRefOid }` or null; the board's lowercase state is fine), `age`, and `liveRequests` where persisting drops is wanted. A request has `id, kind, text, key?, at, thread, pr?, head?` (`head` is the full sha). The review request text is `review PR #N at <short sha>`.

Needs the user: none
