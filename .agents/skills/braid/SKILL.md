---
name: braid
description: Plan a goal or a single story as braids in braids/, then deliver it - run one worker at a time, arrange review, hand each PR to the user to merge, and report. braid merges a PR itself only when the user asks, or in auto mode a strand into its braid branch (auto mode never merges into main). A story that grows becomes strands. Use for goal-level or single-story delivery in a repository that has a BRAID.md; not for doing an item yourself.
---

# Braid coordinator

Plan the user's goal or story as braids and strands, then deliver them through workers, one at a time; don't write product code.

**Resuming.** When you don't have this braid's state in your own conversation, read [resuming](references/resuming.md) before acting. That is the case when you are a new agent or thread given a braid someone else ran (the old one crashed, was closed, or the work moved), when your conversation was summarized and lost the working details, or when your session starts on a braid you didn't plan. Nothing detects this for you. The user's "continue" or "merge" in a conversation that still holds the work is not a resume, and neither is a failed worker ("Run an item").

## Project facts

Read `BRAID.md` at the repository root first (`gate`, `main`, `ci`, `run`, `models`), and follow the project's agent instructions (`AGENTS.md` or `CLAUDE.md`).

Models: use `models.<role>.<tier>` (tier key `S`, `M` or `L`) if present, then `models.<role>.<kind>`, then `models.<role>`; if none exists, ask the user. Use any named skill. Use the exact provider, model and options (in T3 they are `instanceId`, `model` and `options`: `effort=high` is `{"effort":"high"}`); if unavailable, tell the user instead of substituting. When launching, state the model and its settings in one line.

Read these too; this skill names their rules without repeating them:

- [The workflow](references/workflow.md): what an item is, who writes which branch, who sets Done, branches per case, tiers, who merges, failure modes.
- [The brief template](assets/brief.md): fields and the exact commands.
- [Stop cases](references/stop-cases.md): when braid waits for the user.

If `braid --version` fails, the project has `backlog/` and no `braids/`, or `BRAID.md` is missing, follow [setup problems](references/setup.md) before anything else.

## Ground rules

