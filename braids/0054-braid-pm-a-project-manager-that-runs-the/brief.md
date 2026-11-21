---
id: '0054'
title: "braid-pm: a project manager that runs the braids toward one goal"
status: Done
labels: ["kind:story", "tier:L", "ask:process", "ask:architecture"]
dependencies: []
related: ['0036']
delivery: epic
---

## Goal

A new skill, `braid-pm`, is a project manager for one project. The user, acting as CTO, gives it a high-level goal in a few plain lines. The PM turns the goal into a plan of braids, discusses only the product-shaping decisions with the user, then runs the braids through their coordinators: several at once, up to a limit. It keeps a plan at all times that says which braid runs and which comes next, and it replans whenever the user says something. It answers the coordinators' questions itself and brings to the user only the decisions that are hard to change.

Expected size: about 350 lines in 7 files (one new skill of 2 to 3 files, the coordinator skill, docs, the install test).

## Start here

- `.agents/skills/braid/SKILL.md`: the coordinator. Read "Plan" step 0 (launching a coordinator thread with a handover message), "Talking to the user" (open requests and the option sets the PM will answer), "Autonomy" and "Merge on request". The PM launches coordinators the way step 0 does.
- `.agents/skills/braid/references/autonomy.md` and `references/stop-cases.md`, and `docs/autonomy.md`: presets and stop cases. Under the PM, a coordinator's "ask me" side goes to the PM first.
- `.agents/skills/braid-worker/SKILL.md`, the "Send your result to thread" pattern: a child reports to its parent's thread with `t3_thread_send`, which wakes the parent. Coordinator to PM works the same way.
- The inbox idea `2026-11-19-8m40` (`braid inbox show 2026-11-19-8m40`) and `braids/0045-*/report.md`, "Option 4": earlier thinking on this agent. That thinking spans projects; this braid is one project only.
- `scripts/Install-Skills.ps1`, `test/pester/Install-Skills.Tests.ps1` (it names the installed skills), `docs/getting-started.md`, `README.md` (the skills row), `docs/decisions.md`.

## Change

- `.agents/skills/braid-pm/SKILL.md` (new), plus references or assets as needed (for example a plan file template and the decision charter). It covers:
  - **Taking a goal.** Read `BRAID.md`, `braid list --open` and the inbox. Draft the plan: braids as goal or story sketches with order, dependencies and parallel lanes, plus the product-shaping questions. Discuss those questions with the user, at most a few rounds, then start without a further go.
  - **The plan file.** A Markdown file `pm/<slug>.md` on the branch `pm/<slug>` cut from `main`. Only the PM writes it. It is committed on every change and pushed, and never merged. It holds the goal, the decisions the user made, the braids in order with their state, the coordinator thread and braid number of each, which braid is next, the parallel limit, and a dated change log. A new PM thread resumes from it.
  - **Running.** For each ready braid, up to the limit (default 2; the user may change it), launch a coordinator thread as the braid skill's "Plan" step 0 does. Use the coordinator model from `BRAID.md`. The first message carries the braid's goal, the user's decisions that bind it, and the PM's thread id. Pick parallel braids that don't touch the same commands, files or decisions; otherwise order them. When a braid finishes or stops, update the plan and start the next one without a go.
  - **Answering coordinators: the PM is the user's proxy.** A coordinator's open request (plan approval, a handover, a decision or stop case) reaches the PM as a thread message. The PM answers it in the coordinator's thread as the user would. The test is the cost of reversing the decision. Cheap to reverse means the PM decides: a UI change, rewriting a function, a module's internal shape, a library swap behind one interface. Expensive to reverse means the user decides: the platform or technology (for example .NET versus Rust), the form of the product (for example web app or VS Code extension), the contracts between braids, anything irreversible outside the repository, security, or data loss. When unsure, the PM asks the user. The PM logs every decision it makes for the user (`Decided:` on the braid, through its coordinator) and sends the user a short digest from time to time, not per braid.
  - **Replanning.** When the user says something, the PM updates the plan file and tells the user in a few lines what changed. For braids that haven't started, it changes the plan only. For running braids, it sends the change to their coordinator (who adjusts as "Adjusting the plan" says) or tells the coordinator to stop at a clean point. It never edits a braid's brief itself.
  - **Hold.** "Hold" or "pause" from the user stops new launches and passes the hold on to the running coordinators.
  - **Merges without the user.** The user should not have to come back for each braid. The PM launches every braid on a preset with `merge: all` (the shipped `free`), with a `## Autonomy` exception line. That line sends security, data, outward and expensive-to-reverse cases to "ask", and asks reach the PM, which escalates them as above. So strands, stories and final PRs merge into `main` without the user, once the PM's live check has passed. If the project's `AGENTS.md` keeps `main` the user's (as this repository's does), the PM says so once at the start. Those merges then go into the user's digest as one batch.
  - **Checking the result live.** Before a story's or a final PR's merge, and after it merges, the PM checks what was actually built. It does not rely on reports alone. It launches a checker subagent (`delegate_task`, `isolation: worktree`, the coordinator model) on the PR head. The checker builds and runs the software as `BRAID.md` `run` says and tries the braid's goal the way a user would: the CLI, the browser preview, the app. It reports what works and what doesn't, with evidence (commands and output, screenshots). A failure goes back to the braid's coordinator as a fix, or becomes a new braid in the plan. Only an expensive-to-reverse finding goes to the user. Where the software can't be run live, the checker says why and checks what it can.
  - **Titles.** Thread title `🧭 <repo> pm: <short goal>`. The PM's own thread holds no braid.
