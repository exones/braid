The skills now launch every subagent the same way and the coordinator, not the worker, waits on an item PR's CI.

**What changed**

- `braid` skill: a new section "Launch a subagent" (four steps: `braid launch <id> --role … --thread <id>`, `delegate_task` with its JSON, `braid launch … --child <id>` plus `link_pull_request` for a reviewer, end the turn) replaces the researcher passage in "Plan" step 2, the worker launch and first message in "Run an item" steps 1-2, and the reviewer launch, record, wait and first message in "Accept and hand over" step 1. "Run an item" step 3 is now the worker's result and the CI wake: pending, watch the PR and end the turn; failed, to the worker's child; green, review (with `review-bots`, the worker first handles the bot threads); a failed run gets one `continue`; a wake nobody started is checked and acted on only on a change. The watch rule shortens to "watch every PR you wait on; unwatch at the handover or after the merge"; the handover step unwatches; "After the merge" cancels a worker task like a reviewer's; "Fixes" and "Say waiting" follow. "Project facts" leaves model resolution to `braid launch`.
- `braid-worker`: switches T3's checkout to its branch, takes its thread id from `orchestrator_capabilities`, talks to the coordinator only by ending its run (no `t3_thread_send`); "Deliver" steps 3-5 become one step (read the checks once, end the run with the report, last line `PR <url>, head <sha>, checks <state>`) plus one paragraph for follow-ups (red CI, review findings, review bots after green). Growth proposals end the run too.
- `braid-reviewer`: its result is returned by T3 only, never also sent with `t3_thread_send`.
- `references/workflow.md` ("Starting the next item", "Checks and reports", two "Failure modes" rows), `references/limits.md` ("Check before launch": the check runs in `braid launch`; only exit 3 remains), `references/autonomy.md` (merge condition 1 no longer says "the worker reported green").
- `src/commands/launch.ts`: the worker's and reviewer's first messages no longer say "Send your result to thread …", which asked for the second report by `t3_thread_send` that the braid removes; the worker's says its final message is its report. `test/launch.test.ts` checks it.
- `docs/decisions.md`: D107 (workers as subagents, the coordinator watches item PRs, spikes too), amending D69, D75 and D77, with a note on each of those rows and a decision log line.
- `docs/getting-started.md`: workers are subagents launched with `braid launch`; with review bots the coordinator watches CI on the new head.

**Why**: T3 children can't watch a PR and are told never to; T3 wakes the coordinator whenever a child's run ends, so the coordinator owns the CI wait (0060 S8-S10). One CLI call replaces three launch passages (programme P8: shorter skills, reliable calls).

**Line count** (the braid skill with its references and `assets/brief.md`, braid-worker and braid-reviewer): 716 before (main at 15da4fd2, unchanged at 677e852d), 698 after.

**Validation**: `npm run verify` (gate); see the PR for the run. `braid check` passes.

**Docs**: `docs/decisions.md` and `docs/getting-started.md` updated; `docs/cli.md` and `docs/board.md` already describe `braid launch` and recorded worker children (0060/A, 0060/B); README, `docs/autonomy.md`, `docs/braids-format.md`, `docs/roadmap.md` unaffected by this strand. The docs strand 0060/D checks them as a whole.

**Open**: none.

Decisions: none from the user. Mine: the "Send your result to" line in `braid launch`'s messages dropped (absorbed: two lines of code, else the first message contradicts the skill and causes the double wake the braid removes); a failed worker run gets one `continue` to the same child before a relaunch.
For later items: 0060/D: the researcher's message from `braid launch` still has a fixed 20-minute time box and "the plan of <id>"; the skill now says to set them in `task`.
Needs the user: none
