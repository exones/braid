# Braid workflow

How work is organized in a project that uses braid. Project values (gate, main branch, models) come
from `BRAID.md`; this file never overrides them. Fields and commands are in [the brief
template](../assets/brief.md).

## Items are braids

- An item is a braid of any size, kept in `braids/<number>-<slug>/`. A story is a braid without
  strands: one PR. When it grows it gets strands (`0012/A`, `0012/B`), one PR each: its phases. The
  braid carries the goal, scope and decisions; strands carry the work. The braid's log has one entry
  per merged strand, written before the next strand starts; workers and a resuming coordinator read it.
- Kinds: **story** (a usable outcome, one PR), **task** (technical support work), **spike** (time-boxed
  question; the answer, evidence and proposed follow-ups are its report).
- Statuses are `Outline`, `To Do`, `In Progress`, `Done`. There is no `In Review`: an open PR is in
  review. Blocked means a dependency isn't Done, or the log says what it waits for. A dropped strand
  gets a log entry on its braid saying why, and its folder is removed; its letter is never reused.
- Run order is `order`, then dependencies. `Outline` items are never started as they are.

## One writer per branch

Each branch has one writer, and its copy of a brief is the truth on that branch.

- The **coordinator** holds `plan/<slug>` and the braid branch, and a new story's branch only until
  the worker is launched. It creates and restructures items there. Its own worktree is on `plan/<slug>`,
  then on the braid branch; for a lone story it holds no branch after launch.
- The **worker** holds its item's branch and owns that item's folder on it: `In Progress` in its first
  commit, the plan before coding, log entries, the boxes it proved and `report.md`. It never sets
  `Done` and makes no commit after CI is green. The coordinator never commits to a branch a worker holds, except the Done stamp `braid done` commits on a story's or the final PR's branch after its worker has stopped (D43). A change to
  a running item's brief goes to the worker as a message; the worker applies it, and merges the braid
  branch first if the change needs something the coordinator added there.
- **Done** is the coordinator's, through `braid done <id>`, where it holds the base: a strand after its
  merge, on the braid branch (in the commit that carries the braid's log entry); a story or the final PR
  after review and green CI, in a status-only commit on its branch before the handover (the worker has
  stopped by then). `braid done` checks the PR first (base, reviewed head, `ci` checks, mergeable, boxes
  ticked, `report.md`, no running worker) and names the condition that failed. An open PR reads as in review.
- So a brief changes on `main` only by merging a PR, and a strand shows `Done` on its braid branch once
  it is merged.

## Branches per case

| Case | Branches | PRs | Briefs |
| --- | --- | --- | --- |
| Story | `braid/<number>-<slug>` from `main` | one into `main` | created on the new branch before launch; `braid done` sets Done on it after review, before the user's merge |
| Planned goal | `plan/<slug>` and the braid branch `braid/<number>-<slug>`, both from `main`; each strand `braid/<number>/<letter>-<slug>` from the braid tip | planning PR into the braid branch (the approval); each strand into it; one final PR into `main` | braid and strands created on `plan/`; the braid In Progress in its branch's first commit after the planning merge; `main` gets them with the final PR; `braid done` sets each strand Done on the braid branch after its merge, and the braid Done on it after the final review |
| Grown story | the story's branch becomes the braid branch | the story PR is closed; strand PRs into the braid branch; one final PR into `main` | strands added on the braid branch; the braid stays In Progress until the final PR |

Merge `main` into a braid branch before the next strand and before the final PR. Never rebase or
force-push shared branches. Every commit uses Conventional Commits.

The user looks at the work with `braid board` (read-only) from their own checkout of `main`. It reads
each item from its own branch; an item shows To Review after `braid handover` and Needs You after `braid ask` (or on failing checks); once merged it shows Done, and `braid status` ends its line with `run braid done <id>` until it is stamped.

## Starting the next item

Goal: `braid next <number>` names the next ready strand or says why none is. One whose PR was closed unmerged follows "Resuming" in
[the skill](../SKILL.md). `braid start <id>` then makes its branch and worktree. Story: there is no next item.

## Tiers

Every item has one `tier:` label; pick the lowest that fits.

| Tier | Typical work | Review |
| --- | --- | --- |
| S | Small script, doc, config, or contained fix | Coordinator reads the diff |
| M | Normal feature | Independent reviewer comments on the PR |
| L | Persistent data formats, crash or recovery behavior, release or publishing, security, any change to agent instructions (skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`) | Independent reviewer, again after fixes that substantially change failure or recovery behavior; the brief lists failure modes and required regression tests |

Who merges: the user, whatever the tier, unless they explicitly ask the coordinator to merge a PR,
or auto mode merges a goal's strand PRs into the braid branch (the [skill](../SKILL.md)). Everything into `main` is the user's merge or their explicit request. The tier
decides the review before the recap; in auto mode tier S gets an independent review too. A `ui`
item's recap embeds final screenshots.

## Checks and reports

- The `gate` from `BRAID.md` passes before every PR. CI evidence is `gh pr checks` green on the PR's
  latest commit, limited to the `ci` names if listed; a required check that never reports isn't green.
  With `ci: none` the gate run is the evidence.
- The PR description says what changed, why, how it was checked and what is open. The worker's
  `report.md`, its final chat report and the coordinator's recap say the same.
- **Converge loop.** A `ui` item, or one whose brief says the user chooses the shape (design, names,
  wording), starts with a proposal on realistic test data, and the worker stops. Each verdict of the
  user goes into the item's log at once; rounds repeat until the user approves; only then is it built.
- **Decided means documented.** The PR that builds what the user decided also updates the doc that
  describes it (how) and the project's decisions record (why). Unconfirmed proposals stay in `report.md`.

## Failure modes

| What happened | What to do |
| --- | --- |
| A worker proposes growth beyond the mandate (goal or acceptance change, new tier L work, more than two strands or one prerequisite) | Tell the worker to stop at a clean point and note where it is. Ask the user. Record the answer in the braid's log. |
| A brief is edited on two branches | Only the owning branch edits a brief. Merge the other branch in, keep both sides' sections, the more advanced status and the union of dependencies; log files never conflict. Run `braid check`. |
| A worker ends without a report | If the PR is merged, the item is done. Else read its `report.md`, log and the PR; retry once with the same model and settings; then ask the user, naming the error. |
| Branch protection refuses a merge | Never `--admin` or another bypass. In auto mode it is a stop: recap and wait for the user. |
| The braid branch's CI is red on a merge commit | Add a tier S fix strand and run it before the next item. A second red is a stop (`quality`). |
| A PR's head moved after its recap or review | Don't merge. Show the user what changed and ask; in auto mode get the new head reviewed. |
| `braid edit --dep` says an id doesn't exist | Lookups read only the current checkout. Create the prerequisite on the branch where the dependency must resolve, or merge the branch that has it. |
| A worktree folder can't be deleted | On Windows the worker's agent process holds it for a while after the report. `braid clean --yes` keeps it ("still in use"); run it again once the worker's session has ended. |