- Edit `brief.md` and `report.md` directly, then run `braid check`; use `braid` for new numbers and letters, status, labels, dependencies and logs.
- One writer per branch, and acceptance (Done) is yours through `braid accept`.
- Your commits are `docs(braids): …`, for example `docs(braids): 0012 phases: add 0012/A, 0012/B`.
- Commit brief changes only at these points: the plan and its review rounds; the braid In Progress, after the planning merge; a growth or plan-change decision; a log entry; an item accepted (`braid accept`); an Outline detailed; the braid Done at the end.
- Name every thread `<emoji> <repo> <id> <role>: <title>`: 🧠 `coordinator`, 💻 `worker`, 👀 `review`, 🧪 `research`; the repo is the GitHub repository's name and the title is the item's name exactly as its brief has it. Never write one by hand: launch each thread with the output of `braid title <id> --role <role>`, for example `💻 braid 0021 worker: Board Start: no branch clash`. When a coordinator takes a braid (plan or resume), it sets its own thread's title to `braid title <number> --role coordinator` (`t3_thread_update` in T3, else the host's rename).
- **Gaps go by the table.** Route each gap as the workflow's "Gaps and the inbox" says, without asking the user, and capture what goes to the inbox with `braid note` ("Capture"). Never fold anything in silently.
- Never edit braid skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` unless the user asks. Don't publish, release, deploy or change repository settings unless the user asks.

## Plan

1. Before planning a new braid, propose a sweep if any leftover is open ("Sweep"). When the user asks for an idea to become braids, plan from it as from any goal, and once the plan is approved, `braid inbox take <idea> --into <braid ids>`. Never propose ideas yourself.
2. Understand the goal. Explore enough to plan without making workers repeat it. Ask the user only what changes scope or the Completion boxes.
3. Look around: `braid list --open` shows every unfinished braid, wherever it lives. Read the brief (`braid view`, which reads it where it lives) of each whose goal touches the same commands, files or decisions, and judge it:
   - **Overlap without conflict:** `related`, and one line under "Already decided" saying what is shared and how the two stay apart (order, which merges first).
   - **One needs the other's result:** a dependency if the id resolves here; otherwise that line says to start after the other braid merges.
   - **Duplicate or contradiction:** the other already covers this goal or part of it, or this goal undoes or conflicts with its goal or an "Already decided" line. `related`, and a `scope` warning in the plan request (step 6): the other braid's id, title and branch, the conflicting text, and the options (narrow this plan, fold it into the other braid, change the other through its coordinator, go on as planned). Draft the plan anyway; the user's answer decides, and goes into the braid's log.

   Never edit another braid's brief for a link: its side shows it with `braid view --links`.
4. Decide the shape: work for one PR is a story; anything bigger, or with phases, is a goal with strands, each small enough for one PR. Items further out, or that depend on a spike, may stay `Outline`.
5. Draft the briefs from [the brief template](assets/brief.md), each with a few testable Completion boxes. Its "Fields" say how to set dependencies, `order`, `related` and the `ask:<key>` labels; the tier is the lowest that fits (workflow, "Tiers").
6. Create them and commit locally; push nothing yet.
   - **Goal:** in your worktree on `plan/<slug>` from `main`, `braid new`, then `braid strand new` per strand.
   - **Story:** `git fetch`, then in a temporary worktree on a new branch from `origin/main`, `braid new`, then `git branch -m braid/<number>-<slug>` (its folder name).

   Show the user the plan (titles, kinds, tiers, order, dependencies, related braids, Completion boxes, `ask:` labels) with links to the brief files, leading with any warning from step 3, and `braid ask <number> "Approve the plan" --kind plan`. Each round of the user's comments is one local commit, `docs(braids): <id> amend: <what>`. Check with `git diff` that only the intended lines changed, then tell the user briefly what changed (no pasted diff).
7. On approval, squash the commits into one `docs(braids): plan <id>` (`git reset --soft <commit the branch was cut from>`, then commit) and push once.
   - **Goal:** create and push the braid branch `braid/<number>-<slug>` from `main`, open the planning PR from `plan/<slug>` into it and tell the user. Its merge records the approval: keep the plan request open until then, or `braid ask` for that merge. Then pull the braid branch and set the braid `In Progress` in its next commit.
   - **Story:** remove the temporary worktree; the worker starts on that branch.
8. If the user asked only for a plan, don't start: show the table and open questions, `braid ask` for the go, and resume from `braids/` and GitHub. Otherwise start the first ready strand without waiting.

## Run an item

One implementation worker at a time. The next item is under "Starting the next item" in the workflow; a story has only itself.

1. Run `braid start <id>`, then launch a top-level T3 thread with `t3_thread_launch` on the folder it prints as an existing worktree (`existing_worktree`), with the worker model for the item's tier and kind and `title` the output of `braid title <id> --role worker`. Launch it with no message, so it starts idle.
2. Send the first message with `t3_thread_send`, filling in the thread id the launch returned, so the worker logs under its own id and not yours. If the worker might not find the skill by name, add the absolute path of its `SKILL.md`.

   ```text
   You are the braid worker for <id>. Use the braid-worker skill (sibling folder of the braid skill).
   Brief: `braid view <id>`. Branch: <branch> at <short sha>. Open the PR into <base branch>.
   Send your result to thread <your thread id>. Your thread id: <worker thread id>.
   ```
3. **Wait.** After launching a worker, or sending it fixes, call `t3_thread_wait` on its thread (a reviewer is waited for as "Accept and hand over" step 1 says); it returns when the run ends, and at once on an idle thread. If no report arrived, read the thread's last message and `gh pr checks`:
   - CI pending: make sure your watch is on, then end your turn; the watch wakes you.
   - Green: take the result from the thread and continue.
   - The PR is already merged: the item is done.
   - Stopped without a watch, or stuck: send it a nudge.
   - The run failed: read its error, and the item's `report.md`, log and PR. Retry once with the same model and settings; if it fails again, `braid ask`, naming the error.
   - The user says it finished: believe them and look at the PR.
4. **Watch.** Once the worker's PR exists, call `watch_pull_request` on it (one item PR at a time) and end your turn. On a wake:
   - First call `t3_thread_wait` on the worker's thread. If the worker reported since you last sent it work, use its report and ignore the wake; without a report, step 3 applies.
   - Failed checks, conflicts or comments while the worker is active or watching are the worker's: do nothing and end your turn.
   - A wake is never a merge decision; continue with "Accept and hand over".

   Unwatch a PR when you hand it to the user, because T3 keeps a watched thread out of their inbox: an item PR when the recap asks for their merge; the planning and final PRs once their checks are green and any review is done. After that, the user's "merged" or `gh pr list --state all` decides.
5. Answer the worker's questions. If the brief must change, tell the worker; it applies the change on its branch.
6. **Converge loop** (workflow, "Checks and reports"): when the worker stops with a proposal, show it to the user (`braid ask <id> "<what is needed>" --kind decision`) and send each verdict to the worker. When the user approves, tell the worker to build.

## Grow and adjust

A worker that finds more work stops and sends you one proposal: **absorb** it (same PR, within about twice the expected size), split off a **prerequisite**, or turn the story into **phases**. Its own steps are in its skill; these are yours.

- **Mandate.** You may add up to two strands or one prerequisite of tier S or M without asking, logging why on the braid and in the next recap. Anything more, new tier L work, or a change to the goal or its Completion boxes goes to the user first (`braid ask <id> "<what is needed>" --key scope`); tell the worker to stop at a clean point and note where it is.
- **Absorb:** tell the worker.
- **Prerequisite of a strand:** create it as another strand of that braid on the braid branch, push, and tell the worker (it merges the braid branch and adds the dependency). Run the prerequisite next, and tell the worker when it is merged.
- **Prerequisite of a lone story:** create it as its own story into `main`, and tell the worker when it is merged.
- **Phases:** once the worker has pushed and stopped, its branch becomes the braid branch. On it add the strands (`braid strand new`, order, dependencies; the first says what is already done) and log why on the braid, which stays `In Progress`. Close the story's PR with a comment saying so. Run the strands one at a time with the braid branch as base.
- **Adjusting the plan.** When really needed, change items that haven't started (wording, order, dependencies, split, merge, drop) on the branch you hold, as one commit, logging why on the braid and in the next recap. The mandate's limits apply. For a dropped strand, write the log entry, then `git rm -r` its folder and fix its dependents' dependencies in the same commit.

## Accept and hand over

When the worker reports green:

1. **Review** by tier (workflow, "Tiers").
   - S: read the diff yourself.
   - M and L: launch an independent reviewer as a subagent: `delegate_task` with `role: review`, `isolation: worktree`, `mode: async`, the reviewer model from `BRAID.md` as `target` (`providerInstanceId`, `model`, `options`), `title` the output of `braid title <id> --role review` and the first message below as `task` (add the `SKILL.md` path if needed). T3 makes its checkout. A model or provider T3 can't run as a child: tell the user; never substitute another.
   - Then run `braid review <id> --thread <child thread id>`, so the board shows the review, and call `link_pull_request` with the PR URL and `threadId` set to the child thread.
   - **Wait** as the task's `next` says: end your turn, and take the reviewer's report when T3 delivers the result. Never poll it.
   - No result, an empty one, or a failed run: read the PR's newest review comment at that head (`gh pr view <pr> --comments`). Without one, start one fresh task with the same model and settings; if that fails too, `braid ask <id> "<what is needed>" --key quality`, naming the error.
   - L, when blocking fixes substantially changed failure or recovery behavior: have a reviewer check the fix again, adding `Re-check: review the commits since <sha>.` to its first message.
   - A re-check or a second round is a fresh task, launched and recorded the same way; never resume a delegated reviewer with `t3_thread_send`.
   - Send blocking findings, and small factual errors in docs, to the same worker to fix on the same PR; route non-blocking ones by the table (workflow, "Gaps and the inbox").
   - Still blocking after two fix rounds: add the `ask:quality` label to the item (`braid edit <id> --labels`, repeating the others).

   ```text
   You are the braid reviewer for <id>. Use the braid-reviewer skill (sibling folder of the braid skill).
   PR: <url>, head commit <sha>. Focus: <what matters most here>.
   ```
2. **Facts.** When nothing blocking remains, run `braid facts <pr>` and judge its facts against the [stop cases](references/stop-cases.md).
3. **Checks.** Read the PR's checks once with `gh pr checks <pr>`, limited to the `ci` names in `BRAID.md`. If one failed, send the PR back to its worker; if some are still running, wait. You don't re-run the gate or download artifacts.
4. **Capture** before the handover, as leftovers ("Capture"): the non-blocking findings not fixed in the PR (`--from 'review <id>'`, `--ref` the review comment), and the report's unfinished bits and `For later items:` gaps (`--from <id>`, `--ref` the PR). Notes for the braid's later strands (names, interfaces) stay in the log line, which names the entry ids instead of repeating the text.
5. **Hand over** when the checks are green on the latest commit.
   - A strand: run `braid handover <id> --head <sha> --thread <your thread id>`, edit the recap it prints and wait for the user's merge.
   - A story: first run `braid accept <id> --head <reviewed sha> --review <link> --thread <your thread id>`; when the new head it prints is green, hand that head over the same way.
   - You merge only under "Merge on request" or "Auto mode".
6. **After the merge**, once `gh pr list --state all` shows the PR merged:
   1. Interrupt the worker's thread if still running (`t3_thread_interrupt`), and `task_cancel` a reviewer task that still runs (never `t3_thread_interrupt` on its child thread).
   2. Run `braid clean --yes` to remove the item's worktree and branch and its reviewers' checkouts. A reviewer's folder still in use is kept and named; run it again later.
   3. For a strand, on the braid branch, run `braid accept <id> --review <link> --thread <your thread id> --log -` with the braid's log entry on standard input; it commits as `docs(braids): <id> done`. Skip this when the merge ran through `braid accept --merge`, which did it.
   4. Fix any item that hasn't started and that the entry makes wrong, as in "Adjusting the plan".
   5. After a spike, turn its proposed follow-ups into briefs (or adjust existing ones) and tell the user what the answer changed.
   6. If the next item is `Outline`, reread it, detail it into a full brief (`braid ask` for what it leaves open), set it `To Do` and commit.
   7. Start the next item; after the last strand, finish.

## Capture

- Before your first capture in a session, run `braid inbox --no-fetch`. If `braid` has no `inbox` command, follow [setup problems](references/setup.md) (an old `braid` is updated the way it is installed).
- Write each leftover as the workflow says (title, what, where, why, `--from`, `--ref`), through `braid note --file -`; it commits and pushes to `braid-inbox` itself.
- The user's side observation while an item runs: capture it at once, a new idea as the `braid-idea` skill writes one, or a leftover when it is about the work at hand.

## Sweep

A sweep empties the leftovers in one decision of the user. It never covers ideas.

1. **When.** At a recap whose draft says `Sweep due` (3 or more open leftovers), or before planning the next braid with at least one open leftover. Auto mode runs no recap, so it checks after each strand merge ([auto mode](references/auto-mode.md), "Merging", step 3). Auto mode never decides a sweep: it asks the user too, and the strands go on while the answer is pending.
2. **Propose** with `braid inbox` and `braid ask <id> "<what is needed>" --kind decision`, never on an item whose handover request is open (an item has one open request, and a new one replaces it): for a strand on its braid's number; for a lone story after its merge; before planning, in the plan request of the braid being planned. Propose one sweep story (`kind:task`, label `sweep`, the lowest tier that fits), naming which leftovers go in and which are dropped, and why. A leftover too big for it becomes its own braid, or is dropped and noted again as an idea. Before planning, the proposal may also fold a related leftover into the braid being planned.
3. **Record** the answer: create the story (Plan, step 6, Story) with a brief that copies each taken leftover's text, source and links, and push its branch; then `braid inbox take <ids> --into <number>`, `braid inbox drop <ids> --why "<reason>"`, and `braid inbox pass <ids>` for the rest (a second pass drops one).
4. **Run** the sweep story after the current braid. At most one sweep is pending: a later proposal adds to that story's brief on its branch.

## Merge on request

When the user asks you to merge a named PR, or says "merge it" right after a recap that handed one over, merge it with `braid accept <id> --head <head commit of your last recap of it> --review <link> --thread <your thread id> --merge` (for a strand add `--log -` with the braid's log entry). If you haven't recapped the PR, or its head has moved since, don't merge: show what changed and `braid ask`; `braid accept` refuses a moved head. Then continue with "After the merge": for a strand all of it; for a story or a final PR only its steps 1 and 2, since that merge finishes the item.

The board's message `Merge #<n> at <head>, from the board.` in your thread is the user's confirmed request to merge that PR; the board never merges itself. Treat it as "merge it" for that PR: merge with the head of your last recap as above. If you haven't recapped the PR, or your last recap's head isn't the message's, don't merge: show what changed and `braid ask`.

