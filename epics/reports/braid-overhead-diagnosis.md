# Why braid is slow, and how to make workers act like engineers again

Date: 2026-11-05. Scope: the braid worker/coordinator skills, their supporting documents on `main` and `epic/braid-003-worker-skill` (`3101d84`), epic 004 records, and the actual item C threads. Read-only analysis; nothing in the process was changed.

## Summary

Braid is not slow because the agents are slow. It is slow because every item pays a large fixed tax of ceremony, and the instructions tell agents to distrust everything, including their own previous step. A one-script item (BRAID-004/C) took about 1 h 36 min from dispatch to merge-ready. Roughly 35–40 minutes of that was implementation. The rest was startup reading, repeated checkout verification, a startup replay, waiting on a CI wake that never arrived until the user nudged twice, and the same CI evidence being re-verified by three different agents. The item also produced about 145 KB of process records in 31 files for one helper script.

There are five root causes:

1. **Zero-trust by default.** The rules say no fact counts until the current agent verifies it "independently". Worker, coordinator and reviewer each re-check the same Git state, the same CI runs and the same artifact hashes.
2. **Rule accretion from incidents.** Each anomaly (a quoting bug, a stalled yield, a stale SHA) became a permanent rule, a new document section, and often a new backlog item. The worker's mandatory reading is now ~7,800 words with about 189 negations ("never/not/no/without"), roughly one prohibition every 40 words.
3. **Briefs that inflate scope.** The coordinator writes 10–14 KB packets and backlog items that turn "a small Git check" into a 1,003-line script plus a 957-line fixture covering Unicode, renames, linked worktrees and drift.
4. **The process mostly works on itself.** 174 of 208 non-checkpoint commits are `docs`; 126 are "record/checkpoint/persist/prepare/binding" commits. On the epic-003 branch, that epic's records are 1.2 MB, while `src/` is 62 KB.
5. **Too many serial gates per item.** These are a packet commit, a binding message, CI on four jobs, a worker artifact proof, a coordinator "green inspection", a separate review thread, a triage file, an acceptance file, and a human merge into the epic branch. Later the same work needs a human merge into main.

What braid gets right, and should keep: one writer per checkout, a clean-context independent reviewer, human authority over merge/publish, no secrets in files, and file-based handoff so a fresh agent can resume. These match current best practice. The fix is to keep these few invariants, delete most of the rest, and scale ceremony to risk.

## What actually happened on item C

Thread [BRAID-004/C startup checks](t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:66599ea98e70440fa3fc3ac12f74965760e833f31cfb2e1a2dfd4a06b287869d) (implementation) and [C-git-startup-check-review-001](t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/mcp:launch:e6a8adbb39e259d66f2961404c5f1dd6a2406f51d16f89d6451e6f932765fe41) (review). Times are UTC.

| Time | What the agents did | Useful? |
| --- | --- | --- |
| 10:22–10:23 | Worker reads skill and packet, verifies the checkout (1st time). | Yes, briefly |
| 10:23–10:34 | 29 file reads, 17 searches, 4 Git/PowerShell experiments before the first edit. Many reads are policy docs, not code. | Partly |
| 10:34 | First edit: 998-line helper written in one go. | Yes |
| 10:35–10:45 | **Startup replays inside the same run.** It rereads skill and packet, verifies the checkout (2nd time, wrong cwd), verifies again (3rd), and rereads the whole context batch. | No: about 10 minutes lost |
| 10:45–11:21 | Implementation, PowerShell debugging, fixtures, `npm run verify`. | Yes |
| 11:21–11:25 | Writes checkpoint and report, commits, opens PR #24, registers watch. | Mostly |
| 11:25–11:31 | CI finishes, but the watch wake never runs (later runs queue behind a run the host still considers active). | No |
| 11:31 | User: "Are you still waiting? The checks passed." Worker rereads skill and checkpoint, re-verifies CI, downloads four artifacts and rehashes them. | Partly |
| 11:34–11:37 | **Second replay**: "I'll read the worker skill and the current checkpoint first…". User: "Believe me and pass the job to the coordinator." | No |
| 11:38 | Coordinator "green inspection" downloads the same four artifacts, recomputes the same hashes and checks merge-test parents. | Duplicate |
| 11:40–11:49 | Reviewer verifies the checkout, re-checks the same CI runs and runs the fixture. Its code review is the genuinely useful part. | Partly duplicate |
| 11:53–11:58 | Coordinator launches another thread for a "worker-entry observation" trial of the new checker. | Process research, not delivery |
| 12:02 | Human merge. | Yes |

