# Report: 0039 Reviewers run as subagents

## What changed

- **`braid review <id> --thread <thread id>`** (new): records a thread that reviews the item's PR in `.braid/reviews.json` of the main checkout (`src/braids/reviews.ts`). The format is item id, thread id as given, and time. The file is written under the same lock as the requests, can hold several threads per item (a re-check is a new thread), keeps a repeat once, and is never committed.
- **Board and `braid status`** (`src/board/t3.ts`): each recorded thread gets one `t3 thread show --json`. While T3 says it runs, it is the item's `reviewer` agent: review activity, its pending questions, and it holds back `checks failed` and `stalled`. Its `link` is null, so there is no Open thread for it. A thread that has ended, or that T3 doesn't know, counts for nothing. The top-level reviewer handling is gone: a running thread in a `-review` folder, or an idle thread titled as a review, is no item's thread (`itemOfFolder` now matches only worker folders). In the demo, 0010/A's reviewer has no link.
- **`braid clean`** (`src/commands/clean.ts`): for a merged item, each recorded thread is shown in T3. Its `worktreePath` checkout and its `t3/…` branch (`git branch -d`, never forced) are removed only when all of these hold: T3 says the thread is a subagent's (`relationshipToParent`), it isn't running, and the folder is a registered worktree of this repository. Then the record is dropped. A thread T3 doesn't know loses its record. A running, top-level or foreign thread is kept and named. When T3 can't be read, everything is kept, and the output says so. Leftover `-review` checkouts are still removed.
- **`braid start --review` removed** (`src/commands/start.ts`, help, docs). It now fails with `braid start has no --review option: … record its thread with braid review <id> --thread <thread id>. Nothing was created`.
- `braid accept`'s refusal names a running review thread as a review thread, not a worker thread.
- **Skills:**
  - `braid` SKILL.md "Accept and hand over" step 1:
    - The reviewer is launched with `delegate_task` (`role: review`, `isolation: worktree`, `mode: async`, the `BRAID.md` reviewer model as `target`, the title from `braid title`), then recorded with `braid review` and linked with `link_pull_request` on the child thread.
    - The coordinator waits as the task's `next` says and never polls.
    - When no result comes, or it is empty or failed: read the PR comment at the head, then start one fresh task, then `braid ask --key quality`.
    - A model T3 can't run as a child goes to the user, never a substitute.
    - "Run an item" step 3 is now for workers only.
    - "After the merge": `task_cancel` a reviewer task that still runs; `braid clean` also removes the reviewers' checkouts.
  - `braid-reviewer`: it detaches its host's checkout at the head (`git fetch`, `git checkout --detach`, `git rev-parse HEAD`) and stops if that fails. Its last message is the report. It uses `t3_thread_send` only when the first message names a thread.
  - `resuming.md` adds the rule for a lost review. `workflow.md` gets a failure row for a missing reviewer result and the locked-folder row.
- **Docs:** `docs/board.md` ("Agents of an item", T3 source), `docs/cli.md`, `docs/braids-format.md` (`braid start`, `braid review`, `braid clean`), `docs/getting-started.md`, and `docs/decisions.md`: D67 and the dated line. D67 is numbered so because the open braids 0034, 0040 and 0037 hold D65 and D66 on their branches.

## Why

The sidebar filled with reviewer threads. As subagents, reviewers show inside the coordinator's chat. T3 doesn't list child threads, and showing a parent doesn't list its children, so the child's id has to be recorded for the board to know a review runs.

## Validation

- New `test/reviews.test.ts` (8 tests):
  - `braid review`: writes, adds, repeat kept once, from a worktree into the main checkout's file, input checks.
  - A recorded running thread: review activity, its question, and no `checks failed` or `stalled` after an hour of each condition (the same item without it gets both).
  - An ended or unknown thread, a top-level thread in a `-review` folder, and one titled as a review: none of them counts.
  - `braid status` shows `review running`.
  - `braid clean` removes a finished child's checkout and `t3/` branch, and keeps a running, foreign or top-level one. A dry run changes nothing. With T3 down it keeps everything and says so. An unmerged item's reviewers are left alone.
  - A real-shape id (`%3A`, `:`) reaches the runner unchanged.
- `test/start.test.ts`: `start --review` fails naming `braid review` and creates no worktree or branch; `braid clean` still removes leftover `0001-B-review` and `0001-review` checkouts. The old `--review` test was rewritten, not skipped.
- `test/t3.test.ts`, `test/board-start.test.ts`, `test/board-merge.test.ts`, `test/lanes.test.ts`: rewritten for the removed top-level reviewer handling.
- Windows quoting: an id of the real shape, passed through `cmd.exe /c` to a `.cmd` file, arrives unchanged (a scratch experiment, and in the probe below through the real `t3.cmd`).
- Gate `npm run verify`: passed, 311 tests. An earlier run had 310 passed and 1 failed: `board-cheaper-reads` "a hung git cat-file --batch …". That test isn't touched here: its child node process didn't write its pid within the 400 ms timeout under full-suite load. It passes alone 3 times out of 3.

### Probe

A read-only delegated task on the `BRAID.md` reviewer model (`cursor` / `grok-4.6`, effort high, fastMode false), `role: review`, `isolation: worktree`, on merged PR #159 (0033) at `7823827`. It posted no comment.

Recorded with the CLI from this branch while the task ran:

```text
0033: review thread thread:delegated-task:command%3Amcp%3Aaaeb5e82-3321-495d-b773-500cb67a0370%3Adelegate-task%3Afc1049aa-7417-4d1b-9c43-d1e13139ddcf recorded
0033  Done  Done  branch +pushed  PR #159 merged  ci merged  thread review running  Board: say why an action is forbidden
t3 thread show: {"status":"running","worktreePath":"c:\\worktrees\\agento\\t3-e517f19d","branch":"t3/e517f19d","relationshipToParent":"subagent","pendingRequestCount":0}
```

The result arrived at the parent as the task's completion. It reported:

- The checkout detached at `782382700c6f7818ad5f148654a656555ef72676` (`## HEAD (no branch)`, `C:\worktrees\agento\t3-e517f19d`).
- `braid view 0033` and `gh pr diff 159 --name-only` ran and listed 8 files.

After the result:

```text
0033  Done  Done  branch +pushed  PR #159 merged  ci merged  thread -  Board: say why an action is forbidden
--- braid clean 0033 (dry run)
would remove 0033: review thread thread:delegated-task:…fc1049aa-7417-4d1b-9c43-d1e13139ddcf: checkout c:\worktrees\agento\t3-e517f19d and branch t3/e517f19d (PR #159 merged)
--- braid clean 0033 --yes
removed 0033: review thread thread:delegated-task:…fc1049aa-7417-4d1b-9c43-d1e13139ddcf: checkout c:\worktrees\agento\t3-e517f19d and branch t3/e517f19d (PR #159 merged)
```

The folder and the branch were gone afterwards. The Windows lock on the folder that the brief mentions didn't occur here: the removal ran about a minute after the task ended.

## Open

- A recorded thread of an item that is never merged (abandoned) stays in `reviews.json`. It costs one `t3 thread show` per board refresh and counts for nothing.

For later items: the flaky `board-cheaper-reads` test "a hung git cat-file --batch …": its 400 ms timeout races the child node's start-up under a full-suite load on Windows.
Needs the user: none