## Auto mode

When the user asks for auto mode on a goal, or the braid has the `auto` label, read [auto mode](references/auto-mode.md) first: there you merge the goal's strand PRs into the braid branch yourself.

## Fixes

- The worker that opened a PR fixes it: failed checks, review findings, anything else on that PR. Send the request to its existing thread with `t3_thread_send`, even if it has finished. Start a new worker on the same branch and item only if that thread can't continue.
- CI failing on a braid branch itself, or on its final PR, and review findings on the final PR, belong to no worker, and you don't fix product code yourself. Add a tier S fix strand at the end of the braid, with no dependencies, and run it before the next item. A second red on the braid branch is a stop (`quality`).

## Finish

A story is finished when the user merges its PR.

A goal, when every strand is Done on the braid branch:

1. Merge `main` into the braid branch, open one PR from it into `main` and watch it.
2. In one commit, tick the braid's boxes that now hold, write its `report.md` naming any box left open and why, and add a closing log entry.
3. Take the PR through "Accept and hand over" as a story of the braid's tier: review, facts, checks, capture, `braid accept <number>`, then unwatch it and hand over the new head once its CI is green.
4. Wait for the user. Their merge finishes the goal: don't commit or open a PR after it.

## Talking to the user

- **A turn that waits for the user ends with an open request**, so the board says what is needed: `braid handover` for a PR to merge, otherwise `braid ask <id> "<what is needed>"` (`--kind decision|plan`, `--key <stop case>`), then the question. A wait for agents or CI needs none.
- **Context first.** Start every question or decision for the user with one or two short sentences of context: what it is about and why it comes up now, enough to answer without reading anything above. Name the thing itself (the item's title, the file, the PR), never "option 2" of an earlier message. This holds for a stop, a recap's "Needs the user" and "You", a `braid ask` text and a plan question, and for a worker's or reviewer's question you pass on.
- Ask with the host's question tool if it has one, otherwise as numbered questions with lettered options and your recommendation. If an answer is a value such as a path, say where it will be stored.
- **A reply to an open request:** first `braid answer <id> --log -`, then act; a new question means a new `braid ask`.
- The user's approvals are never boxes: `braid ask --kind decision`; the report's "Decisions" sums up the logged answers.

The recap: edit the draft `braid handover` prints (`braid recap <id>` for an item merged or blocked). It already has every field, filled from `report.md`, the PR's head and checks, `braid facts` and the braid log line. Add only what the draft lacks: context first, the exact steps under "You", growth and plan changes under the mandate in **Decisions**, **Deviations**, **Next**, and the worker's final screens for a `ui` item. Keep the draft's last line `Sweep due: …` when it is there, and never list inbox entries or ideas in a recap.
