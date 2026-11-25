---
id: '0060'
title: "Workers as T3 subagents"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0011', '0072', '0074']
delivery: epic
autonomy: free
---

## Goal

The coordinator launches each worker as a T3 subagent (`delegate_task`), as it already does for reviewers (D69) and researchers (D75). T3 wakes the coordinator whenever a worker run ends, so a forgotten report, a dead worker session or a broken wait no longer stalls a braid. The sidebar keeps only coordinators. Workers keep their own thread: CI failures, review findings and verdicts go to the same child with its context, and the user can still type into it. Programme pm/autonomous-dev-machine, row P8; builds on 0068 (coordinators end their turn and are woken).

One CLI call replaces the launch prose: `braid launch <id> --role worker|review|research` checks the limits, starts the item, resolves the model and title, and prints the `delegate_task` input; `braid launch <id> --role <role> --child <thread id>` records the child. The skills come out shorter than they went in (the programme's requirement, below).

## Working at the end

A braid runs its strands with workers launched through `braid launch` and `delegate_task`. Each works in the checkout T3 makes for it, on its item branch, and shows on the board as running, with an Open thread link that opens the child, counted by stalls and limits, and paused by the board like any other agent. The worker ends its run when its PR is open, with T3's last line `PR <url>, head <sha>, checks <state>`; the coordinator watches the PR while CI runs and sends a red result back to the same child. `braid clean` removes the child's checkout after the merge. Workers already running as top-level threads keep working until their items finish.

## Already known

- The outline's findings [S1]-[S7] hold; re-checked on T3 v0.1.11, 2026-11-25 [S8]-[S10].
- A delegated child has `t3_thread_send`, `link_pull_request`, `delegate_task` and `orchestrator_capabilities`, but no `watch_pull_request` or `unwatch_pull_request` [S8]. T3's own guidance says delegated children never watch and end with `PR <url>, head <sha>, checks and reviews <state>` [S10]. So the worker can't own its CI wait (D77); the coordinator watches the item PR instead.
- A long foreground wait in a child is refused (`sleep 200` blocked by the Bash tool, which points at Monitor or background waits, both of which D77 keeps out) [S9].
- A child learns its own thread id from `orchestrator_capabilities` (`parentThreadId` is the caller's own id) [S8].
- A follow-up sent to a finished child (`t3_thread_send`) starts a new run that keeps the context, and its result wakes the parent naming the child [S9].
- `t3 thread show <id> --json` gives a child's `status`, `link` (`https://app.t3.codes/threads/<env>/<url-encoded thread:…>`), `worktreePath`, `branch`, `providerInstanceId`, `parentThreadId` and its PRs [S10]. `t3 thread list` still has no option for children [S10].
- The board already treats "PR checks pending" as not stalled for programmes (`src/board/programme.ts`).

## Already decided

- **Programme requirement (the user, 2026-11-22):** "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". No skill grows; the launch prose gets shorter; one CLI call records and checks what prose asked agents to remember; no new state file: workers go in the record reviewers already use (`.braid/reviews.json`, a `role` field; a missing role means review).
- `braid launch` belongs here (Fable's review, idea 2026-11-24-vwv0, its launch part only; the rest of that idea stays with P10 and P15).
- Models per role stay as BRAID.md `models`; `braid launch` reads them, never substitutes.
- All tiers and kinds move at once, spikes included (D75's top-level spike worker becomes a child too). Reviewers and researchers keep `delegate_task` and get `braid launch` too.
- **The branch:** `braid launch --role worker` runs `braid start` without making a worktree: it creates and pushes the item branch and records `started`. The worker switches T3's checkout (made from the coordinator's commit, on `t3/<hex>` or detached) to the item branch (`git fetch`, `git switch <branch>`); the first message names branch and sha. `braid clean` removes T3's checkout and its `t3/<hex>` branch, as for reviewers.
- **CI:** the worker opens its PR, calls `link_pull_request`, and ends its run with T3's last line. On that result, with checks pending, the coordinator calls `watch_pull_request` and ends its turn; the CI wake decides: red goes back to the worker with `t3_thread_send`, green goes to review. D77 is amended: the worker no longer waits on CI; the coordinator watches item PRs too (the watch rule shortens to: watch every PR you wait on, unwatch at the handover or merge).
- **Reports:** the task result is the report; the worker sends no `t3_thread_send` report (no double wake).
- **Wakes the coordinator didn't start** (the user typing in a worker's thread): the coordinator checks the state (`gh pr checks`, `braid status`) and acts only on a change, as "Run an item" step 3 already says.
- **Pauses:** 0074/C builds its pause targets from the board's T3 snapshot: every agent the snapshot gives an item (worktree workers and every recorded thread in `.braid/reviews.json`, whatever its role), plus the coordinator (agreed with 0074's coordinator, 2026-11-25; written into 0074/C's brief, 590fd2f). So 0060/B only has to put recorded workers into that snapshot. A coordinator under a pause sends no follow-up to a child on the paused provider.
- **Open thread:** a recorded child's link is T3's own `link` from `t3 thread show` (the full id with its `thread:` prefix), for workers and reviewers alike; today a subagent reviewer has none (`src/board/t3.ts`).
- Old top-level workers keep being found by their braid worktree, so braids running during the switch need nothing.
- Related to 0074 (The board pauses and resumes reliably, on `braid/0074-the-board-pauses-and-resumes-reliably-no`): shares the pause targets and the board's T3 snapshot; 0074 owns the pause texts, the `Paused:` reply and the limits.md pause and resume sections, which 0060 doesn't edit. 0074 merges into `main` first.
- Related to 0072 (Questions say what they unblock, on `braid/0072-questions-say-what-they-unblock`): 0072 edits the ask sections of the skills and the requests. 0060/C changes one line there: the "Say waiting" line of "Talking to the user" in the braid skill (an item PR watch now wakes the coordinator). 0072 merges into `main` before 0060; 0060 merges `main` in before its final PR and keeps 0072's wording around that line.
- Related to 0011 (Reports and several agents, Outline on `main`): its parallel workers will be launched this way.
- No spike strand: the outline's spike questions were answered by the measurements above [S8]-[S10]; the live trial is the last Completion box.

## Out of scope

- Launching coordinators (the PM's `t3_thread_launch`) through `braid launch`.
- The pause and resume texts and the steering code (0074), the request and ask sections (0072).
- Open thread by T3's link in the page instead of the server's open action (leftover 2026-11-24-90kb, P14).

## Completion

- [ ] `braid launch` prints the `delegate_task` input for a worker, reviewer and researcher, and records the child; the braid skill's launch prose uses it (0060/A, 0060/C)
- [ ] A subagent worker shows on the board and in `braid status` as running, with an Open thread link to the child, counted by stalls and limits, and is a pause target (0060/B)
- [ ] `braid clean` removes a subagent worker's checkout and `t3/` branch after the merge (0060/B)
- [ ] The braid, braid-worker and braid-reviewer skills and their references are shorter in total than on `main` at the planning commit (line count), with D69, D75 and D77 amended in the decisions record (0060/C, 0060/D)
- [ ] Docs from BRAID.md `docs` are true for subagent workers (0060/D)
- [ ] The docs strand ran as a subagent worker launched with the braid branch's `braid launch`, and showed on the board as running with a working Open thread link
- [ ] The gate command from BRAID.md passes on the final PR

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
