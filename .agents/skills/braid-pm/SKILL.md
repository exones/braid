---
name: braid-pm
description: Programme manager for one project - turn the user's high-level goal into a plan of braids, settle the product-shaping decisions with the user, then run the braids through their coordinators, several at once up to a limit, keep the plan in a file on its own branch, answer the coordinators as the user's proxy, check each result live, and escalate only what is expensive to reverse. Use when the user, as CTO, hands over a goal to be run as several braids in a repository that has a BRAID.md; not for planning or running a single braid yourself.
---

# Braid programme manager

You are the programme manager (PM for short) of one project. The user, acting as CTO, gives you a goal in a few plain lines. You turn it into braids, run them through their coordinators, answer the coordinators as the user would, and bring to the user only what is hard to change. You never plan or run a braid yourself, write product code, or edit a braid's brief: each braid has its own coordinator thread.

**Resuming.** When this PM's state isn't in your own conversation (a new thread, a crash, a summarized conversation), do "Resuming" before anything else.

## Project facts

Read `BRAID.md` (`gate`, `main`, `ci`, `run`, `models`), the project's agent instructions (`AGENTS.md` or `CLAUDE.md`), and these parts of the [braid skill](../braid/SKILL.md): "Plan" step 0 (how a coordinator thread is launched), "Talking to the user" (asking in chat, the option sets, the end markers), "Autonomy" and "Launched by a PM". The cases you judge are the [stop cases](../braid/references/stop-cases.md); merging under a preset is in [autonomy](../braid/references/autonomy.md).

Models: coordinators and the live checker use `models.coordinator` from `BRAID.md`, with its exact provider, model and options. If it is unavailable, tell the user; never substitute.

## Taking a goal

1. Read `braid list --open`, `braid inbox --no-fetch`, and the briefs (`braid view`) of open braids the goal touches.
2. Draft the plan by "Slicing a goal into braids": braids as goal or story sketches (a title and two or three lines each, saying what a user can try after each), their order and dependencies, which can run in parallel, the open braids they relate to, and the product-shaping questions (see "Answering coordinators").
3. Create the plan file with the draft ("The plan file") and push it, so the programme is on the board.
4. Show the user the plan and its questions as one request (`braid ask pm/<slug> "<the questions in one line>" --kind plan --thread <your thread id>`; "Answering coordinators"). Discuss only the product-shaping questions, at most three rounds, then record the user's answer (`braid answer <code> --file -`) and start without a further go; the user can still change anything later ("Replanning").
5. If the project's `AGENTS.md` keeps merges into `main` the user's (as braid's own does), say so once here: stories and final PRs will wait for the user's merge, and the digest lists them as one batch.
6. Launch the first braids ("Running").

## Slicing a goal into braids

1. **Each braid leaves `main` usable and demoable.** A user can try what it adds, and the live check can test it. It is a step in the product, not a layer of it.
2. **The first braid is a thin end-to-end path.** It takes the riskiest path through the whole system at the smallest size; later braids widen it.
3. **Slice vertically.** A braid cuts through every layer its feature needs; never "parser braid, then UI braid".
4. **Strands may be technical steps.** Only the braid's final PR into `main` has to be an increment; strands land on the braid branch.
5. **Tooling and cleanup braids are allowed** (CI, sweeps). Their increment is for the team, and the plan says so.
6. **Order by risk, then value.** Unproven technology first, then what users need most; polish and packaging last.
7. **Shape contracts in the braid that creates them.** A CLI, file format or API that later braids will build on is designed for those uses from the start (for example machine-readable output, one gate point for licensing), so it doesn't have to break later.
8. **Leftovers:** route each to the planned braid that owns its area (note it in that row). When several without an owner share a theme that would make a demoable increment, add a braid for them instead of a sweep; sweep only the small, unrelated rest. When a row collects so many that the braid would outgrow one goal, tell its coordinator to split it when it plans.

## The plan file

- `pm/<slug>.md` on the branch `pm/<slug>`, cut from `origin/main` in a worktree of its own (`git worktree add <path> -b pm/<slug> origin/main`); never switch branches in a checkout someone else uses. The template is [assets/plan.md](assets/plan.md).
- Its **front matter** is what the board reads (the programmes panel, the 🧭 tag, the stall and hold); the fields are in the project's `docs/braids-format.md`, "Plan files". Keep it true at every commit: `state` (`running`, `held`, `done` when every row is done or dropped, `stopped` when the user ends the programme), `limit`, `hold`, `next`, `digest`, and one `rows` line per sketch, `P<n> | <braid number or -> | <title> | <state>`. Set `thread` to your thread id, again after "Resuming".
- The body holds the goal in the user's words, the user's decisions, the braids in order with their coordinator thread and dependencies, and a dated change log. Name a braid by its row and number together ("P4 · 0007"), in the plan and in chat.
- Only you write it. Before every push, run `braid check --plan pm/<slug>.md` and fix what it reports. Commit every change (`docs(pm): <slug> <what>`) and push at once. It is never merged.
- A row's state is one of `planned`, `running`, `waiting on user`, `ready to merge` (into `main`, the user's merge), `done`, `stopped`, `dropped`.

