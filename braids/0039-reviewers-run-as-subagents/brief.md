---
id: '0039'
title: "Reviewers run as subagents"
status: In Progress
labels: ["kind:story", "tier:L", "ask:process", "ask:architecture"]
dependencies: []
related: ['0034', '0037']
delivery: epic
---

## Goal

In T3 the coordinator launches each reviewer as a subagent (a delegated task, `delegate_task`) instead of a top-level thread, so the sidebar holds only coordinators and workers; the reviewer shows inside the coordinator's chat. Workers stay top-level threads. The board keeps telling the truth while a subagent reviews: it shows the review and raises no "stalled" alarm, and `braid clean` removes the reviewer's checkout as before. The old way goes: `braid start --review` and the board's handling of top-level reviewer threads are removed.

Expected size: about 450 lines in 18 files, tests and removed lines included.

## Start here

- `.agents/skills/braid/SKILL.md`: "Accept and hand over" step 1 (the launch, the re-check, `link_pull_request`, the first message), "Run an item" step 3 (the wait, a failed run), "After the merge" steps 1 and 2.
- `.agents/skills/braid-reviewer/SKILL.md`: "Start" steps 1 and 3 (the first message, the worktree from `braid start <id> --review`) and "Report" step 2 (`t3_thread_send`).
- `.agents/skills/braid/references/resuming.md` and `references/workflow.md` ("Failure modes", the worktree row).
- `src/board/t3.ts`: `readFresh` finds agents through `t3 thread list` and `t3 thread show`; `src/board/model.ts`: `derive` (the `stalled` and `checks failed` alarms, `activityOf`).
- `src/braids/requests.ts`: local state under `.braid/` of the main checkout, written only by braid commands; the pattern for the new record.
- `src/commands/clean.ts` (the reviewer checkout of a merged item), `src/commands/start.ts` (`--review`, `startReview`), `src/braids/worktrees.ts` (`reviewFolder`, `itemOfFolder`) and `src/commands/coordinate.ts` (the thread column of `braid status`).
- `test/start.test.ts`, `test/t3.test.ts`, `test/coordinate.test.ts` and `test/done.test.ts`: the tests that use `--review` or a `-review` folder.
- `docs/board.md`, "Agents of an item"; `docs/cli.md`; `docs/braids-format.md` (the command list); `docs/getting-started.md`; `docs/decisions.md` (D45, D46 and the dated list at the end).
- `test/board*.test.ts` and the tests of `braid clean`, for how T3 is faked (`T3Runner`).

## Change