Before dispatch, the same item had a null-worker "startup probe", a passive cross-check, a 14 KB backlog item, an 11 KB packet with prepared `Get-Content | Select-Object -Skip` read batches, and binding JSON contracts.

A normal engineer given "add a script that checks we're on the right branch with a clean tree" writes 50–150 lines, runs it, and opens a PR. That takes 15–30 minutes.

## Diagnosis

### 1. Distrust is the default, so everything is verified repeatedly

The skills repeatedly require independent verification. Worker text includes "independently verify your checkout and your own acceptance evidence", "verify every check the packet declares independently", "Reconfirm current head after proof before handoff", and "A worker claim is not independent acceptance". The coordinator must "inspect actual diff and full current-head check evidence"; the reviewer re-reads the CI. Nobody is allowed to rely on anyone else, including GitHub's own check conclusion. One worker even refused the user's direct statement that checks had passed until it had re-derived it.

Real engineering teams work on layered trust. CI is the authority on CI. The author is trusted about what they ran. The reviewer reads the code. Re-verification happens when something looks wrong, not as a ritual.

### 2. Every incident became a rule; the rules now cost more than the incidents

Examples:

- A PowerShell `@{upstream}` quoting failure led to item C: a 1,003-line workspace checker, a 957-line fixture, JSON contracts for four roles, and two observation trials.
- One host stall led to a "stalled yield recovery" section with run-lineage, queued-message and generation bookkeeping, now in both the skill and the reference.
- Stale-SHA confusion led to "commit boundary", "post-push supplements", "self-SHA evidence loop" and "merge-test source versus PR head" rules, plus a 1,198-line `Test-PrProof.ps1`.
- Reviewer naming confusion led to a multi-paragraph naming and indexing standard with legacy aliases.

Each rule is locally reasonable. Together, they make the agent spend its attention checking compliance instead of doing the job. Anthropic's context-engineering guidance names this anti-pattern: teams "stuff a laundry list of edge cases into a prompt in an attempt to articulate every possible rule… We do not recommend this."

### 3. The instructions are hard to read, and that makes agents slower and more anxious

The skill text is compressed legal prose: slash chains ("root/branch/full HEAD/PR"), long negation lists ("Pending, failed, missing, skipped, cancelled, neutral, inaccessible, inconclusive or stale evidence never silently counts green"), and many cross-references. To finish one item, a worker must load the worker skill, AGENTS, the Agile workflow, delivery rules, report format, the T3 continuation reference, the commit boundary and record ownership. Each is declared the "singular authority" for its part. When instructions are dense, overlapping or seemingly contradictory, models spend reasoning reconciling them. That shows up as rereads, re-verification and replays. OpenAI's GPT-5 prompting guide warns about exactly this cost.

### 4. Briefs inflate scope instead of bounding it

The coordinator is told to "do substantial architecture work here once" and to freeze proof and continuation before dispatch. In practice the brief becomes a specification of every edge case the coordinator can imagine. C's acceptance criteria require fixtures for wrong root, linked worktree, detached HEAD, origin fetch/push mismatch, upstream states, staged, unstaged, untracked and unmerged files, spaces, Unicode, renames, malformed contracts, failed Git calls and HEAD drift. The worker then dutifully builds all of it. The size of the output is set by the brief, not by the problem.

Anthropic's multi-agent research system found that "agents struggle to judge appropriate effort levels" and fixed it with explicit scaling rules in the orchestrator prompt. Braid has no effort scaling: every item gets the full machine.