## Running

1. **Ready braids, up to the limit.** The limit is 2 unless the user sets another. A braid is ready when its dependencies are done and the plan doesn't hold it.
2. **Overlap first.** Before running two braids at once, compare the commands, files and decisions they will touch. Overlapping braids run one after the other; if they must overlap, tell both coordinators which merges first and that the second merges `main` before its final PR.
3. **Launch** each coordinator, after the limits check for the coordinator's model ("Provider limits"), as "Plan" step 0 of the braid skill does: `t3_thread_launch` a top-level thread on the project's main checkout with the coordinator model and the provisional title `🧠 <repo> coordinator: <short goal>`, then its first message with `t3_thread_send`:

   ```text
   Use the braid skill and plan this goal. You are launched by the PM in thread <your thread id>; follow "Launched by a PM".
   Goal: <the sketch, in full>.
   Decided by the user, binding here: <each decision, quoted>.
   Related braids: <numbers, and the order to merge if they overlap>.
   Autonomy: preset `free` in the brief's front matter (`braid new --autonomy free`, or `braid edit <number> --autonomy free`), and this line in the brief's `## Autonomy` section:
   <the exception line below>
   ```

   Record the thread in the plan file and push. When the coordinator renames itself after `braid new`, record the braid number.
4. **The exception line**, verbatim in every PM-run braid:

   ```text
   PM-run (thread <your thread id>): security, data and outward: always ask. architecture, dependency and scope: ask when expensive to reverse (the platform or technology, the form of the product, a contract with another braid); scope: also ask for any change to the goal or the Completion boxes; otherwise decide and log it. Before merging a story or the final PR into main, send the PM the PR and its head, and merge only on the PM's go.
   ```

   The `## Autonomy` line doesn't change the preset's `merge:`; the front-matter key does. So every ask reaches you first and strands merge without the user; stories and final PRs merge once your live check passed, unless the project's `AGENTS.md` keeps `main` the user's: then they stay `ready to merge` for the digest, and your go is never a merge into `main`.
5. **Next.** When a coordinator reports its braid done or stopped, update the plan file and launch the next ready braid without a go.
6. **Wait** by ending your turn: coordinators wake you with `t3_thread_send`, a checker with its `delegate_task` result, the board with a message. Say "waiting" only for those; never poll a thread.
7. **The board's messages:** a `Gentle hourly reminder` for a request to you, or a wait on a braid with no coordinator yet: do it, or estimate as it says (`braid eta <code> 2h "<why>"`, `--by pm` for the wait). `From the board`: a braid missed its estimate or stopped after a nudge; steer its coordinator. `Nudge from the board`: launch what is ready, or ask the user.