- `.agents/skills/braid/SKILL.md`, "Accept and hand over" step 1: for M and L the reviewer is a delegated task: `delegate_task` with `role: review`, `isolation: worktree`, `mode: async`, the reviewer model from `BRAID.md` as `target` (`providerInstanceId`, `model`, `options`), `title` from `braid title <id> --role review` and the first message as `task`. Then `braid review <id> --thread <child thread id>` and `link_pull_request` with the child thread. The coordinator ends its turn as the task's `next` says and takes the result when T3 delivers it; it never polls. `braid start <id> --review` and "Send your result to thread" leave the skill. A re-check and a second round are each a fresh task, as today.
- The same skill, the wait and failure text for a reviewer: no result, an empty result or a failed run means read the PR's newest review comment at that head; without one, start one fresh task with the same model and settings, then `braid ask` (`quality`). A model or provider T3 can't run as a child is told to the user, never replaced.
- `.agents/skills/braid-reviewer/SKILL.md`: the reviewer works in the checkout its host gave it: `git fetch`, `git checkout --detach <head commit>`, confirm with `git rev-parse HEAD`; if that fails it says so and stops. Its last chat message is the report (blocking or not, the Needs the user line, the reviewed commit, the comment's link); it sends that to a thread only when the first message names one.
- `references/resuming.md`: a review that was running when the coordinator was lost is judged by the PR's review comment at the head commit; without one, a fresh review.
- New command `braid review <id> --thread <thread id>`: records, in `.braid/` of the main checkout, a thread that reviews the item's PR (several per item: re-checks). `src/cli.ts` help, `docs/cli.md`, `docs/braids-format.md`.
- `src/board/t3.ts`: for each recorded thread of an unmerged item, `t3 thread show <thread id> --json`; while T3 says it runs, it is that item's reviewer agent (review activity, its pending questions, and it holds back `stalled` and `checks failed`, as a reviewer thread did before). A recorded thread that isn't running, or that T3 doesn't know, counts for nothing.
- `src/commands/clean.ts`: for a merged item, also remove the checkout and the `t3/…` branch of each recorded review thread (`worktreePath` and `branch` from `t3 thread show`), only when T3 says the thread is a child (`relationshipToParent`) that isn't running and the folder is a worktree of this repository; then drop the record. A folder still in use is kept and named, as today.
- Remove `braid start <id> --review` (`src/commands/start.ts`, `src/cli.ts` help, `docs/cli.md`, `docs/braids-format.md`): it now fails as an unknown option, with one line saying reviewers are recorded with `braid review`.
- Remove the board's handling of top-level reviewer threads (`src/board/t3.ts`): a running thread in a `-review` folder and an idle thread titled as a review are no longer an item's reviewer; the reviewer comes only from the record. `braid title <id> --role review` stays, as the child's title.
- `src/commands/clean.ts` keeps one thing from the old way: it still removes a leftover `-review` checkout of a merged item, so folders made before this change don't stay behind.
- Tests that covered the removed paths are rewritten for the record or deleted with the code they tested, never left skipped.
- `docs/board.md`, "Agents of an item": a recorded review thread counts as the reviewer, and the `-review` checkout text goes; `docs/getting-started.md`: the reviewer is a subagent of the coordinator in T3.
- `docs/decisions.md`: a new decision (the next free number when the PR is ready) and a dated line: 2026-11-19, user (0039): reviewers run as T3 subagents to keep the sidebar to coordinators and workers; workers stay top-level because a subagent can't watch its own PR and, with parallel workers, everything would pass through the coordinator.

## Already decided

Checked on 2026-11-19 with a test delegate in this repository (T3 on Windows):

- A child thread is not in `t3 thread list`. `t3 thread show <child id> --json` works and gives `status`, `worktreePath`, `branch`, `parentThreadId`, `relationshipToParent: subagent` and `pendingRequestCount`. Showing the parent thread does not list its children, so the child's id has to be recorded.
- T3 makes the child's checkout itself, in its own worktrees folder (`…/<repo>/t3-<hex>`) on a new branch `t3/<hex>` at the parent's commit; `delegate_task` can't use a folder `braid start` made. The checkout stays after the task ends, and on Windows the folder is locked for a few minutes after it.
- A child thread id looks like `thread:delegated-task:command%3Amcp%3A<uuid>%3Adelegate-task%3A<uuid>`: it holds `:` and `%`.
- The parent gets the child's last message as the task's `summary`. A child has `gh` and `braid`, and no `watch_pull_request`.
- T3 allows a child on another provider (`cursor` from a Claude coordinator).

Chosen:

- The user chose this (2026-11-19): reviewers only. Workers stay top-level threads.
- The user chose (2026-11-19): `braid start --review` and the board's handling of top-level reviewer threads are removed, not kept beside the new way. The command name `braid review` is approved.
- The user chose (2026-11-19): the board gets no Open thread for a subagent reviewer; the Coordinator button opens its parent, where the child shows.
- The skills and the CLI are installed together, so no skill of this version calls the removed option.
- Related to 0034 (Autonomy presets: you choose what braid decides, on `braid/0034-autonomy-presets`; the number is shared with another braid, "Board: item details in a side panel, not a page"): its strand A says waiting for a reviewer's thread with `t3_thread_wait` stays, and its strand E edits other parts of both skills (the preset check in the reviewer, the stops in the coordinator). No contradiction: whichever merges second merges `main` first and keeps this story's reviewer wait.
- Related to 0037 (Coordinator asks with the question tool and set options, on `braid/0037-coordinator-asks-with-the-question-tool`): both edit `.agents/skills/braid/SKILL.md`, 0037 in "Talking to the user" and the places that stop for the user, this story in the review launch and its wait. Whichever merges second merges `main` first.

## Out of scope

- Workers as subagents, parallel workers, and any change to how a worker is launched or waited for.
- Listing or opening child threads from the board beyond the review activity above.
- `AGENTS.md`, `CLAUDE.md` and `BRAID.md`: the reviewer's model line stays as it is.

## Failure modes

- The board raises `stalled` during a review: with no recorded thread the item is In Progress with no agent and no pending checks. Guarded by `braid review` right after the launch and the board reading the record.
- The child thread id is mangled on its way to `t3.cmd` through `cmd.exe` (`%3A`), so `t3 thread show` misses and the review counts for nothing. Covered by a test with an id of the real shape, and by the probe below.
- The reviewer's result never arrives, or is empty: the PR comment is the record; then one fresh task; then `braid ask`.
- The reviewer's checkout isn't at the head commit: it reviews the wrong code. The reviewer confirms `git rev-parse HEAD` and stops if it differs.
- `braid clean` removes a folder that isn't a finished reviewer's: it removes only a registered worktree of this repository that T3 names for a recorded child thread that isn't running.
- T3 isn't reachable: the board reads as today (`unavailable`), and `braid clean` keeps the checkouts and says so.
- An older installed skill, or a coordinator that loaded the skill before the update, runs `braid start <id> --review` on the new CLI: it fails with the line naming `braid review`, and creates nothing.
- A `-review` checkout made before the change is left on disk: `braid clean` still removes it for a merged item.
- A coordinator lost mid-review (crash, summarized conversation): the next one judges by the PR comment, never by waiting for a task it didn't start.

## Regression checks

- Tests: `derive` with a recorded running review thread gives review activity and no `stalled` or `checks failed`; a recorded thread that isn't running, or unknown to T3, changes nothing; `braid review` writes and adds to the record; `braid clean` removes a finished child's checkout and branch for a merged item and keeps a running or foreign one; a thread id of the real shape reaches the T3 runner unchanged; `braid start <id> --review` fails with the line naming `braid review` and creates no worktree; a top-level thread in a `-review` folder, or titled as a review, is no agent of the item; `braid clean` still removes a leftover `-review` checkout of a merged item.
- A probe, with its output in `report.md`: one delegated task on the reviewer model from `BRAID.md`, read-only and posting no PR comment, on an already merged PR's head: the checkout detaches at the given commit, `braid view` and `gh pr diff` run, the result arrives at the parent, `braid review` makes `braid status` show the review while it runs, and `braid clean` (or the same removal by hand) clears its checkout afterwards.
- A read of both skills: no instruction is left to launch a reviewer as a top-level thread, to run `braid start --review`, or to send the review with `t3_thread_send` unconditionally.

## Completion

- [ ] The coordinator skill launches M and L reviewers as delegated tasks with the `BRAID.md` reviewer model, records each with `braid review`, links the PR to the child thread, and waits without polling
- [ ] The reviewer skill detaches its own checkout at the head commit and ends with its report as the last message
- [ ] `braid review <id> --thread <thread id>` records a review thread; the board and `braid status` show review activity while it runs and raise no `stalled` or `checks failed` for it (tests)
- [ ] `braid clean` removes a finished subagent reviewer's checkout and branch for a merged item and keeps anything else (tests)
- [ ] `braid start --review` and the board's top-level reviewer handling are gone from the code, help and docs; `braid clean` still removes a leftover `-review` checkout (tests)
- [ ] The probe ran on the reviewer model and its output is in `report.md`
- [ ] `docs/board.md`, `docs/cli.md`, `docs/braids-format.md`, `docs/getting-started.md` and a new decision in `docs/decisions.md` describe it
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

1. `src/braids/reviews.ts`: the record `.braid/reviews.json` in the main checkout (item id, thread id, time), locked like requests; load, add, drop. Reading never throws (no repository: no records).
2. `braid review <id> --thread <thread id>` in `src/commands/reviews.ts`, wired in `src/cli.ts` (BRAID_COMMANDS, help); the item must exist.
3. `src/board/t3.ts`: drop top-level reviewer handling (`-review` folders and review titles are no item's thread; `itemOfFolder` matches workers only); for each recorded thread, `t3 thread show --json`; running → that item's `reviewer` agent with its pending count and no link. `show` also returns status, branch and parent relation for clean.
4. `src/commands/clean.ts`: for a merged item, each recorded thread: T3 down → keep and say so; T3 doesn't know it → drop the record; a child (`relationshipToParent`) not running whose `worktreePath` is a registered worktree of this repo → remove the worktree (in-use check), `git branch -d` its `t3/…` branch, drop the record; anything else kept and named. The leftover `-review` checkout removal stays.
5. `src/commands/start.ts`: `--review` and `startReview` go; `--review` fails with a line naming `braid review`, creating nothing.
6. Tests: t3 (record → review activity, no stalled/checks failed; not running/unknown → nothing; `-review` folder or review title → no agent; real-shape id reaches the runner), reviews store/command, clean (finished child removed with branch, running/foreign kept, leftover `-review` removed), start --review refusal; old tests rewritten.
7. Skills: braid SKILL.md review launch as `delegate_task`, `braid review`, link, wait/failure text; braid-reviewer start/report; resuming.md; workflow.md failure rows.
8. Docs: board.md, cli.md, braids-format.md, getting-started.md, decisions.md (new D + dated line).
9. Probe with the reviewer model on a merged PR; output in report.md. Gate, PR.
