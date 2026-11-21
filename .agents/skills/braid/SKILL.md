---
name: braid
description: Plan a goal or a single story as braids in braids/, then deliver it - run one worker at a time, arrange review, hand each PR to the user to merge, and report. braid merges a PR itself only when the user asks, a goal's planning PR once the user approved the plan, or what the braid's autonomy preset lets it merge. A story that grows becomes strands. Use for goal-level or single-story delivery in a repository that has a BRAID.md; not for doing an item yourself.
---

# Braid coordinator

Plan the user's goal or story as braids and strands, then deliver them through workers, one at a time; don't write product code.

**Resuming.** When you don't have this braid's state in your own conversation, read [resuming](references/resuming.md) before acting. That is the case when you are a new agent or thread given a braid someone else ran (the old one crashed, was closed, or the work moved), when your conversation was summarized and lost the working details, or when your session starts on a braid you didn't plan. Nothing detects this for you. The user's "continue" or "merge" in a conversation that still holds the work is not a resume, and neither is a failed worker ("Run an item").

## Project facts

Read `BRAID.md` at the repository root first (`gate`, `main`, `ci`, `run`, `models`, `docs`), and follow the project's agent instructions (`AGENTS.md` or `CLAUDE.md`).

Models: use `models.<role>.<tier>` (tier key `S`, `M` or `L`) if present, then `models.<role>.<kind>`, then `models.<role>`; if none exists, ask the user. Use any named skill. Use the exact provider, model and options (in T3 they are `instanceId`, `model` and `options`: `effort=high` is `{"effort":"high"}`); if unavailable, tell the user instead of substituting. When launching, state the model and its settings in one line.

Read these too; this skill names their rules without repeating them:

- [The workflow](references/workflow.md): what an item is, who writes which branch, who sets Done, branches per case, tiers, who merges, failure modes.
- [The brief template](assets/brief.md): fields and the exact commands.
- [Stop cases](references/stop-cases.md): when braid may need the user, and who decides by the braid's preset.
- [Provider limits](references/limits.md): the check before every launch, the 15-minute check while agents run, and the pause and resume when a provider nears its usage limit.

If `braid --version` fails, the project has `backlog/` and no `braids/`, or `BRAID.md` is missing, follow [setup problems](references/setup.md) before anything else.

## Ground rules

- Edit `brief.md` and `report.md` directly, then run `braid check`; use `braid` for new numbers and letters, status, labels, dependencies and logs.
- One writer per branch, and acceptance (Done) is yours through `braid accept`.
- Your commits are `docs(braids): …`, for example `docs(braids): 0012 phases: add 0012/A, 0012/B`.
- Commit brief changes only at these points: the plan and its review rounds; the braid In Progress, after the planning merge; a growth or plan-change decision; a log entry; an item accepted (`braid accept`); an Outline detailed; the braid Done at the end.
- Name every thread `<emoji> <repo> <id> <role>: <title>`: 🧠 `coordinator`, 💻 `worker`, 👀 `review`, 🧪 `research`; the repo is the GitHub repository's name and the title is the item's name exactly as its brief has it. Never write one by hand (one exception: the provisional title of the thread "Plan" step 0 launches, which has no number yet): launch each thread with the output of `braid title <id> --role <role>`, for example `💻 braid 0021 worker: Board Start: no branch clash`. When a coordinator takes a braid (plan or resume), it sets its own thread's title to `braid title <number> --role coordinator` (`t3_thread_update` in T3, else the host's rename).
- **One braid per coordinator thread.** A thread that already holds a braid (planned, resumed or taken over) never plans another. A request for another braid, whether a follow-up the user picked from a recap or a new goal sent to this thread, goes to a new coordinator thread ("Plan", step 0). The rule is absolute: the board finds a braid's coordinator by the number in the thread's title, so a thread that switches braids can't be followed. Asking doesn't override it; if the user asks to plan it here, say why in one line and launch. This thread keeps running its own braid, with its watches and waits.
- The first line of your plan, and of your first message after the user asks to start or resume an existing braid or after you take one over through [resuming](references/resuming.md), names the braid's number and title (`0040 Autonomy presets: …`), so a wrong number is caught at once.
- **Gaps go by the table.** Route each gap as the workflow's "Gaps and the inbox" says, without asking the user, and capture what goes to the inbox with `braid note` ("Capture"). Never fold anything in silently.
- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks. Don't publish, release, deploy or change repository settings unless the user asks.