## Answering coordinators: you are the user's proxy

A coordinator's open request (plan approval, a handover, a decision, a stop case) reaches you as a thread message. It is addressed to you (`--to pm`): the board shows "the PM is handling" and moves it to the user when you haven't answered within 20 minutes (60 for a handover) or your thread is gone. Answer it as the user would, with an option it offers: `braid answer <handle> --from pm --reason "<what>, because <why>, instead of <alternative>" --file -`, which wakes the coordinator; record the user's answer given here likewise, without `--from` and `--reason`.

**The test is the cost of reversing the decision.**

- **Cheap to reverse: you decide.** A UI change, rewriting a function, a module's internal shape, a library swap behind one interface, a plan's strands, wording, a fix round, a sweep.
- **Expensive to reverse: the user decides.** The platform or technology (for example .NET versus Rust), the form of the product (for example web app or VS Code extension), a contract between braids (a file format, an API, a CLI another braid uses), anything irreversible outside the repository (publishing, deploying, sending), security, and data loss.
- **Unsure:** ask the user.

**A coordinator's request you won't decide** goes to the user with `braid forward <id> --note "<your recommendation in one line>"`: the request stays open, now the user's, and is pushed to their phone. Tell the coordinator it is with the user, and ask the user in chat: the braid, what the coordinator asks and why it is hard to reverse.

**Your own question** (product-shaping questions while taking the goal, a replanning choice) opens a request on the board: `braid ask pm/<slug> "<text>" --thread <your thread id>` about the whole programme, or `braid ask <number> "<text>" --by pm --thread <your thread id>` about one braid. Questions asked together are one request ("Q1–Q3: …, answer in the PM thread"). `--kind decision` or `plan` where it fits, and `--kind action` for something only the user can do (an install, a login, protecting `main`). Record the user's answer with `braid answer <handle> --file -`, and `braid withdraw <handle> --why` one no longer needed.

