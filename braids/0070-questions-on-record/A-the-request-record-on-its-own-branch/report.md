Requests now live on the branch `braid-requests`, one file per request, `requests/<code>.json`, with a code (`q-` and four lowercase letters or digits) and an `events` list that only grows. Nothing is deleted any more: a closed request keeps its file with its last event. Every command and reader that used `.braid/requests.json` works on the record with the same behaviour, and an old file is carried over once.

What changed:

- `src/braids/gitbranch.ts` (new): the inbox's branch code, moved out of `src/inbox/branch.ts` and parametrised by a `BranchSpec` (branch, folders, lock, a noun for messages, an optional `merge`). It fetches, reads from the refs (descendant, or remote plus local-only changes when they diverged), writes with a temporary index, `commit-tree` and `update-ref`, pushes as a fast-forward, fetches and redoes on refusal, and keeps offline commits local. It adds three things: `push: false` for a commit that stays local, a `merge` hook for a file that both sides changed when local commits are replayed, and a fallback `braid` identity when Git has none (fresh CI runners). `src/inbox/branch.ts` keeps its exports and parsing on top of it. The inbox tests pass unchanged.
- `src/braids/state.ts` (new): `mainCheckout`, `ensureStateDir`, `locked` and `takeOverStale`, moved out of `requests.ts` so the branch module doesn't import the request module. `requests.ts` re-exports them. `locked` takes a wait time; the branch lock waits 60 s, because a write now fetches and pushes.
- `src/braids/requests.ts`: the record. A file holds the fields set at opening (`code`, `item`, `kind`, `text`, `key`, `by`, `thread`, `to`, `pm`, `doneWhen`, `pr`, `head`, `eta`) and `events` (`opened`, `forwarded`, `answered`, `withdrawn`, `met`, later `eta`; each has `at`, `by`, and `text` and `reason` where they apply). The state comes from the events and is never stored. In memory, `Request` keeps the old fields (`at`, `to`, `forwarded`, `note` come from the events) and adds `code`, `state`, `events`, `doneWhen` and `eta`, so the board and the notifier didn't change. The API keeps its names:
  - `openRequest` returns the code and withdraws the asker's open one ("replaced by q-…").
  - `closeRequest` records an `Ending` (state, who, text).
  - `forwardRequest` records a `forwarded` event.
  - `loadRequests` reads from the local refs, with no fetch. It is cached by the two tips, so an unchanged record costs one `git for-each-ref`.
  - `liveRequests` records a review `met` when its PR merged, and `withdrawn` when the PR closed or its head moved.
  - `migrate` carries `.braid/requests.json` over in one commit, skips records already there (same item, asker and time), then renames the file `requests.migrated.json`.
  - When an offline commit is replayed over a remote change to the same request, the event lists are merged.
- Callers:
  - `braid ask` and `braid handover` print the code first.
  - `braid answer` records `answered` by the asker.
  - `braid start` records `answered` "started".
  - `braid accept` records a review `met` "accepted" and anything else `withdrawn` "the item is Done".
  - `braid requests` fetches first (a warning when it can't), prints each code first, and names unreadable files in a warning.
  - A write that couldn't push adds a `warning:` line to the command's output.
- Board: it reads the local refs. On a fresh read (the Refresh button) it fetches `braid-requests` alongside its GitHub and T3 reads (`Sources.fetchRequests`, in `readSnapshot`), never inside a lock. Its read stays pure, apart from carrying an old file over once, onto the local branch only.

Board page-load time. I benchmarked `readSnapshot` on a clone of this repository, with GitHub and T3 stubbed, as the median of 25 runs:

- Before: 5 open requests in `.braid/requests.json`. The page read took 1.17–1.34 s and the requests and signals read about 76–80 ms.
- After: the same 5 requests carried over, plus 100 closed ones on the branch. The page read took 1.33–1.40 s and signals about 93–97 ms.

Runs taken one after another vary by about ±130 ms, so the page-load difference is within the noise. The signals read costs about 18 ms more, which is one `git for-each-ref`; the files are re-read only when a tip moved. A first version without the cache took about 250 ms, which is why the cache is there. The scripts are in `~/.braid/artifacts/agento/0070/` (`bench.mjs`, `fill.mjs`).

Validation:

- New tests in `test/requests-record.test.ts`:
  - The file round trip: fields, events, nothing deleted.
  - Codes are unique, and a review's `doneWhen` is `pr:<n>`.
  - A new request withdraws the asker's open one and leaves the other asker's.
  - A refused push is fetched and redone, and both writes land.
  - Two clones writing at once lose nothing.
  - Offline, a request opens on the local branch and the next write pushes it. An offline change merged with a remote change keeps both events.
  - A file that doesn't parse is reported and skipped.
  - Migration carries the requests over once, with times, the forward and the PR, and keeps the file renamed. A half-done migration doesn't duplicate.
  - Readers don't fetch.
- `test/requests.test.ts`, `test/pm-asks.test.ts` and `test/pm-requests.test.ts` are moved onto the record: codes in the output, and met or withdrawn recorded with the reason. Two process-concurrency tests write fewer requests each (4 and 3 instead of 8 and 6), because each write now fetches and pushes; they still overlap.
- The inbox tests are unchanged and pass.
- The gate passed: `npm run verify`.

Docs:

- `docs/braids-format.md`: a new section, "The request record", plus the requests bullets.
- `docs/board.md`: Requests.
- `docs/cli.md`: `braid answer` and `braid requests`.
- `docs/decisions.md`: D96, the decision-log line, and a note on D45.
- The CLI help for `answer` and `requests`.

Open:

- Review requests ended by their PR are recorded only when `braid requests` runs, as the brief said ("where `liveRequests` writes today"). The board already hides them.
- In a repository without `origin`, every write prints the offline warning. That is the inbox's behaviour.

Decisions:

- A request's state comes from its events. In the file, `to` stays as opened, and a forward is an event.
- `braid start` closes as `answered` ("started"). `braid accept` closes a review as `met` and anything else as `withdrawn`. `braid answer` records `answered` with the asker as who.
- The PR checks are recorded with who `board`, the automatic closer.
- The branch lock waits 60 s.
- Writes fall back to a `braid` Git identity when there is none.
- When an offline replay meets a remote change to the same request, the event lists are merged rather than one side winning.
- The board migrates without pushing.
- The record read is cached by the two tips.
- Commit messages read `docs(requests): …`, like `docs(inbox): …`.

For later items:

- 0070/B:
  - `closeRequest(root, id, by, ending)`: `Ending.who` is where "who answered" goes, and `RequestEvent.reason` holds the PM's reason.
  - `doneWhen` and `eta` exist and are stored. `eta` is null.
  - `to` is still typed `"user" | "pm"`, so an addressee that is another braid's number needs the type widened.
  - `loadRecord` gives the closed requests too.
- 0070/C: `Request.code` and `events` reach the board through `readSignals` (`sig.requests`, `asks`, `programmes`). Closed requests come from `loadRecord`.
- `src/braids/gitbranch.ts` is the place for any further data branch.
- Process note: shell heredocs holding JS template strings cost several retries here. Direct file edits were faster.

Needs the user: none
