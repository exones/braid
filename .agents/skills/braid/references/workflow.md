# Braid workflow

How work is organized in a project that uses braid: what an item is, who writes where, who sets Done, where gaps go, which branches and PRs each case has, the tiers and who merges. Project values (gate, main branch, models) come from `BRAID.md`; this file never overrides them. Fields and commands are in [the brief template](../assets/brief.md); the coordinator's steps are in [the skill](../SKILL.md).

## Items are braids

- An item is a braid of any size, kept in `braids/<number>-<slug>/`. A **story** is a braid without strands: one PR. A **goal** is a braid with strands (`0012/A`, `0012/B`), one PR each; a story that grows gets strands, its phases. The braid carries the goal, scope and decisions; strands carry the work.
- The braid's log has one entry per merged strand ([format](../assets/brief.md#work-on-it)); workers and a resuming coordinator read it.
- Kinds: **story** (a usable outcome, one PR), **task** (technical support work), **spike** (a time-boxed question; the answer, evidence and proposed follow-ups are its report, and the coordinator turns the follow-ups into briefs).
- Statuses are `Outline`, `To Do`, `In Progress`, `Done`. There is no `In Review`: an open PR is in review. Blocked means a dependency isn't Done, or the log says what it waits for.
- An `Outline` holds only the goal, what works at the end, strand titles and open questions. It is never started as it is: the coordinator details it into a full brief when its turn comes.
- Run order is `order`, then dependencies.
- A dropped strand gets a log entry on its braid saying why, and its folder is removed; its letter is never reused.

## One writer per branch

Each branch has one writer, and its copy of a brief is the truth on that branch.

- The **coordinator** holds `plan/<slug>`, then the braid branch, and a new story's branch only until the worker is launched; for a lone story it holds no branch after launch. Only it creates and restructures items, on a branch it holds; a worker proposes them. It works in its own worktree, on the branch it holds, and never commits in the user's checkout.
- The **worker** holds its item's branch and owns that item's folder on it: `In Progress` in its first commit, the plan before coding, log entries, its Completion boxes and `report.md`. It never accepts or sets `Done` and makes no commit after CI is green.
- The coordinator never commits to a branch a worker holds. The one exception is the Done stamp that `braid accept` commits on a story's or the final PR's branch after its worker has stopped.
- A change to a running item's brief goes to the worker as a message; the worker applies it, and merges the braid branch first if the change needs something the coordinator added there.
- A goal's braid item is the coordinator's from the start: `In Progress` in the first commit after the planning merge, `Done` at the end.
- **Acceptance** is the coordinator's, once, after review, fixes and green CI: `braid accept <id>` sets Done where it holds the base and records head, review link and thread:
  - a strand: after its merge, on the braid branch, in the commit that carries the braid's log entry;
  - a story or the final PR: after review and green CI, in a status-only commit on its branch before the handover.

  `braid accept` checks the PR first (base, reviewed head, `ci` checks, mergeable, Completion boxes ticked, `report.md`, no running worker); a refusal names the condition that failed and changes nothing.
- So a brief changes on `main` only by merging a PR, and a strand shows `Done` on its braid branch once it is merged.
- The exception is the inbox branch `braid-inbox`: only braid commands write it (`braid note` and `braid inbox take|pass|drop|reopen`), each as one commit pushed at once, from any thread or worktree. Nobody commits to it by hand.

## Gaps and the inbox