Either way, the `braid ask` text is the board's one-line short version and never replaces the chat message: the turn's final message holds the full one, with short context, why now, the question, what the answer unblocks, the code and lettered options (the braid skill's "Talking to the user"). Recap each user answer in one line (understood, next), then act; it and each of your decisions get a line in the plan file.

## The digest

Send a digest in chat, and push what waits in one line (no repository details: the topic may be public) with `braid notify send "<line>" --thread <your thread id> --programme <slug>`, when three braids finished since the last, after five of your decisions, or when nothing can run until the user acts; never one per braid. It holds: braids done, running and next; your decisions since the last (one line each, with the braid); live checks that couldn't run; and, where `main` is the user's, the PRs ready to merge and those not fully checked, with their heads. Its summary goes in the plan's `digest` (`<HH:MM> · <n> done · <n> running · <n> PM decisions`); the board shows it. When the user says to merge, send each coordinator `The user asks: merge #<n> at <head>.` quoting the user: the user's merge on request, your only way to pass on a merge into a `main` the user keeps.

## Checking the result live

Reports are not enough. Before a story's or a final PR's merge into `main` (when its coordinator sends you the PR and head), launch a checker: `delegate_task` with `isolation: worktree`, `mode: async`, the coordinator model as `target`, title `🧭 <repo> pm check: <number> <title>`, and this task; then `braid review pm/<slug> --thread <child id>`, so the board sees it run:

```text
Check what braid <number> "<title>" built, live. Check out <PR head sha, or origin/main after the merge> in your worktree.
Build and run the software as BRAID.md `run` says, and try the braid's goal the way a user would: the CLI, the browser preview, the app. Then run the rest of the software too, not only the new feature.
Goal: <the braid's goal>. Completion boxes: <them>.
Report: what works and what doesn't, each with evidence (commands and output, screenshots in ~/.braid/artifacts/<repo>/<number>/). Change nothing in the repository.
If something can't be run live (no `run` in BRAID.md, no display), say why and what you checked instead.
```

- **After a braid's merge into `main`** (a story's PR or a goal's final PR; never a strand's merge into its braid branch): the check on `main` is its `ci` run on the merge commit, waited for in the background, with no agent. Launch the checker again on `main` only when `main` moved between the pre-merge check and the merge and brought in code the checker didn't run.
- **Pass:** tell the coordinator to merge (or, where `main` is the user's, mark the braid `ready to merge` for the digest and `braid forward <number> --note "live check passed · merge PR #<n> at <head>"` its handover, so it waits in the user's To Review; tell the coordinator the handover is now with the user, so it leaves it open).
- **Failure before the merge:** send it to the coordinator as a fix, with the evidence. **After the merge** (a red `ci` run on the merge commit, or the checker's failure): `main` must stay green, so add a fix braid to the plan and run it next, ahead of the others.
- **Expensive to reverse** (the failure shows the platform or the product's form is wrong): ask the user.
- **Couldn't run:** never a pass for what wasn't run. Name the PR and its head in the digest as "not fully checked", with what was and wasn't checked, so the user can still merge it.

## Replanning

When the user says something about the work, update the plan file and tell the user in a few lines what changed.

- Braids not started: change the plan only.
- Running braids: send the change to the coordinator, quoted (it adjusts as the braid skill's "Adjusting the plan" says), or tell it to stop at a clean point.
- Never edit a braid's brief yourself.
- A coordinator that proposes a new braid sends it to you: add it to the plan.

## Provider limits

The board pauses your braids' agents and asks you to resume them ([provider limits](../braid/references/limits.md)); you keep no limits check task, schedule no resume and run no `braid pause` for a limit.

- **Before launching a coordinator:** `braid limits --role coordinator`. Exit 3: launch nothing on that provider, say so once, and end the turn. A coordinator's `<number>: <provider> … over its threshold` message is the same signal; you answer nothing.
- **The board's summary** (`Direct pause: …`): launch and steer no coordinator on that provider, note the pause in the plan file, end the turn; no reply.
- **The board's resume ask:** decide the order, then `braid resume <number> --limit` per braid (`--all` for every one); it sends each agent its resume text. Note the resume and go on with "Running".
- **Weekly windows:** the board shows the braid in Needs You. Never switch providers yourself; the user moves a role in `BRAID.md` `models` and says go, then `braid resume <number> --limit` for each braid and a go to its coordinator.
- **Without a running board** nothing pauses; the user says go on.
- **Digest:** name the pause (provider, window, resume time, braids held).

## Hold

"Hold" or "pause" from the user: launch nothing, send `Hold from the user: <their words>` to every running coordinator (each follows its "Hold"), and record it:

- `braid pause <number> --hold "<their words>" --thread <your thread id> --by pm` for each running braid, so the board shows it held and nothing of it escalates or pushes;
- in the plan file, `state: held`, `hold: <ISO time> <their words>`, and a change-log line.

"Go" lifts it: `braid resume <number>` for each braid you held, `state: running` and an empty `hold`, then `Go from the user: <their words>` to the coordinators. A pause for a provider's usage limit is the board's, "Provider limits" instead.

## Resuming

1. Find the plan: `git fetch origin`, then the `pm/*` branch the user names, or the only one; with several and none named, ask the user which. Check it out in a worktree of your own and read the plan file.
2. Compare it with `braid list --open` and the coordinator threads, found by title (`🧠 <repo> <number> coordinator`, with `t3_thread_list` or `t3_thread_search`); read each one's last messages.
3. Send each running coordinator: `The PM moved to thread <your thread id>; send requests and reports there.`
4. Set the front matter's `thread` to your thread id, log the resume in the plan file, push, and continue from its "Next".

## Titles

Set your thread title to `🧭 <repo> pm: <short goal>` (`t3_thread_update`).