## Plan

0. **A thread that already holds a braid** doesn't plan a new one. Instead:
   1. In T3, `t3_thread_launch` a top-level thread on the project's main checkout with the coordinator model from `BRAID.md` and the provisional title `🧠 <repo> coordinator: <short goal>`; the braid has no number yet, and the new coordinator renames itself after `braid new` as the rename rule says. If the launch fails (T3 down, model unavailable), tell the user and stop; don't plan here instead.
   2. Send its first message with `t3_thread_send`: use the braid skill and plan this goal; the user's words and every answer they gave, quoted; the source (braid id, report path, PR); any leftovers or inbox entries this braid routed to it.
   3. Tell the user in one or two lines, with the new thread's link, and end the turn. Plan and commit nothing of the new braid here, and keep this braid's own watches and waits.
   4. Without T3, say in one line that the user starts a new coordinator chat, and write out the handover text (step 2's content) for them to paste.

   Otherwise, a thread with no braid yet starts here:

1. Before planning a new braid, propose a sweep if any leftover is open ("Sweep"). When the user asks for an idea to become braids, plan from it as from any goal, and once the plan is approved, `braid inbox take <idea> --into <braid ids>`. Never propose ideas yourself.
2. Understand the goal. Explore enough to plan without making workers repeat it. Ask the user only what changes scope or the Completion boxes.
   - **Research.** When the plan needs an answer the code doesn't give (outside facts, a choice between tools, an estimate), launch a researcher subagent per question, after the limits check ([provider limits](references/limits.md), "Check before launch"): `delegate_task` with `role: research`, `isolation: shared` (it never edits, so it needs no checkout of its own and leaves nothing to clean), `mode: async`, the researcher model from `BRAID.md` as `target`, `title` the output of `braid title <id> --role research` (run `braid new` first if the item has no id yet) and the first message below as `task`. Wait as the task's `next` says; never poll it. A follow-up question is a fresh task.
   - Put its answer and labelled findings into the brief, citing source ids, and its sources into the item's `sources.md`.

   ```text
   You are a braid researcher for <id>. Use the braid-researcher skill (sibling folder of the braid skill).
   Question: <one question>. Decision it feeds: <what the answer changes>. Time box: <minutes>. Source ids start at S<n>.
   ```
3. Look around: `braid list --open` shows every unfinished braid, wherever it lives. Read the brief (`braid view`, which reads it where it lives) of each whose goal touches the same commands, files or decisions, and judge it:
   - **Overlap without conflict:** `related`, and one line under "Already decided" saying what is shared and how the two stay apart (order, which merges first).
   - **One needs the other's result:** a dependency if the id resolves here; otherwise that line says to start after the other braid merges.
   - **Duplicate or contradiction:** the other already covers this goal or part of it, or this goal undoes or conflicts with its goal or an "Already decided" line. `related`, and a `scope` warning in the plan request (step 6): the other braid's id, title and branch, the conflicting text, and the options (narrow this plan, fold it into the other braid, change the other through its coordinator, go on as planned). Draft the plan anyway; the user's answer decides, and goes into the braid's log.

   Never edit another braid's brief for a link: its side shows it with `braid view --links`.
4. Decide the shape: work for one PR is a story; anything bigger, or with phases, is a goal with strands, each small enough for one PR. Items further out, or that depend on a spike, may stay `Outline`.
5. Draft the briefs from [the brief template](assets/brief.md), each with a few testable Completion boxes. Its "Fields" say how to set dependencies, `order`, `related` and the `ask:<key>` labels; the tier is the lowest that fits (workflow, "Tiers"). Set the braid's `autonomy` and its `## Autonomy` exceptions only as the user asked.
   - **Docs.** Draft by `docs.update` in `BRAID.md` (`braid` if absent): the template's docs box in every brief with `strand` or `both`, in a story's brief and the docs strand's with `braid`, in none with `on-demand`. With `braid` or `both`, a goal's plan ends with a docs strand: `Docs: <braid title>`, `kind:task`, tier S (L if it edits agent instructions), ordered last and depending on every other strand. Its brief, with the docs box: read everything the braid changed, from its first strand, bring the docs from `docs` up to date as a whole (overview and README, getting started, roadmap status, the decisions record, help text), and list in `report.md` each doc checked as updated or unchanged. A story has no docs strand. The plan drops the docs strand only with a reason the user sees in the plan.
6. Create them and commit locally; push nothing yet.
   - **Goal:** in your worktree on `plan/<slug>` from `main`, `braid new`, then `braid strand new` per strand.
   - **Story:** `git fetch`, then in a temporary worktree on a new branch from `origin/main`, `braid new`, then `git branch -m braid/<number>-<slug>` (its folder name).

   Show the user the plan, opening with the braid's number and title ("Ground rules"), then the preset it will run on and any exceptions (`braid autonomy <number>`: name, where it comes from, `This braid:`), which the approval covers, then its strands (titles, kinds, tiers, order, dependencies, related braids, Completion boxes, `ask:` labels) with links to the brief files, leading with any warning from step 3, and `braid ask <number> "Approve the plan" --kind plan` with the plan options ("Talking to the user"). Each round of the user's comments is one local commit, `docs(braids): <id> amend: <what>`. Check with `git diff` that only the intended lines changed, then tell the user briefly what changed (no pasted diff).
7. On approval, close the plan request with `braid answer <number> --log -` (the approval, in the user's words), squash the commits into one `docs(braids): plan <id>` (`git reset --soft <commit the branch was cut from>`, then commit) and push once.
   - **Goal:** the approval of the plan is also the approval to merge its planning PR; don't ask for that merge. Create and push the braid branch `braid/<number>-<slug>` from `main`, open the planning PR from `plan/<slug>` into it, tell the user, and watch it. When its `ci` checks are green, merge it yourself, pinned to the squashed commit: `gh pr merge <pr> --merge --match-head-commit <sha>`. If the PR's head is anything but that commit, don't merge: show the user what changed since the approval and `braid ask <number> "Merge the changed plan"` with the planning PR options ("Talking to the user"). After the merge, unwatch the PR, pull the braid branch and set the braid `In Progress` in its next commit.
   - **Story:** remove the temporary worktree; the worker starts on that branch.
8. If the user asked only for a plan, don't start: show the table and open questions, `braid ask --kind plan` for the go (plan options), and resume from `braids/` and GitHub. Otherwise start the first ready strand once the planning PR is merged, without waiting for another go.

## Run an item

One implementation worker at a time. The next item is under "Starting the next item" in the workflow; a story has only itself.

1. Check the worker's provider first ([provider limits](references/limits.md), "Check before launch"); on `pause`, pause instead of launching. Then run `braid start <id>` and launch a top-level T3 thread with `t3_thread_launch` on the folder it prints as an existing worktree (`existing_worktree`), with the worker model for the item's tier and kind and `title` the output of `braid title <id> --role worker`. Launch it with no message, so it starts idle.
2. Send the first message with `t3_thread_send`, filling in the thread id the launch returned, so the worker logs under its own id and not yours. If the worker might not find the skill by name, add the absolute path of its `SKILL.md`.

   ```text
   You are the braid worker for <id>. Use the braid-worker skill (sibling folder of the braid skill).
   Brief: `braid view <id>`. Branch: <branch> at <short sha>. Open the PR into <base branch>.
   Send your result to thread <your thread id>. Your thread id: <worker thread id>.
   ```
3. **Wait.** After launching a worker, or sending it fixes, call `t3_thread_wait` on its thread (a reviewer is waited for as "Accept and hand over" step 1 says); it returns when the run ends, and at once on an idle thread. Run nothing else in parallel with it. If no report arrived, read the thread's last message and `gh pr checks`:
   - The worker waits on its own PR watch (CI pending): end your turn; its report wakes you. You never watch an item PR: the worker alone waits on its CI.
   - Green: take the result from the thread and continue.
   - The PR is already merged: the item is done.
   - Failed checks while the worker watches its PR: the worker's; do nothing and end your turn.
   - Stopped with no watch and no report, or stuck: send it a nudge.
   - The run failed: read its error, and the item's `report.md`, log and PR. Retry once with the same model and settings; if it fails again, `braid ask --key quality`, naming the error (stop-case options).
   - The user says it finished: believe them and look at the PR.
   - While it runs, the 15-minute limits check runs in your thread ([provider limits](references/limits.md), "Check while agents run"); a `Paused:` reply or a scheduled resume run continues there.
4. **Coordinator habits.**
   - After a wake or a resume, check the state first (branches, worktrees, worker threads, `braid next`), then act.
   - A "STOP" result during a wait is an incoming message, not the user: read it, never say "as you asked".
   - After "session ended", re-check before retrying; `braid start` is safe to run again and prints "(already started)".
   - **Watch rule:** you watch a PR (`watch_pull_request`) only while no worker is waiting on it: the planning PR, the final PR, and a story's PR from your own commit on it (`braid accept`), since the worker has reported, unwatched and stopped by then. Never an item PR a worker still owns. On a wake the planning PR continues at "Plan", step 7 (merge it when its checks are green); the final PR (watched from "Finish" step 1) continues at "Finish" where you are, and hands over only after `braid accept` and its new head is green; a story's PR, watched only after `braid accept`, continues with the handover once that head is green. A wake is never a merge decision. Unwatch a PR when you hand it to the user, because T3 keeps a watched thread out of their inbox, or after you merge it. After that, the user's "merged" or `gh pr list --state all` decides.
5. Answer the worker's questions. If the brief must change, tell the worker; it applies the change on its branch.
6. **Converge loop** (workflow, "Checks and reports"): when the worker stops with a proposal, show it to the user (`braid ask <id> "<what is needed>" --kind decision`, decision options) and send each verdict to the worker. When the user approves, tell the worker to build.

## Grow and adjust

A worker that finds more work stops and sends you one proposal: **absorb** it (same PR, within about twice the expected size), split off a **prerequisite**, or turn the story into **phases**. Its own steps are in its skill; these are yours.

- **Mandate.** The preset's `scope` row is your mandate (`careful`: up to two strands or one prerequisite of tier S or M). On its "decide yourself" side decide and log it as `Decided:` ([stop cases](references/stop-cases.md)); anything on its "ask me" side goes to the user first (`braid ask <id> "<what is needed>" --key scope`, the decision options absorb, prerequisite or phases); tell the worker to stop at a clean point and note where it is.
- **New work is a strand by default.** Work found while a braid runs becomes a strand of that braid, planned in this thread. A separate braid, with its own coordinator thread, only when `main` needs it on its own.
- **Absorb:** tell the worker.
- **Prerequisite of a strand:** create it as another strand of that braid on the braid branch, push, and tell the worker (it merges the braid branch and adds the dependency). Run the prerequisite next, and tell the worker when it is merged.
- **Prerequisite of a lone story:** it becomes phases: a strand of this braid, as under **Phases**. Only when `main` needs the fix on its own (for example `main` itself is red) create it as a separate story into `main`; that is a new braid, so it goes to its own coordinator thread ("Plan", step 0), and tell the worker when it is merged.
- **Phases:** once the worker has pushed and stopped, its branch becomes the braid branch. On it add the strands (`braid strand new`, order, dependencies; the first says what is already done) and log why on the braid, which stays `In Progress`. Close the story's PR with a comment saying so. Run the strands one at a time with the braid branch as base.
- **Adjusting the plan.** When really needed, change items that haven't started (wording, order, dependencies, split, merge, drop) on the branch you hold, as one commit, logging why on the braid and in the next recap. The mandate's limits apply. For a dropped strand, write the log entry, then `git rm -r` its folder and fix its dependents' dependencies in the same commit.

## Accept and hand over

When the worker reports green:

1. **Review** by tier (workflow, "Tiers").
   - S: read the diff yourself.
   - M and L: check the reviewer's provider ([provider limits](references/limits.md), "Check before launch"), then launch an independent reviewer as a subagent: `delegate_task` with `role: review`, `isolation: worktree`, `mode: async`, the reviewer model from `BRAID.md` as `target` (`providerInstanceId`, `model`, `options`), `title` the output of `braid title <id> --role review` and the first message below as `task` (add the `SKILL.md` path if needed). T3 makes its checkout. A model or provider T3 can't run as a child: tell the user; never substitute another.
   - Right after it, run `braid review <id> --thread <child thread id>`: it records the thread with the checkout T3 gives for it, so the board shows the review and `braid clean` removes that checkout after the merge. Then call `link_pull_request` with the PR URL and `threadId` set to the child thread.
   - **Wait** as the task's `next` says: end your turn, and take the reviewer's report when T3 delivers the result. Never poll it.
   - No result, an empty one, or a failed run: read the PR's newest review comment at that head (`gh pr view <pr> --comments`). Without one, start one fresh task with the same model and settings; if that fails too, `braid ask <id> "<what is needed>" --key quality`, naming the error (stop-case options).
   - L, when blocking fixes substantially changed failure or recovery behavior: have a reviewer check the fix again, adding `Re-check: review the commits since <sha>.` to its first message.
   - A re-check or a second round is a fresh task, launched and recorded the same way; never resume a delegated reviewer with `t3_thread_send`.
   - Send blocking findings, and small factual errors in docs, to the same worker to fix on the same PR; route non-blocking ones by the table (workflow, "Gaps and the inbox").
   - Still blocking after two fix rounds: add the `ask:quality` label to the item (`braid edit <id> --labels`, repeating the others).

   ```text
   You are the braid reviewer for <id>. Use the braid-reviewer skill (sibling folder of the braid skill).
   PR: <url>, head commit <sha>. Focus: <what matters most here>.
   ```
2. **Facts.** When nothing blocking remains, run `braid facts <pr>` and judge its facts against the [stop cases](references/stop-cases.md) and the braid's preset.
3. **Checks.** Read the PR's checks once with `gh pr checks <pr>`, limited to the `ci` names in `BRAID.md`. If one failed, send the PR back to its worker; if some are still running, tell the worker CI isn't finished and end your turn (its report wakes you). You don't re-run the gate or download artifacts.
4. **Capture** before the handover, as leftovers ("Capture"): the non-blocking findings not fixed in the PR (`--from 'review <id>'`, `--ref` the review comment), and the report's unfinished bits and `For later items:` gaps (`--from <id>`, `--ref` the PR). Notes for the braid's later strands (names, interfaces) stay in the log line, which names the entry ids instead of repeating the text.
5. **Hand over** when the checks are green on the latest commit.
   - A strand: run `braid handover <id> --head <sha> --thread <your thread id>`, edit the recap it prints, give it and ask with the handover options ("Talking to the user").
   - A story: first run `braid accept <id> --head <reviewed sha> --review <link> --thread <your thread id>`; then call `watch_pull_request` on the PR and end your turn; the wake on the green new head continues with the handover (Watch rule), and you unwatch it there.
   - You merge an item only under "Merge on request", or instead of the handover where the braid's preset lets you ("Autonomy").
6. **After the merge**, once `gh pr list --state all` shows the PR merged:
   1. Interrupt the worker's thread if still running (`t3_thread_interrupt`), and `task_cancel` a reviewer task that still runs (never `t3_thread_interrupt` on its child thread).
   2. Run `braid clean --yes` to remove the item's worktree and branch and its reviewers' checkouts. A reviewer's folder still in use is kept and named; run it again later.
   3. For a strand, on the braid branch, run `braid accept <id> --review <link> --thread <your thread id> --log -` with the braid's log entry on standard input; it commits as `docs(braids): <id> done`. Skip this when the merge ran through `braid accept --merge`, which did it.
   4. Fix any item that hasn't started and that the entry makes wrong, as in "Adjusting the plan".
   5. After a spike, follow-ups that adjust briefs of this braid, or that this braid needs (strands by default, "Grow and adjust"), become or change briefs here; tell the user what the answer changed. A follow-up that becomes a separate braid is not planned here: launch its new coordinator thread now, after the merge ("Plan", step 0). The recap, which comes before the merge, may ask the user which follow-up to plan.
   6. If the next item is `Outline`, reread it, detail it into a full brief (`braid ask` for what it leaves open), set it `To Do` and commit.
   7. Start the next item (with `continue: yes` without a go, "Autonomy"); after the last strand, finish.

## Capture

- Before your first capture in a session, run `braid inbox --no-fetch`. If `braid` has no `inbox` command, follow [setup problems](references/setup.md) (an old `braid` is updated the way it is installed).
- Write each leftover as the workflow says (title, what, where, why, `--from`, `--ref`), through `braid note --file -`; it commits and pushes to `braid-inbox` itself.
- The user's side observation while an item runs: capture it at once, a new idea as the `braid-idea` skill writes one, or a leftover when it is about the work at hand.

## Sweep

A sweep empties the leftovers in one decision of the user. It never covers ideas.

1. **When.** At a recap whose draft says `Sweep due` (3 or more open leftovers), or before planning the next braid with at least one open leftover. A merge you make under the preset runs no recap, so you check after it ([autonomy](references/autonomy.md), "Merging", step 3). No preset decides a sweep: ask the user, and the strands go on while the answer is pending.
2. **Propose** with `braid inbox` and `braid ask <id> "<what is needed>" --kind decision` (decision options: *Sweep as proposed*, *Change the list*, *Not now*), never on an item whose handover request is open (an item has one open request, and a new one replaces it): for a strand on its braid's number; for a lone story after its merge; before planning, in the plan request of the braid being planned. Propose one sweep story (`kind:task`, label `sweep`, the lowest tier that fits), naming which leftovers go in and which are dropped, and why. A leftover too big for it becomes its own braid, or is dropped and noted again as an idea. Before planning, the proposal may also fold a related leftover into the braid being planned.
3. **Record** the answer. On *Not now*, only `braid inbox pass <ids>`. Otherwise the sweep story is its own braid, so a thread that already holds a braid hands it to a new coordinator thread ("Plan", step 0), with the answer and the leftovers' text, source and links in the first message; the new coordinator creates the story (Plan, step 6, Story) with a brief that copies each taken leftover's text, source and links, and push its branch; then `braid inbox take <ids> --into <number>`, `braid inbox drop <ids> --why "<reason>"`, and `braid inbox pass <ids>` for the rest (a second pass drops one).
4. **Run** the sweep story after the current braid, in its own coordinator thread, launched through "Plan", step 0 (not here). At most one sweep is pending: a later proposal adds to that story's brief on its branch.

## Merge on request

When the user asks you to merge a named PR, picks *Merge now* on a handover, or says "merge it" right after a recap that handed one over, merge it with `braid accept <id> --head <head commit of your last recap of it> --review <link> --thread <your thread id> --merge` (for a strand add `--log -` with the braid's log entry). If you haven't recapped the PR, or its head has moved since, don't merge: show what changed and ask as a decision (*Hand over new head*, recommended, which takes it through "Accept and hand over"; *Leave it*, which ends the turn with the handover request still open); `braid accept` refuses a moved head. Once merged, continue with "After the merge": for a strand all of it; for a story or a final PR only its steps 1 and 2, since that merge finishes the item, plus step 5 when it was a spike.

The board's message `Merge #<n> at <head>, from the board.` in your thread is the user's confirmed request to merge that PR; the board never merges itself. Treat it as "merge it" for that PR: merge with the head of your last recap as above. If you haven't recapped the PR, or your last recap's head isn't the message's, don't merge: show what changed and ask the same decision.

## Autonomy

When you take a braid, run `braid autonomy <number>`. Unless it prints `careful`, read [autonomy](references/autonomy.md) first: there you merge, continue and decide stop cases as the preset says.

## Launched by a PM

When your first message names a PM thread (a `braid-pm` project manager launched you), or your braid's `## Autonomy` section has a `PM-run (thread <id>)` line (a replacement coordinator: the PM is that thread). Without either, nothing here applies.

- Every request you would put to the user (`braid ask`, `braid handover`) is still opened on the board as usual, and its full message with its options is sent to the PM thread with `t3_thread_send`, starting with the braid's number and title; then end your turn. Never use the question tool (AskUserQuestion in Claude Code, a pending request in T3) and never ask the user in chat: the PM's reply, or the user's answer on the board, wakes you. Elsewhere in this skill and in [autonomy](references/autonomy.md), "Stopping" included, where it says to ask the user, this is how.
- A reply from the PM counts as the user's reply, within the limits above: `braid answer <id> --log -` naming the PM, then act. A reply from the user on the board still wins. The limits: the PM's go is never the user's merge request for a merge into `main` where the project's `AGENTS.md` keeps `main` the user's; only the user's own answer does, on the board or as the PM's relayed `The user asks: merge #<n> at <head>.` with the user's words quoted.
- Your braid's `## Autonomy` exception line from the PM says which cases go to it and that a merge into `main` waits for its go (its live check).
- What autonomy says to tell the user (the one line after a merge you made, "Telling") goes to the PM thread, for its digest, not to the user.
- A new braid ("Plan" step 0, a sweep, a separate follow-up) is a proposal to the PM, not a launch: the PM adds it to its plan.
- Message the PM when your braid is Done or stopped, and when its PR into `main` waits for the user's merge.
- **Provider limits:** the PM keeps the limits check and the resume task for its braids. Over a threshold at a launch, tell the PM and launch nothing; on the PM's pause message, pause your agents and reply `Paused: <number>`; on its resume message, resume them ([provider limits](references/limits.md), "Under a PM").

## Fixes

- The worker that opened a PR fixes it: failed checks, review findings, anything else on that PR. Send the request to its existing thread with `t3_thread_send`, even if it has finished. Start a new worker on the same branch and item only if that thread can't continue.
- CI failing on a braid branch itself, or on its final PR, and review findings on the final PR, belong to no worker, and you don't fix product code yourself. Add a tier S fix strand at the end of the braid, with no dependencies, and run it before the next item. A second red on the braid branch is a stop (`quality`).

## Finish

A story is finished when the user merges its PR.

A goal, when every strand is Done on the braid branch (the docs strand, if planned, included):

0. Delete the limits check task if one is left ([provider limits](references/limits.md)).
1. Merge `main` into the braid branch, open one PR from it into `main` and watch it.
2. In one commit, tick the braid's boxes that now hold, write its `report.md` naming any box left open and why, and add a closing log entry.
3. Take the PR through "Accept and hand over" as a story of the braid's tier: review, facts, checks, capture, `braid accept <number>`; keep the watch until the new head is green, then unwatch it and hand that head over.
4. Wait for the user, unless the preset let you merge it. The merge finishes the goal: don't commit or open a PR after it.

## Talking to the user

- **A turn that waits for the user ends with an open request**, so the board says what is needed: `braid handover` for a PR to merge, otherwise `braid ask <id> "<what is needed>"` (`--kind decision|plan`, `--key <stop case>`), then the question. A wait for agents or CI needs none.
- **Context first.** Start every question or decision for the user with one or two short sentences of context: what it is about and why it comes up now, enough to answer without reading anything above. Name the thing itself (the item's title, the file, the PR), never "option 2" of an earlier message. This holds for a stop, a recap's "Needs the user" and "You", a `braid ask` text and a plan question, and for a worker's or reviewer's question you pass on.
- **The question tool** (AskUserQuestion in Claude Code, a pending request in T3) asks only when the turn ends waiting for the user alone. It never replaces the message: first the open request, then the full message in chat as the step asks (the recap, the plan, the proposal, the stop with its case and source), and only then the question, as the turn's last call. The question carries just its context line and what is asked. Write nothing for after it: text after the call reaches the user only once they have answered. While agents or CI still run for you (a sweep proposal while strands go on under the preset, a planning PR whose checks are pending), ask in chat with the open request instead: a pending question holds every watch wake and worker report until the user answers.
- **Options.** Offer the option set of the stop's kind below, recommended first, each label 1 to 5 words; the tool adds "Other" for free text. A host without the tool, or a question in chat, gets the same options as a numbered question with lettered answers and your recommendation. If an answer is a value such as a path, say where it will be stored.
- **A reply to an open request** (an option, "Other", a chat reply after a dismissed dialog, the board's merge message): first `braid answer <id> --log -`, then act; a new question means a new `braid ask`.
- **Say "waiting" only when something will wake you:** only the worker's message, a PR watch on the planning, final or accepted story PR, a `delegate_task` result, or, within this turn, a `t3_thread_wait` on a worker thread or a foreground `braid wait` running now. Otherwise say what you will do when the user next writes. A provider pause ends with `⏳ Paused for <provider> <window>; resumes at <time>`: the scheduled resume wakes you ([provider limits](references/limits.md)).
- **Hourglass:** a message that ends the turn while waiting (for agents, CI or the user) has `⏳ Waiting for <what>` as its last line, e.g. `⏳ Waiting for you: approve the plan`; before a question tool call, it ends the chat message. Nothing pending: no ⏳ line.
- **Links:** every worker or reviewer thread (its T3 `link`), PR (its URL) and item brief (its brief.md on GitHub, at the branch you read it from) you name is a link, also in the ⏳ line, e.g. `⏳ Waiting for the [worker](<thread link>)'s report on [0058](<brief url>), CI pending on [PR #210](<pr url>)`.

The option sets, and what you do next on each answer:

- **Handover** (a PR to merge, after its recap):
  - *Merge now:* "Merge on request", with the head of the recap.
  - *I'll merge it myself:* end the turn; the user's "merged", or `gh pr list --state all`, starts "After the merge".
  - *Let me see the report:* show the item's `report.md` and the recap's PR link, then ask again.
- **Plan** (`--kind plan`: the plan, or the go of a plan-only request):
  - *Approve:* Plan step 7; for the go, start the first ready strand ("Run an item").
  - *Change something:* ask what; each round is one `amend` commit (Plan step 6), then ask again.
  - *Show me the briefs:* link each brief file with its Completion boxes, then ask again.
- **Planning PR** (a goal's planning PR whose head changed after the plan was approved, Plan step 7):
  - *Merge now:* once its checks are green, merge it (`gh pr merge <pr> --merge --match-head-commit <head>`) and go on with Plan step 7.
  - *I'll merge it myself:* end the turn; the user's "merged", or `gh pr list --state all`, goes on with Plan step 7.
  - *Show me the PR:* link the PR and its brief files, then ask again.
- **Decision** (`--kind decision`: a worker's proposal or mockups, a sweep; growth beyond the mandate under `--key scope`): the concrete choices, recommended first. Send the chosen one to the worker, or record it (the sweep, the plan change).
- **Stop case** (`--key <case>` except growth beyond the mandate, which is a decision; [stop cases](references/stop-cases.md)): the ways forward the case allows, for example *Go on as planned*, *Change the plan*, *Stop here*. Go on with the next step; change the plan as in "Adjusting the plan", the answer giving the mandate; or log the stop and leave the item as it is.
- The user's approvals are never boxes: `braid ask --kind decision`; the report's "Decisions" sums up the logged answers.

The recap: edit the draft `braid handover` prints (`braid recap <id>` for an item merged or blocked). It already has every field, filled from `report.md`, the PR's head and checks, `braid facts` and the braid log line. Add only what the draft lacks: context first, the exact steps under "You", growth and plan changes under the mandate in **Decisions**, **Deviations**, **Next**, and the worker's final screens for a `ui` item. Keep the draft's last line `Sweep due: …` when it is there, and never list inbox entries or ideas in a recap.