### 5. The fixed cost per item is very high, and gates are serial

Per item, the current flow is:

1. Backlog file.
2. Packet commit.
3. Epic and item branch.
4. Host worktree.
5. Top-level thread and binding message.
6. Worker report.
7. Worker checkpoint.
8. PR with the human account plus technical record.
9. PR comment.
10. Thread result message.
11. Four CI jobs.
12. Worker artifact proof.
13. Coordinator green inspection file.
14. Review packet, binding JSON and thread.
15. Review report and checkpoint.
16. Triage file.
17. Acceptance file.
18. Epic table row and log line.
19. Human merge into the epic.

Later, the human also merges the epic into main. The same facts (SHA, PR, check runs) are written into about eight places. With one worker at a time and a human merge stop between dependent items, nothing overlaps.

### 6. The system has turned into its own main product

Most effort goes into refining the process: epic 003 (worker skill) and epic 004 (performance) are both about braid's own agent workflow, with probes, trials, canary failures and observation JSON. That work produces more rules, and the rules make the next item slower. The slowness is reinforcing itself.

### 7. Git and host paranoia

The skill's checkout batch is reasonable once. But the documents also cover the following:

- Verifying upstream, origin fetch and push URLs, and index state.
- Merge-test parent relationships.
- Reconfirming head after proof.
- "Every added commit invalidates" proof, plus rules about when record files may still be edited after push.

Combined with startup replays, the worker re-verifies Git three times in ten minutes. Host transport issues (wakes queued behind a stuck run) are real, but the remedy has been more protocol (generations, lineage, readiness handshakes) instead of a simpler path that tolerates a missed wake.

## How braid compares with current multi-agent guidance