A gap found during an item is routed by this table, without asking the user. The inbox holds two kinds of entry: **leftovers** (gaps no PR fixed) and **ideas** (the user's thoughts for later).

| Found when | Goes to |
| --- | --- |
| Blocking | the same PR |
| Non-blocking, small, in files the PR already touches, before merge | the same PR, if the coordinator decides so |
| Anything else: non-blocking findings, unfinished bits, `For later items:` gaps | a leftover |
| The user's side observation while an item runs | an idea if it is new, a leftover if it is about the work at hand |

A leftover is read later by an agent who never saw the item. Write a title line, then two to five lines: what is wrong or missing, where (files, functions), and why it matters. Always give `--from`, and `--ref` with the review comment or PR link when there is one. Never a bare pointer such as "see the report".

```sh
'Retry the fetch in braid start

startCommand (src/commands/start.ts) gives up on the first network error, so a flaky
connection fails the whole start. One retry with a short wait would cover it.' | braid note --from 'review 0008/B' --ref <comment url> --file -
```

Ideas are written as the `braid-idea` skill describes. They never expire and are never proposed for review; only the user drops one or asks for it to become braids. Leftovers are emptied in batches by a sweep (the skill, "Sweep").

## Branches per case

| Case | Branches | PRs | Briefs |
| --- | --- | --- | --- |
| Story | `braid/<number>-<slug>` from `main` | one into `main` | created on the new branch before launch; Done on it before the handover |
| Planned goal | `plan/<slug>` and the braid branch `braid/<number>-<slug>`, both from `main`; each strand `braid/<number>/<letter>-<slug>` from the braid tip | planning PR into the braid branch (the coordinator merges it under the plan's approval); each strand into it; one final PR into `main` | braid and strands created on `plan/`; `main` gets them with the final PR; each strand Done on the braid branch after its merge, the braid Done on it before the final handover |
| Grown story | the story's branch becomes the braid branch | the story PR is closed; strand PRs into the braid branch; one final PR into `main` | strands added on the braid branch; the braid stays In Progress and from here follows the planned goal |

Merge `main` into a braid branch before the next strand and before the final PR. Never rebase or force-push shared branches. Every commit uses Conventional Commits.

The user looks at the work with `braid board` (read-only) from their own checkout of `main`. It reads each item from its own branch. An item shows To Review after `braid handover` and Needs You after `braid ask` (or on failing checks). Once merged it shows Done, and `braid status` ends its line with `run braid accept <id>` until it is stamped.

## Starting the next item

Goal: `braid next <number>` names the next ready strand or says why none is. One whose PR was closed unmerged follows [resuming](resuming.md). `braid start <id>` then makes its branch and worktree. Story: there is no next item.

## Tiers

Every item has one `tier:` label; pick the lowest that fits. The tier decides the review, not who merges.

| Tier | Typical work | Review |
| --- | --- | --- |
| S | Small script, doc, config, or contained fix | Coordinator reads the diff |
| M | Normal feature | Independent reviewer comments on the PR |
| L | Persistent data formats, crash or recovery behavior, release or publishing, security, any change to agent instructions (skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`) | Independent reviewer, again after fixes that substantially change failure or recovery behavior; the brief lists failure modes and required regression tests |

## Who merges

The user merges, whatever the tier. The coordinator merges in three cases only:

- the user explicitly asks it to merge a PR ("Merge on request" in the skill); this may be any PR, including a story or the final PR into `main`;
- the planning PR of a goal whose plan the user approved: the approval covers its merge into the braid branch, once its checks are green and pinned to the approved commit; a PR holding anything else goes back to the user;
- the braid's [autonomy preset](autonomy.md) lets it: `merge: strands` its strand PRs into the braid branch, `merge: all` also a story's or the final PR into `main`.

## Checks and reports

- The `gate` from `BRAID.md` passes before every PR. CI evidence is `gh pr checks` green on the PR's latest commit, limited to the `ci` names if listed; a required check that never reports isn't green. The worker alone waits on an item PR's CI (D77) and reports when it is green; the coordinator reads `gh pr checks` once and waits only where a wake is reliable ("Say waiting" in the braid skill). With `ci: none` the gate run is the evidence.
- The PR description says what changed, why, how it was checked and what is open. The worker's `report.md`, its final chat report and the coordinator's recap say the same.
- **Converge loop.** A `ui` item, or one whose brief says the user chooses the shape (design, names, wording), starts with a proposal on realistic test data, and the worker stops. Each verdict of the user goes into the item's log at once; rounds repeat until the user approves; only then is it built.

## Failure modes

| What happened | What to do |
| --- | --- |
| A brief is edited on two branches | Only the owning branch edits a brief. Merge the other branch in, keep both sides' sections, the more advanced status and the union of dependencies; log files never conflict. Run `braid check`. |
| Branch protection refuses a merge | Never `--admin` or another bypass. `braid ask` and wait for the user. |
| `braid edit --dep` says an id doesn't exist | Lookups read only the current checkout. Create the prerequisite on the branch where the dependency must resolve, or merge the branch that has it. |
| A worktree folder can't be deleted | On Windows the worker's agent process, or T3 for a finished reviewer's checkout, holds it for a while after the report. `braid clean --yes` keeps it ("still in use"); run it again once the session has ended. |
| A worker ends without a report, or its run fails | The skill, "Run an item" step 3. |
| A reviewer task returns nothing, an empty result or a failure | The PR's review comment at that head is the record; without one, one fresh task, then `braid ask`. The skill, "Accept and hand over" step 1. |
| A worker proposes growth beyond the mandate | The skill, "Grow and adjust". |
| CI is red on a braid branch or a final PR | The skill, "Fixes". |
| A PR's head moved after its recap or review | The skill, "Merge on request"; under a preset, [autonomy](autonomy.md). |
