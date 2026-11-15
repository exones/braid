# 0015/A report: how the board sees the coordinator

## Short answer

1. **Telling the coordinator from a worker.** T3 has no field for it. `parentThreadId` is set only for provider subagents and `delegate_task` threads. `t3_thread_launch` with `delegatedFrom` leaves it null (probed below). braid's own layout settles it instead: in a goal, only the coordinator works on the braid branch. Workers work on strand branches, and reviewers sit on detached worktrees. **So a thread that joins a braid key, for a braid that has strands, is its coordinator.** Today's join rules (`readT3`) already produce that key, so nothing new has to be recorded.
2. **Seeing that it waits for the user.** Use T3's thread state, with braid's own state to rule out the other kinds of waiting. The coordinator waits for the user when all of these hold:
   - its thread is `completed`, not `settled` and not `snoozed` (T3's inbox),
   - no agent thread of the braid is running,
   - no braid or strand PR has checks still pending.

   The reason is `merge PR #N` when an open, green PR of the braid waits, otherwise `coordinator waiting`. A coordinator that is running with `pendingRequestCount > 0` gives `question`. The state clears without anyone setting anything: the user's answer starts a new run (`running`), or the user settles or snoozes the thread. The addendum confirms it: waiting for a worker, under a PR watch and under `t3_background_wait` all read `completed`, `activeRunId: null`, unsettled, with no field that tells them apart. The guards are required, and background waits must stay in the foreground.

Nothing has to be remembered, and it works for any provider T3 runs. The hooks, state files, GitHub labels and `stop:` labels I looked at are less reliable, cover fewer providers or cost more (comparison below). Two small requests to T3 would make the rule exact. For stories, the coordinator is not on the item's branch, so a story-level signal needs one recorded thread id (strand D, optional).

## Evidence from the live T3 (v0.1.6, 2026-11-15 09:39–09:45Z)

**Coordinator.** `t3 thread show mcp:launch:5d80964a… --json` (`.thread`):
`status: completed`, `activeRunId: null`, `createdBy: agent`, `creationSource: mcp`, `parentThreadId: null`, `relationshipToParent: null`, `pendingRequestCount: 0`, `settled: false`, `snoozed: false`, `linkedPullRequest: null`, `pullRequests: [46 PRs, #39…#93]`, `branch: null`, `worktreePath: C:\worktrees\agento\epic-008-braid-backlog`, `runCount: 384`.
`git worktree list` shows that path on `braid/0015-needs-you-when-the-coordinator-waits`. The board's worktree join (`keyOfBranch`) therefore gives key `0015`.

Its title is "Braid: braid skill on Backlog.md": one long-lived thread that runs braid after braid. Its worktree branch follows the current braid. This is the only thread joined at key `0015`.

**It was `completed` while waiting for me, not for the user.** It launched this worker at 09:39:35, and its run ended at 09:39:47. So `completed`/unsettled on its own also means "waiting for a worker" (or for CI on a watched PR). This is why the rule needs the "no agent running, no checks pending" guards.

**Project threads.** `t3 thread list --project C:/code/agento --json` returned 124 threads (subagents hidden):

| status / createdBy / source / parent / settled | count |
| --- | --- |
| running / agent / mcp / none / unsettled | 1 (this worker) |
| completed / agent / mcp / none / unsettled | 3 (coordinator, two reviewer threads of 0014) |
| completed / agent / mcp / none / settled | 102 |
| completed / user / web / none / unsettled | 1 (a user chat, not braid) |
| completed / user / web+mobile / none / settled | 9 |
| interrupted / agent+user / … / settled | 5 |
| cancelled / agent / mcp / none / settled | 3 |

- No thread in the CLI list has a parent. Every worker, reviewer and coordinator has the same `createdBy: agent`, `creationSource: mcp`.
- Workers end up `settled`, because a merge of the linked PR settles them. The two unsettled reviewer threads have worktrees `C:\worktrees\agento\review-0014` and `…review-0014-D`, which are gone from `git worktree list`, and `branch: null`. They join no item, so they don't trigger the rule. Reviewers are made on detached worktrees (skill, "Accept and hand over"), so even a live one has no branch to join.
- The CLI `list` gives no `worktreePath`/`branch`. Joining by worktree needs `show`, as the board does now.

**Subagents do get a parent.** `t3_thread_list` (MCP) with `includeSubagents: true` showed:
- `"Find what locks old worktrees"`: `creationSource: provider`, `parentThreadId: mcp:launch:5d80964a…`, `relationshipToParent: subagent`, `status: idle`, `settled: false`;
- `delegate_task` threads (`thread:delegated-task:…`): `relationshipToParent: subagent`.

The MCP status filter also offers `idle`, `waiting`, `failed`, `rolled_back`. No braid thread had `waiting`, so I couldn't tell what sets it.

**`delegatedFrom` probe.** I made one idle test thread with `t3_thread_launch`: no message, no workspace, `delegatedFrom` = my own thread. `t3 thread show` and `t3_thread_read` both gave `parentThreadId: null` and `relationshipToParent: null`, and the thread showed in the CLI list like any top-level thread. I then archived it. It had no run and no folder. The option "launch workers with `delegatedFrom` so they become children" therefore **doesn't work in T3 0.1.6**.

**Pending requests.** `t3_pending_request list` on the coordinator gave `{"requestIds": []}`, matching `pendingRequestCount: 0`. Per "Already decided", a question asked with the question tool raises the count while the thread runs. The board already reads it for running threads (`show` → `pending`).

**Board code.**
- `readFresh` keeps only `running`, `interrupted` and `cancelled` threads, so the waiting coordinator (`completed`) is dropped today.
- In `toCard`, a braid with strands takes its lane from its strands only. A thread joined at the braid key then only sets `running` (the wrench), so the coordinator can't be seen. That was the 0014 confusion.

**T3 inbox and watches.** The skill already unwatches a PR at every handover "because T3 keeps a watched thread out of their inbox" (SKILL.md, Run an item). So the inbox means completed + unsettled + unsnoozed + not watching. The watch state is not in `thread show`/`list` JSON (I checked all fields), so the board can't read the last part. The "checks pending" guard stands in for it: the skill watches only while CI or a worker runs.

## Options compared

"Remembers" means the signal depends on the coordinator remembering to set and clear it.

| Option | Reliable? | Claude / Codex / Cursor | Build cost | Verdict |
| --- | --- | --- | --- | --- |
| A. Workers as children via `delegatedFrom` | Doesn't set a parent (probe) | n/a | needs a T3 change | No, unless T3 adds it |
| B. Braid-key join = coordinator (goals) | Structural; nothing to remember | all (T3 thread data) | small: a role on `T3Thread`, used in `derive`/`toCard` | **Yes** |
| C. Idle coordinator = waiting (`completed`, unsettled, unsnoozed) + guards | High. Brief false Needs You only in the seconds between a worker's report and the coordinator's wake, or when a watch waits on something other than CI | all | small to M: read unsettled completed threads, a few more `show` calls (cached) | **Yes** |
| D. Question tool for every stop (`pendingRequestCount`) | Remembers (the skill already asks it, line 26). A merge request as a question holds the run open for hours, and watch wake-ups queue behind it. Plain-chat stops are missed | Claude has AskUserQuestion. Codex and Cursor question support in T3 is uneven | none in the board (rule 2 exists) | Keep as the `question` reason, not the main signal |
| E. `stop:<key>` label set/cleared | Remembers both ways. A forgotten clear leaves a stale Needs You. Needs a commit on the braid branch | all | small | No; the `ask:` flag already gives the key |
| F. Harness hooks (Claude `Stop`, `Notification`/`idle_prompt`; Codex `Stop`, stable since v0.124; Cursor `stop`, `afterAgentResponse`) | Fires on **every** turn end, so it says no more than T3's `completed`. The hook can't tell "waiting for a worker" from "waiting for the user". AskUserQuestion reportedly fires no hook. Cursor CLI and cloud agents reportedly skip `stop` | three configs, three payloads, plus Windows quirks | M–L: a per-provider script, installation into each provider's settings, and a state file | No: duplicates T3 at higher cost |
| G. State file the coordinator writes (`.braid/` or the braid folder), e.g. from `braid recap` | Remembers to set, unless tied to `braid recap` (run at every handover). Clearing can be automatic: the file stores the coordinator's `latestRunId`, and a new run voids it. Plan questions come before any PR, so no recap covers them | all | M: a write path shared across worktrees (git common dir), a reader in the board, a skill line | Possible add-on for a precise reason; not needed for the lane |
| H. GitHub: label (`needs-user`), draft, review request | Remembers both ways, and only when a PR exists (not plan questions). The user can't be asked to review their own PR: agents open PRs as the user's account. Draft means "not ready", not "waiting" | all | small (`gh pr list` adds `labels`) | No. A merge request already shows To Review |
| I. T3 inbox via MCP (`t3_thread_list settled:false`, `t3_pending_request`) | Same data as the CLI (`settled`, `pendingRequestCount`). MCP tools need an agent session, and the board is a plain process | all | none extra; use the CLI | Same as C |
| J. T3 adds a `watching`/`inInbox` field or a settable `awaiting-input` status | Exact for C; no guards needed | all | T3 change, then trivial | Ask T3 for it; C works without it |

**How others mark "waiting for a human".**
- **Linear agent sessions** have the states `pending`, `active`, `awaitingInput`, `error`, `complete`, `stale`. The state follows the last activity the agent emits: an `elicitation` activity asks the user, a `response` activity ends the turn. That is the agent emitting a typed event, like our question tool (D) or the T3 field in J. Linear also keeps a plain `complete` for "finished, look at it", as C does.
- **LangGraph** `interrupt()` and durable-workflow human-in-the-loop (Temporal signals) also make the wait an explicit, typed state of the run, not something read off idleness.

So the pattern is a typed "awaiting input" event. In T3 that is the pending request. The idle-thread rule (C) is the fallback for the many waits that are plain chat. It is the only option here that needs no memory and no per-provider setup. One gap remains, and it is shared with T3's own inbox: idle does not say *why*. That is why C derives the reason from braid state (open green PR → merge; otherwise coordinator waiting), and why `ask:<key>` flags already on strands show the stop key.

## Recommendation

**B + C, with D kept as the `question` reason.** Optionally J as requests to T3, and G only if the user wants precise reasons for non-merge stops.

Board rules (in `derive`/`toCard`, for a braid with strands):
1. A thread joined at the braid key is the coordinator. Its running never makes the braid Working, and it never sets a strand's wrench. Show it apart, e.g. its own icon or the hover "coordinator running".
2. Coordinator `running` with `pending > 0`: the braid goes to Needs You, `question`.
3. Coordinator `completed`, not settled, not snoozed, no running thread on any strand, no braid or strand PR with pending checks: the braid goes to Needs You. The reason is `merge PR #N` if an open PR with green checks exists (strand, or the final PR), otherwise `coordinator waiting`.
4. Otherwise the lanes come from the strands, as today.

**Needed from the skills:** one rule: long waits run in the foreground, never under `t3_background_wait` with the turn ended (addendum). Otherwise none for B/C. They rely on what the skill already says:
- the coordinator works in a checkout on the braid branch;
- it unwatches at every handover;
- it asks with the question tool when it has one;
- reviewers run on detached worktrees.

Write down as a rule, in the build PR's docs: the coordinator must not settle or snooze its own thread while it waits.

**Needed from T3** (asks, not blockers):
- (a) a watch flag (`watchedPullRequests` or `inInbox`) in `thread show`/`list`, which would remove the CI guard;
- (b) `delegatedFrom` setting `parentThreadId` with `relationshipToParent: delegated`;
- (c) what sets status `waiting`; (d) pending background or delegated work in `show`/`list` (addendum).

**Stories:** the coordinator sits outside the story's branch, so B can't find it. A story's merge request already shows To Review. Its stop cases and plan questions would need the coordinator's thread id recorded once per item. That is strand D, only if the user wants it.

## Addendum: waiting states observed

The user approved this addendum on 2026-11-15. The coordinator put itself in three waiting states, one at a time. I read it from outside after each run had ended: `t3 thread show <id> --json` three times about 35 s apart, `t3_thread_read` (with `recentRuns`), and `t3_thread_list` with each status filter.

| State (coordinator's last run) | `status` | `activeRunId` | `settled` / `snoozed` | `pendingRequestCount` | in list filter | anything new |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Waiting for a worker (run 389 ended 10:09:31Z; reads 10:09:38–10:11:10) | `completed` | null | false / false | 0 | `completed` only; not `waiting`, `idle` or `running` | none: same 30 fields |
| 2. Under a PR watch on #94 (run 390 ended 10:11:18; the watch woke it at once for "all 2 checks passed", run 391 ended 10:11:32; reads 10:11:22–10:12:47) | `completed` | null | false / false | 0 | `completed` only | none: same 30 fields. #94 appears in `pullRequests` as `open`, `linkedPullRequest` stays null, no watch field |
| 3. With `t3_background_wait` on a 15-minute background sleep (run 392 ended 10:13:06; reads 10:13:11–10:14:30) | `completed` | null | false / false | 0 | `completed` only | none in `show`, `list` or `read` |

The CLI's text form (`t3 thread show --messages 1`) also prints just `completed` for state 3.

Only one call told state 3 apart:
- `t3_thread_wait` with `timeoutMs: 60000` returned at once: `status: completed`, `timedOut: false`.
- The same call with `untilDelegatedWorkSettled: true` ran for 60 s and returned `timedOut: true`.

So T3 knows about the background work, but `show`/`list` don't expose it. `t3_thread_wait` accepted `timeoutMs: 3600000` and `7200000` without error. On a finished run it returns at once, so I couldn't see whether it clamps them. The tool's own description says `t3_background_wait` "keeps this thread in Working" and is "Claude only". That Working state is not in any field I can read.

**A watch wake is a run.** Starting the watch on a PR whose checks had already passed woke the coordinator at once: a short extra run (391, 14 s) that showed as `running` and then `completed` again. Every watch event does the same. A board that reads the coordinator during a wake sees it running. That is harmless under rule 1 (a running coordinator never makes the braid Working), and it leaves Needs You for those seconds.

**What it changes.**
- "Waiting looks finished" is now certain. All three waits look exactly like waiting for the user in everything the CLI shows. So rule C must keep its guards: no running agent, no pending checks. T3's `waiting` and `idle` statuses never appear for this thread, so they are no shortcut.
- The watch is invisible. The "no pending checks" guard remains the only stand-in for "waiting on CI". A watch that waits for comments or a merge can't be told from waiting for the user, but the skill unwatches at every handover, so a watched PR in a handover is a skill bug.
- A background wait is invisible to the board, which would show **Needs You** while the coordinator sleeps on a task. The skill's long waits (`braid done --merge` polls for up to 30 minutes) must therefore run in the foreground, where the run stays `running`, or the board needs T3 to expose background work. The board can't call `t3_thread_wait`: it's an MCP tool, and the call blocks.
- T3 request (d): show pending background or delegated work in `thread show`/`list`, e.g. a `backgroundTaskCount` or the "Working" flag `t3_background_wait` sets. With (a) the watch flag and (d), the idle rule becomes exact without guards.
- The recommendation is unchanged: B + C, with D as `question`. Strand C gains one acceptance line, and the skill one rule (below).

## Proposed build strands

- **B. Board: mockups for the coordinator's states** (S, `ui`). Covers the icon and hover for "coordinator waiting", "merge PR #N" and "coordinator running" on the demo data. Acceptance:
  - [ ] mockups of a braid in Needs You for each reason, and of a running coordinator that isn't Working;
  - [ ] the user approved them.
- **C. Board: coordinator role and waiting rule** (M), after B. Acceptance:
  - [ ] `readT3` keeps unsettled, unsnoozed `completed` threads and marks a thread joined at a braid key (braid has strands) as the coordinator;
  - [ ] the rules above, tested with fake T3/GitHub data for: waiting for a worker (Working), for CI (no Needs You), for a merge (`merge PR #N`), for an answer (`coordinator waiting`), a question (`question`), and after a new run or a settle (cleared);
  - [ ] the coordinator's running never shows a strand as Working;
  - [ ] a watch wake (a short `running` run) never puts the braid in Needs You;
  - [ ] `braid status` prints the same reason;
  - [ ] `docs/board.md` (rules, icons, "Where the states come from") and a decision in `docs/decisions.md` updated.
- **D. Optional: stories' coordinator** (S). Acceptance:
  - [ ] `braid start <id> --thread <id>` records the coordinator for the item;
  - [ ] the board applies rule 3 to a story with that thread.
- **Not a strand:** file the T3 requests (a)–(c) above. That's the user's call, since it is outward.

## Validation

- Every field above came from the commands named, run from this worktree against the live T3 and `git worktree list` of `C:/code/agento`.
- One test thread was created idle, with no message and no folder, and was archived.
- No other thread was changed or messaged.
- Hook and orchestrator facts come from public docs and reports, which I did not run:
  - Codex hooks (OpenAI docs, v0.124 stable);
  - Cursor hooks docs and forum reports;
  - Claude Code hooks docs and issue reports (AskUserQuestion fires no hook; `idle_prompt` timing disputed);
  - Linear agent-interaction docs.

## Open

- What sets T3's `waiting` status is unknown; none of the three observed waits used it.
- I didn't verify whether a Codex or Cursor coordinator's question raises `pendingRequestCount` the same way.
- The worker-to-coordinator wake gap is seconds. On a 30 s refresh it rarely shows; C's tests should cover it.

For later items: `delegatedFrom` does not set a parent in T3 0.1.6, so don't plan on it. Reading `completed` threads makes the board's `show` cost grow with the number of unsettled threads, which is 4 here.
Needs the user: scope: choose B + C (and whether D and the T3 requests); architecture: the board treats the braid-key thread as the coordinator and adds two Needs You reasons.