- `.agents/skills/braid/SKILL.md`: a short "Launched by a PM" rule. When the first message names a PM thread, every open request the coordinator would put to the user (`braid ask`, a handover) is still opened on the board, and its full message is also sent to the PM thread with `t3_thread_send`. A reply from the PM counts as the user's reply, within the limits above. The coordinator also messages the PM when its braid is Done or stopped. Without a PM nothing changes.
- `test/pester/Install-Skills.Tests.ps1`, `docs/getting-started.md`, `README.md`: the new skill is installed with the others, listed and linked.
- `docs/decisions.md`: one decision with its reasons (one PM per project, which owns the plan; coordinators stay one per braid; the PM answers everything except product-shaping questions; the plan file lives on its own branch).

## Already decided

- The user, 2026-11-21: several braids run in parallel, up to a limit; the plan lives in a file on the PM's own branch; the PM starts the next braid without asking; the PM is very autonomous and acts as the user's proxy toward the coordinators. In the user's words: "reversing some UI or rewriting some function is cheap but for example changing .NET platform to Rust is expensive". The user only hears about decisions that are hard to change and shape the product (platform, technology, the form of the product, connections between streams). Smaller decisions reach the user in a periodic digest, not per braid.
- The user, 2026-11-21: "the problem with [steady] is that I have to get back for each braid". The PM checks what was done itself, opening and testing the software live where possible, and continues mostly without the user. An experimental project; the user wants it this way.
- PM-run braids use the shipped `free` preset with a `## Autonomy` exception line, not a new preset.
- One braid per coordinator thread stays absolute (0050). The PM launches coordinators and never plans or runs a braid itself.
- The user, 2026-11-21: "when it's run by PM, the braid coordinator should not ask for modal user input as it does now." Under a PM the coordinator never uses the question tool (AskUserQuestion in Claude Code, a pending request in T3) and never asks the user in chat. It still opens the request on the board (`braid ask` / `braid handover`), sends the full message with its options to the PM thread with `t3_thread_send`, and ends its turn; the PM's reply, or the user's answer on the board, wakes it.
- No CLI or board change in this braid. The board keeps showing braids as it does; coordinators still open their requests on it, so the user can see and answer them there too.
- Related to 0036 (Coordinator polish from the thread review, Outline on `main`): both change `.agents/skills/braid/SKILL.md`. This braid adds only the "Launched by a PM" rule. 0036 starts after this merges and plans on top of it.

## Out of scope

- The board or CLI showing the PM's plan, a `braid pm` command, PMs across several projects (0045 option 4), and a PM started on a schedule.
- Changing the shipped presets or adding one.
- Changing `AGENTS.md` or `BRAID.md`.

## Failure modes

- Two parallel braids change the same file or decision, and the second coordinator's merge conflicts. The skill makes the PM check overlap before it runs braids in parallel, and tell their coordinators the order.
- The PM answers a product-shaping question itself. The skill names the escalated kinds concretely, and when unsure the PM asks the user.
- The PM thread crashes or is summarized. A new PM resumes from the plan file and from `braid list --open`, and re-attaches to running coordinators by their thread titles. The skill has a short "Resuming" section for this.
- A braid merges into `main` and breaks what earlier braids built. The live check runs the whole software on the PR head, not just the new feature. A failure after the merge becomes a fix braid that runs next.
- The checker can't run the software (no `run` in `BRAID.md`, or no display). It says so and what it checked instead. The PM doesn't treat that as a pass for anything the checker couldn't run, and names it in the digest.
- A coordinator waits on the PM while the PM waits on the user. The coordinator's request stays open on the board, so the user can still answer it there.

## Completion

- [x] `.agents/skills/braid-pm/SKILL.md` exists and covers taking a goal, the plan file, running in parallel up to a limit, answering coordinators as the user's proxy (reversal cost decides), the digest, replanning, hold, merges under `free` with its exception line, the live check before and after a merge, and resuming.
- [x] The braid skill has the "Launched by a PM" rule, and nothing changes for a coordinator without a PM.
- [x] The "Launched by a PM" rule says the coordinator never uses the question tool or asks the user in chat under a PM: it opens the request on the board, sends it with its options to the PM thread and ends its turn; without a PM the question tool rules stay as they are.
- [x] `scripts/Install-Skills.ps1` installs `braid-pm` (the Pester test names it), and `docs/getting-started.md` and `README.md` list it.
- [x] `docs/decisions.md` records the decision and its reasons.
- [x] The gate command from BRAID.md passes.
- [x] report.md written: what changed, why, validation, anything open.

## Plan

1. `.agents/skills/braid-pm/SKILL.md`: taking a goal, the plan file and its branch, running up to the limit with an overlap check, answering coordinators by reversal cost, the digest, replanning, hold, merges under `free` with the exception line (quoted once, so every coordinator gets the same text), the live check before and after a merge into `main`, resuming, titles. `assets/plan.md`: the plan file template. `agents/openai.yaml` like the other skills.
2. `.agents/skills/braid/SKILL.md`: a "Launched by a PM" section after "Autonomy": requests still opened on the board and also sent to the PM thread; asked in chat, not with the question tool (a pending question would hold the PM's replies); the PM's reply counts as the user's; a new braid goes to the PM instead of a launch; Done or stopped is messaged to the PM. Without a PM nothing changes.
3. `scripts/Install-Skills.ps1` already installs every `braid-*` folder; the Pester test names `braid-pm` and checks its link to the braid skill resolves.
4. `docs/getting-started.md`, `README.md`: list and link the skill. `docs/decisions.md`: D82 and a log line.
5. Gate, report.
