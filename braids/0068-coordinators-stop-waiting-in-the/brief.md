---
id: '0068'
title: "Coordinators stop waiting in the foreground"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0064', '0060']
delivery: epic
autonomy: free
---

## Goal

The braid coordinator stops blocking in foreground waits, so a message from the user or the PM is answered within the turn it arrives in, not after a wait of up to 10 minutes per call. After this story the coordinator ends its turn after every launch, fix request and merge, and is woken only by events: the worker's report (`t3_thread_send`), a `delegate_task` result, a PR watch, or an incoming message. A user can try it: while a worker runs, write to its coordinator and get an answer at once.

Expected size: about 60 changed lines in 7 files, nearly all text (skills and docs).

## Start here

- `.agents/skills/braid/SKILL.md`: "Run an item" step 3 (**Wait**: `t3_thread_wait` on the worker's thread, `timeoutMs: 600000`, looped, "Run nothing else in parallel with it"), step 4 (**Coordinator habits**: the "STOP during a wait" line), "Accept and hand over" step 1 (the reviewer is already waited for by its `delegate_task` result; keep it), "Fixes", "Finish", and "Talking to the user": "Say waiting only when something will wake you" lists `t3_thread_wait` and a foreground `braid wait`.
- `.agents/skills/braid/references/autonomy.md`: "Merging" step 4, the foreground `braid wait <number> --timeout 9` after each strand merge, called again until CI ends.
- `.agents/skills/braid/references/workflow.md`: "Checks and reports" (the coordinator "waits only where a wake is reliable").
- `docs/decisions.md`: D71 and D77 (the waits this replaces, and why the background wait was dropped).
- `docs/braids-format.md` (the `braid wait` paragraph), `docs/cli.md` (its row), `docs/autonomy.md`, and the comment at the top of `src/commands/wait.ts`: they describe `braid wait` as the coordinator's foreground wait.
- `src/commands/wait.ts`: how a short `--timeout` behaves (it reads the checks, returns 3 "still running" at the limit, and 2 only when no run appeared within 5 minutes of the call's start, or on an error).

## Change

- `.agents/skills/braid/SKILL.md`, "Run an item" step 3: no `t3_thread_wait` on a worker. After launching a worker or sending it fixes, end the turn; the worker's report wakes you. Keep the checks for a wake without a report (a nudge from the user or the PM, the board's `stalled`): read the thread's last message and `gh pr checks`, then the existing cases (worker on its PR watch, green, merged, failed checks are the worker's, nudge, retry once, the user says it finished). Remove "Run nothing else in parallel with it" and the STOP-during-a-wait habit (or reword it for any wait that remains). A message from the user or the PM while agents run is answered at once, then the turn ends again.
- `.agents/skills/braid/references/autonomy.md`, "Merging" step 4: after a strand's merge, start the next item without waiting for the braid branch's CI. Read that CI without blocking, with `braid wait <number> --timeout 0.25` (one short read: exit 3 "still running" is no failure; exit 2 at that length is an error, handled as today), at two points: at each later wake before reviewing or merging the next strand, and before "Finish" step 1 (the final PR). Exit 1 at either point: "Fixes" (a tier S fix strand, run before the next item; a second red is a `quality` stop). Still running before the final PR: open it anyway; its CI, on the same code merged with `main`, is watched, and the final handover waits for it to be green, so a red braid branch is caught before any merge into `main`.
- `.agents/skills/braid/SKILL.md`, "Fixes" and "Finish" step 1: name those two read points, so a red braid branch is found also after a strand the user merged.
- "Say waiting only when something will wake you" (SKILL.md, and workflow.md "Checks and reports" where it names the waits): only the worker's message, a PR watch, a `delegate_task` result, or the board's messages; no foreground wait in the list.
- `docs/decisions.md`: a new dated decision (the next free D number after `main` and 0064's D90) for this change, citing the user's words: foreground waits queue the user's and the PM's messages; the worker's report wakes the coordinator, and the board's stall detection covers a worker that never reports, so no other safety net. Add a dated note to D77 (and to D71's note where it names the foreground wait) that this decision replaces its foreground waits.
- `docs/braids-format.md`, `docs/cli.md`, `docs/autonomy.md` and the comment in `src/commands/wait.ts`: the coordinator calls `braid wait` in short reads at those two points; the command and its exit codes stay as they are.

## Already decided

- The user: "very annoying thing to fix almost immediately: now coordinator waits for subordinate threads in foreground. remove it, it puts arriving messages in the queue".
- The user, on what replaces the worker wait: "now we have workers wake the coordinator + board detects stale coordinator so we are covered". No new safety net: the worker's report wakes the coordinator, and the board's existing stall detection covers a worker that never reports.
- No background command with `t3_background_wait` (D77: it killed sessions), and no scheduled poll task.
- `braid wait` keeps its code, flags and exit codes; only the docs of how the coordinator calls it change. No new CLI command.
- The board reads PR checks only, not the braid branch's own CI. A red braid branch shows on the board as the fix strand the coordinator adds at its next read, and in the next strand's PR checks, which run on the merge into the braid branch. A board view of the braid branch's CI is not built here.
- Related to 0064 (The board watches provider limits, on `braid/0064-the-board-watches-provider-limits`): 0064/D already rewrote `references/limits.md` (its rewrite has no `t3_thread_wait`) and changed the same lines of SKILL.md "Run an item" step 3 and "Say waiting". Don't touch `limits.md`. Whichever of the two PRs merges into `main` second merges `main` first and keeps both: 0064's limits wording and this story's removal of the waits.
- Related to 0060 (Workers as T3 subagents, Outline): it builds on this later; nothing of it is planned here.
- The user merges this PR into `main` (a skill change), after the PM's go.
- The user, for every braid of the programme: "don't overblow skills, try to see how to make easier, don't create spaghetti states and lean more to realiable calls like with requests". For 0068 that means: the skill text (`.agents/skills/braid/`) comes out shorter than it went in. Removing the waits removes words and adds no new rules around them. Prefer one CLI call to prose the coordinator must remember: the braid-branch CI read is one `braid wait <number> --timeout 0.25` call at the named points, with little around it. No new state.

## Out of scope

- `references/limits.md` (0064's), and the board's code.
- The `braid-worker`, `braid-reviewer`, `braid-researcher` and `braid-pm` skills, unless one names a coordinator foreground wait (none did when planned).
- Launching workers as subagents (0060).

## Plan

1. SKILL.md "Run an item" step 3 becomes **End the turn**: no `t3_thread_wait`; the worker's report wakes the coordinator; messages from the user or the PM are answered at once; the no-report checks stay for a nudge or the board's `stalled`. The STOP habit is reworded for any tool call.
2. autonomy.md "Merging" step 4: next item starts at once; the braid branch's CI is read with `braid wait <number> --timeout 0.25` before the next strand's review or merge and before the final PR; exit codes mapped (3 go on, 1 Fixes, 2 ask).
3. SKILL.md "Fixes" and "Finish" step 1 name the two read points; "Say waiting" lists only event wakes; workflow.md "Checks and reports" says no foreground wait.
4. decisions.md: D91, notes on D77 and D71, decision log line. docs/braids-format.md, docs/cli.md, docs/autonomy.md and the comment in src/commands/wait.ts describe the short reads.
5. Gate, report, PR.
## Completion

- [x] `.agents/skills/braid/` has no foreground wait left for the coordinator: no `t3_thread_wait` on a worker thread, no looped `braid wait --timeout 9`, no "run nothing else in parallel"; `rg -n "t3_thread_wait|timeout 9|in parallel with it" .agents/skills/braid` finds none outside `references/limits.md`
- [x] "Run an item" says the coordinator ends its turn after a launch or a fix request, the worker's report wakes it, and a message from the user or the PM is answered at once; the no-report checks stay
- [x] After a strand merge the next item starts without waiting; the braid branch's CI is read in short `braid wait --timeout 0.25` calls before the next strand's review or merge and before the final PR, a red one goes to "Fixes", and the final PR's watched CI catches the rest before any merge into `main`
- [x] `docs/decisions.md` has the new dated decision and the notes on D77 (and D71 where it applies)
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Autonomy

PM-run (thread 9b3a8157-f696-45de-ac39-f35a4a90cf9b): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