| Practice | Source | Braid today |
| --- | --- | --- |
| Start with the simplest thing; add agents and steps only when they demonstrably help | Anthropic, [Building effective agents](https://www.anthropic.com/research/building-effective-agents); OpenAI, [A practical guide to building agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/) | Full multi-role pipeline for every item, including one-script changes |
| Scale effort to task complexity, with explicit rules in the orchestrator | Anthropic, [multi-agent research system](https://www.anthropic.com/research/multi-agent-research-system) | No tiers; every item gets the maximum process |
| A delegation brief states objective, output format, tools/sources guidance and task boundaries | Same | Briefs are 7–14 KB and mix scope with Git forensics, CI artifact rules and continuation protocol |
| Smallest set of high-signal tokens; "right altitude"; canonical examples, not edge-case lists | Anthropic, [Effective context engineering](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents) | ~11k tokens of mandatory rules, mostly prohibitions and edge cases |
| Remove contradictory or overlapping instructions | OpenAI GPT-5 prompting guide | Many "singular authorities" that all restate parts of each other |
| Keep writes single-threaded; extra agents add intelligence, such as a clean-context reviewer | Cognition, [Don't build multi-agents](https://cognition.com/blog/dont-build-multi-agents) and [What's actually working](https://cognition.com/blog/multi-agents-working) | **Matches**: one writer per checkout, independent reviewer |
| Guardrails proportionate to risk; human in the loop for high-impact actions | OpenAI practical guide | Human merge/publish gates **match**; but low-risk steps get high-risk treatment |
| Watch agents work step by step, then fix the prompt that caused the waste | Anthropic research system ("think like your agents") | Done, but each fix added text instead of removing it |

## Proposals

These are ordered by impact. Items 1–4 alone should bring a small item back to roughly 20–40 minutes, including CI.

### 1. Rewrite the worker skill as one page in plain language

Target about 500–700 words, written as positive instructions for a competent engineer. A draft is in the appendix. The key changes are:

- **Trust the packet and the environment.** Check the checkout once with `git status -sb` and `git log -1 --oneline`. If it looks right, start working. Re-check only when a command fails or something looks off.
- **Do the job first.** Read the files you will touch, implement, run the project's gate (`npm run verify`), and fix what fails.
- **Make CI the authority on CI.** When checks are green on your PR's head, you are done. Do not download artifacts or recompute hashes. If artifact integrity matters, make CI verify it in a workflow step.
- **Treat the PR description as the report.** Skip the separate checkpoint unless you stop mid-work with something unfinished.
- **Believe the user.** If the user says checks passed or the PR exists, accept it.
- **Never replay startup.** If you see the task prompt again in the same run, continue where you were.

Move rationale, history, host quirks and incident notes out of the skill into a separate `docs/` page that no one has to read routinely.

### 2. Cap and simplify the coordinator's packet

Use one page with fixed sections (draft in appendix):

- Goal.
- Context links (3–5).
- In scope / out of scope.
- Acceptance criteria (3–6 testable bullets).
- How to check.
- Delivery (branch, PR base, who gets the result).

Drop the Git contract (beyond the branch name), the frozen hosted check prose (CI config is the definition), verified dependency tables unless a dependency is actually in play, and continuation mechanics (those belong in the skill, once).

Add a coordinator rule: **specify the outcome, not the implementation's edge cases.** If a brief's acceptance list is longer than the expected change, cut it.

### 3. Introduce effort tiers and pick one per item

| Tier | Typical item | Process |
| --- | --- | --- |
| S | A script, a doc change, a small fix (≲200 lines, no state formats, no release paths) | Short packet, worker does the work and opens a PR, CI green, coordinator or reviewer skims diff, merge. No separate report, checkpoint, triage or acceptance files. |
| M | Normal feature or story | As S plus an independent reviewer thread. PR body is the report. |
| L | Ledger/state formats, crash or recovery semantics, release/publish, security | Today's rigour: explicit failure modes, artifact provenance, fresh-context review, milestone checks. |

The coordinator states the tier in the packet. C would have been tier S.

### 4. Verify each fact once, by the party best placed to know it

- Git checkout: the worker, once at start.
- Tests and build: CI, plus the worker's local `npm run verify`.
- CI status: GitHub. Everyone reads the same `gh pr checks`, and nobody rehashes artifacts.
- Code quality and correctness: the reviewer.
- Merge: the human.

Delete coordinator "green inspection" files and the requirement that reviewers re-prove CI. Keep `Test-PrProof.ps1` (if at all) only for tier L release candidates.

### 5. Collapse records to one place per fact

| Fact | Single home |
| --- | --- |
| What changed, why, how verified | PR description |
| Item status | One row in `epic.md` |
| Resume point while work is paused | Worker checkpoint, only when needed |
| Review findings | Review comment on the PR (or one review file) |
| Merge | GitHub |

Stop writing triage, acceptance, green-inspection, binding JSON, observation JSON and log lines for routine items. Stop committing records solely to "record X start".

### 6. Put a budget on the rules, and stop turning incidents into rules

- Word budgets: AGENTS ≤ ~600 words, worker skill ≤ ~700, coordinator skill ≤ ~900. A new rule must replace or merge an existing one.
- Only codify a rule after the same failure happens at least twice. A one-off host glitch gets a note in a troubleshooting doc, not a skill paragraph.
- Prefer a short example ("good startup looks like this") over a list of what never to do.

### 7. Reduce serial human gates inside an epic (your decision)

Today each item needs a human merge into the epic branch, and later a human merge into main. One option is to let the coordinator merge item PRs into the epic branch once CI is green and the reviewer has no blocking findings. You would keep the human merge for epic-to-main, for releases, and for any tier L item. This changes merge authority, so it needs your explicit decision. Without it, a dependent item always waits for you, however fast the agents are.

### 8. Freeze process work for a while and ship product

Pause further work on braid's own workflow (probes, trials, binding contracts, observation suites) for the next several product items. Measure with two simple numbers per item: minutes from dispatch to PR, and minutes from PR to merge-ready. If those are fine, the process is fine. Only revisit the process when a number is bad, and fix it by removing text first.

### 9. Make the CI wait boring

The best path is a single long-lived top-level worker thread that watches its PR and treats any wake (including a user message) as "check `gh pr checks` once; if green, send the result; if red, fix". If a wake is lost, the coordinator or user nudges it, and the nudge is enough. Drop generation and lineage bookkeeping from the worker's mental load; it belongs to the host.

## Suggested next step

Write the one-page worker skill and one-page packet template below into the skills on a fresh branch, mark everything else in the skill references as "background, read only when needed", and run the next real product item as tier S. Compare its dispatch-to-PR time with item C's ~63 minutes.

## Appendix A: draft one-page worker skill

```markdown
# Braid worker

You are an engineer given one task by the coordinator. Do that task well and hand it back.

## Start
1. Read the packet you were given and the files it links. Read AGENTS.md if you have not seen it.
2. Run `git status -sb` and `git log -1 --oneline`. If the branch and commit match the packet, start working.
   If not, tell the coordinator what you see and stop writing until it answers.

## Do the work
- The packet's goal and acceptance criteria are your plan. Don't re-plan or re-research unless something contradicts it.
- Read the code you will change and its neighbours, then edit. Keep the change as small as the goal allows.
- Run focused tests while you work, then `npm run verify` before you open the PR. Fix failures; never weaken or delete a test to pass.
- Make routine choices yourself. Ask the coordinator only about things that change scope or acceptance.

## Deliver
1. Commit only your files with a Conventional Commit message, push your branch, open one PR to the packet's base, and link it.
2. The PR description is your report: what changed, why, how you checked it, anything left open.
3. Watch the PR. When checks are green on your latest commit, send the coordinator one short message: PR link, head SHA, "checks green", anything they need to know. You're done.
4. If a check fails, read the log, fix it, push, and wait again. If it's outside your control, tell the coordinator what's blocked and who can fix it.

## Ground rules
- One writer per checkout: stay on your branch; no reset, clean, rebase, or force-push.
- Don't merge, publish, deploy, or handle secrets.
- Trust what you've already checked and what the user tells you. Re-check only when something fails or changes.
- If you see your task prompt again in the same session, keep going from where you are.
- If you must stop mid-task, leave a short `checkpoints/<ID>.md`: where you are and the next step.
```

## Appendix B: draft one-page packet template

```markdown
# <Epic>/<ID>: <title>  (tier S|M|L)

Goal: <one or two sentences: the outcome and who benefits>

Context: <3–5 links: the files to change, a pattern to follow, a relevant decision>

In scope: <bullets>
Out of scope: <bullets>

Done when:
- <testable criterion>
- <testable criterion>
- `npm run verify` and PR checks green

Check with: <commands, e.g. `pwsh -File test/fixtures/x/Test-X.ps1`, `npm run verify`>

Delivery: branch `<item branch>` from `<short SHA>`, PR into `<base>`, send result to <coordinator thread>.
```

## Appendix C: numbers used in this report

- Mandatory worker reading (AGENTS, worker skill, T3 continuation, delivery, packet template, report format, Agile workflow on `main`): ~7,800 words. The `epic/braid-003-worker-skill` versions are larger (worker skill 13.5 KB, continuation 12.3 KB, delivery 14.9 KB, Agile workflow 18.6 KB).
- Negations ("never/not/no/without/cannot") in that set: 189. "verify/reconcile/independent": 72. Words about implementing or editing: 38.
- Commits (all branches, excluding T3 checkpoints): 208, of which 174 are `docs`, 13 `feat`, 10 `fix`, 7 `test`. 126 subjects are record/checkpoint/persist/prepare/binding/triage/retain.
- Lines added across history: `epics/` 76k, `src/test/scripts` 31k, policy 8k.
- On `epic/braid-003-worker-skill`: `epics/braid/003-worker-skill` 157 files, 1.2 MB; `src/` 62 KB; `test/` 147 KB.
- Item C: 22 files, +2,277 lines (helper 1,003, fixture 957); about 145 KB of process records in 31 files under epic 004 (packets, backlog, reports, reviews, validation JSON).
- Item C thread: first edit 12.5 minutes after start, after 29 file reads, 17 searches and 4 experiments. The checkout was verified three times and startup replayed twice. The CI wake was missed, and the user nudged twice.
