# 0015/C: Requests: braid handover and braid ask

## What changed

- `src/braids/requests.ts`: the store, `.braid/requests.json` in the main checkout (from `git rev-parse --git-common-dir`, so every worktree shares it), written to a temp file and renamed. One request per item, a new one replaces it. A review request is dropped when its PR is not open or at another head; a PR GitHub can't be read for keeps it.
- `src/commands/requests.ts`: `braid handover <id> --head <sha>` (PR open, at the head, `ci` checks green, else nothing changes; then it opens a `review` request and prints the `braid recap` draft), `braid ask <id> "<text>" [--kind] [--key] [--thread]` (or `--file -`), `braid answer <id> [--log -]`, `braid requests` (item, kind, age, text).
- `braid start` and `braid done` close the request on their item (done only when it succeeds).
- `src/cli.ts` routes the commands and the help; `docs/braids-format.md` describes them; `docs/decisions.md` has D45, citing 0015/A's findings and the user's choice.

## Why

States design in `states.md`: an item goes to the user's side only by an explicit request, which can't go stale because GitHub facts and any next step close it.

## Validation

`test/requests.test.ts` (10 tests, temporary repositories with a bare remote, a second worktree and a fake gh): shared store across worktrees, replace, answer (with and without `--log`, refused log), handover and its three refusals, review void on merge, close and moved head, GitHub unreadable, start and done closing. `npm run verify` passes.

## Open

- `braid requests` and the self-closing rule call `gh pr view` once per review request; D can read the file and apply the same rule through `liveRequests` in `src/braids/requests.ts` (it takes a PR lookup function).
- `answer` only closes; the request's `--thread` is stored but nothing reads it yet.

For later items: D should use `liveRequests`/`loadRequests` from `src/braids/requests.ts` and `age` from `src/commands/requests.ts`; a request's fields are `id, kind, text, key?, at, thread, pr?, head?`. The review request text is `review PR #N at <short sha>`. none otherwise.

Needs the user: none
