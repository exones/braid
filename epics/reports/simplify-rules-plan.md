# Plan: replace braid's process rules with short common-sense guidance

Date: 2026-11-05. Status: implemented in PR #31. Later in the same PR, the user chose to remove the records of epics 001–005 (kept in Git tag `archive/process-v1`) instead of freezing them. Background: [overhead diagnosis](braid-overhead-diagnosis.md).

## Goal

Agents behave like competent engineers: they read a precise brief, start working within minutes, check things once, deliver a PR with green CI, and report once. Rules cover only what a capable model cannot know: project facts, hard limits, and how work is handed over. Generic development and Agile practice are not explained.

Success looks like this: the mandatory reading for a worker drops from ~8,000+ words to ~1,500 (AGENTS + worker skill + its brief). A small item goes from dispatch to PR in under ~30 minutes, without startup replays or repeated verification.

## Preconditions (yours)

1. You merge epic 003 and epic 004 into `main`.
2. Running agents are finished or stopped. That covers the epic 003 coordinator and D trial, the epic 004 coordinator, item I/J workers and reviewers. Rules must not change under a live agent.
3. Unfinished items (003/D, 004/B and any others) are either dropped or carried over as rows in a new epic later. Epics 001–004 are then closed history.

I don't merge, push to `main`, or touch other worktrees.

## Where I work

- One new branch from the merged `main`, for example `chore/simplify-agent-rules`, in a host-bound worktree of its own.
- I write everything by hand in a normal session. I don't use the braid skills, coordinator, workers, packets or review threads to do it.
- One PR into `main`, with three or four commits as listed below. You review and merge.

## What changes

### 1. Freeze history so the link checker stops blocking edits

`npm run verify` checks every link in every tracked Markdown file. About 200 links in old epic records point into the policy docs (97 to specific headings), so rewriting those docs would fail the gate. Rewriting history is not an option.

- In `scripts/Test-DocsGate.ps1`, skip link validation for closed epic records `epics/braid/001-*` through `005-*` and the old standalone worker-startup records. Keep their LF and whitespace checks.
- Update the note in `scripts/markdown-link-exclusions.json`. Its "no directory-wide skip for epics" sentence was written for live records; closed epics are frozen evidence.
- Adjust `test/fixtures/docs-gate/Test-DocsGateNegatives.ps1` if it asserts that epics are always scanned.
- Current files (README, `docs/`, `.agents/`, AGENTS, any new epic) stay fully link-checked.

Commit: `build(docs-gate): treat closed epic records as frozen history`.

### 2. New skills and one brief template

Word budgets are targets, not a new gate.

| File | Action | Budget | Content |
| --- | --- | --- | --- |
| `.agents/skills/braid-worker/SKILL.md` | Rewrite | ≤ 600 words | Read brief → check checkout once → work → `npm run verify` → commit/push/PR → watch → one result. Trust what you checked and what the user says. Keep going after a repeated prompt; never restart. Stop and ask only for scope, size or blocker. The T3 watch steps are in five lines. |
| `.agents/skills/braid-coordinate/SKILL.md` | Rewrite | ≤ 800 words | Turn a goal into a short epic table, write one brief per item, pick a tier, launch one worker, read its result, arrange review by tier, report to the user, stop for human merges. No re-verifying CI, artifacts or Git beyond reading `gh pr checks`. |
| `.agents/skills/braid-coordinate/assets/brief.md` | New | ≤ 250 words | The task-passing template, described below. Replaces the packet and backlog-item templates; one file is both backlog item and worker brief. |
| `.agents/skills/braid-coordinate/assets/review.md` | Rewrite | ≤ 150 words | Reviewer brief: what to review (brief + diff), what to focus on, where to post findings (PR review comment). The reviewer does not re-prove CI. |
| `.agents/skills/braid-coordinate/assets/epic.md` | Rewrite | ≤ 150 words | Goal, scope, one item table (ID, title, tier, status, PR), decisions list. |
| `braid-worker/references/t3-continuation.md` | Delete | – | Five lines move into the worker skill. Legacy parent relay, generations and stalled-yield protocol are dropped. |
| `braid-worker/assets/assignment-packet.md` | Delete | – | Replaced by `brief.md`. |
| `braid-coordinate/references/delivery.md` | Delete | – | Branch/PR/merge essentials move into the coordinator skill and `docs/workflow.md`. |
| `braid-coordinate/references/delegation.md` | Delete | – | Two sentences move into the coordinator skill. |
| `braid-coordinate/assets/backlog-item.md` | Delete | – | Merged into `brief.md`. |

Commit: `docs(skills): replace worker and coordinator rules with short guidance`.

### 3. The task-passing mechanism: a precise brief

This is the piece you asked for: precise hand-off that keeps the worker from wandering. The coordinator does the exploration once and writes down the results, so the worker doesn't redo it.

```markdown
# <ID>: <title>
Tier: S | M | L   Expected size: ~<N> lines in ~<K> files
Branch: item/<epic>-<id>-<slug> from <short SHA>   PR into: <base>   Result to: <coordinator thread>

## Goal
<1–3 sentences: the outcome and who it is for>

## Start here
Read these, in order. They are enough to start.
- <path>: <why it matters / what to look at>

## Change
- <path>: <what to add or change>

## Already decided
Facts and choices the coordinator settled. Don't re-investigate them.
- <e.g. "Use pwsh 7 and native git only; no Node.">
- <e.g. "Tests go in test/fixtures/<x>/ and run from Verify.ps1, like node-toolchain.">

## Out of scope
- <things not to touch or build>

## Done when
- <3–6 testable bullets>
- `npm run verify` passes and PR checks are green

## Check with
<exact commands>
```

How it limits exploration without forbidding thought:

- **Start here** and **Already decided** replace discovery. The worker begins with the files that matter and the answers already found.
- **Expected size** is the strongest limiter. The worker skill says: if the work is heading past ~2× the expected size, or needs files outside scope, stop and ask the coordinator. That would have caught item C's 2,000 lines.
- **Out of scope** keeps it from fixing nearby things.
- **Tier** tells it how careful to be: S = ordinary care; L = consider failure modes, add regression tests for edge cases.
- The worker may still read whatever code it is changing and its neighbours. That's normal engineering, not exploration.

The brief lives at `epics/<project>/<NNN>-<slug>/items/<ID>.md` and is committed on the epic branch before launch. The launch message stays three lines: who you are, the brief's path, your branch.

### 4. AGENTS, docs, PR template

| File | Action |
| --- | --- |
| `AGENTS.md` | Rewrite, ≤ 500 words. Project facts (TypeScript/Node, pwsh 7 for scripts, `npm run verify` is the gate, Conventional Commits), names (`braid`, `.braid/`), hard limits (no merge/publish/deploy/secrets, one writer per checkout, don't touch user changes), provider profile, routing to the two skills. No Agile or process explanation. |
| `docs/workflow.md` | New, ≤ 400 words. Epic folder layout, item IDs (A, B, C…), statuses, tiers (S/M/L with what each requires), branches (epic → item → PR into epic → final PR into main), who merges (you). |
| `docs/agile-workflow.md`, `docs/directory-structure.md`, `docs/agent-handoff.md`, `epics/report-format.md` | Delete; the essentials live in `docs/workflow.md` and the skills. |
| `docs/decisions.md` | Keep its history. Add one decision: process rules simplified on this date; D21–D25 process mechanics are superseded by the skills and `docs/workflow.md`. Product decisions are unchanged. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Four short headings: What, Why, How checked, Notes. |
| `README.md` | Update the contributor links only. |
| `epics/README.md` | Point to `docs/workflow.md`. |

Commit: `docs: consolidate project and workflow guidance`.

### 5. What stays as it is

- Product code, tests, CI workflow, the toolchain installer and `npm run verify` contents.
- Your merge of the epic into `main` and of tier L items, plus the provider profile. The coordinator now merges tier S/M items into the epic branch (see decisions below).
- One implementation worker at a time, top-level T3 thread per item, independent reviewer for tier M/L.
- All historical epic records, untouched.

## The tiers

| Tier | When | Process |
| --- | --- | --- |
| S | Small script, doc, config, or contained fix; nothing touching state formats, recovery or release | Brief → worker → PR green → coordinator reads the diff and merges into the epic |
| M | Normal feature | As S, but an independent reviewer comments on the PR first; the coordinator merges when nothing blocking remains |
| L | Ledger/state formats, crash/recovery, release/publish, security | As M; the brief lists failure modes and required regression tests; release artifacts get provenance checks; you merge |

Records per item: the brief, the PR (its description is the report), and the epic table row. A worker writes `checkpoints/<ID>.md` only if it has to stop mid-task.

## How I'll check my own change

- `npm run verify` passes, including the modified docs gate and its negative fixture.
- The skill frontmatter validator passes for both skills.
- A word count of the new skills, AGENTS and brief template is within budget, reported in the PR. This is a one-off number, not a new gate.
- `rg` finds no remaining references to deleted files outside frozen epics.
- CI green on the PR.

## After your merge: one real trial

Pick a small real product item. A coordinator (Sol High) writes one brief with the new template, and one worker (Grok 4.7 High) does it. Record two numbers: dispatch to PR, and PR to merge-ready. Compare them with item C (~63 min and ~1 h 36 min). Add back a rule only if the trial shows a concrete gap, and only as one sentence.

## Your decisions (2026-11-05)

1. **The coordinator merges tier S and M item PRs into the epic branch** once CI is green on the PR's head and review is clean. For S, the coordinator reads the diff; for M, an independent reviewer's comment has no blocking findings. You keep tier L items, the epic → `main` PR, and any release or publish. The coordinator skill, `docs/workflow.md`, AGENTS and the new decision entry say this. "Don't merge" stays the rule for workers and reviewers.
2. **The epic-branch model stays for all work.** No direct-to-`main` shortcut for small items.
3. **Confirmed: delete** `scripts/Test-PrProof.ps1` and `scripts/Test-WorkspaceBinding.ps1`, their fixtures `test/fixtures/pr-proof/` and `test/fixtures/workspace-binding/`, their two `Verify.ps1` entries and `scripts/workspace-binding.md`. Both fixtures run in every `npm run verify` and CI job, and the new rules use `gh pr checks` and `git status -sb` instead. Keep the 66-line `Test-CoordinatorRecordsGate.ps1`. This is its own commit: `build: remove PR-proof and workspace-binding helpers`.

## Protecting main (your action, separate from the PR)

Current state, checked 2026-11-05: `exones/braid` is public; `main` has no branch protection and no rulesets; your account is admin. CI reports two checks per commit: `verify (ubuntu-latest)` and `verify (windows-latest)` (GitHub Actions, app id 15368).

### Step 1: a ruleset for `main` (recommended now)

In GitHub: Settings → Rules → Rulesets → New branch ruleset, target the default branch, enforcement Active, and turn on:

| Rule | Setting | Why |
| --- | --- | --- |
| Restrict deletions | On | `main` can't be deleted by mistake. |
| Block force pushes | On | History on `main` can't be rewritten. |
| Require a pull request before merging | On, 0 required approvals, allowed merge method: Merge commit only | Nothing lands on `main` without a PR. Approvals stay 0 because you and the agents use the same GitHub account, and GitHub won't let you approve your own PR. Merge commits keep the reviewed epic history intact. |
| Require status checks to pass | `verify (ubuntu-latest)` and `verify (windows-latest)`, source GitHub Actions; "require branches to be up to date" On | GitHub refuses to merge until both checks are green on the PR's latest commit, tested against current `main`. Merges into `main` are rare, so the extra re-run is cheap. |
| Bypass list | Empty | Nobody, including your admin account and therefore any agent using it, can skip the rules. If you ever need to, edit the ruleset temporarily. |

Or, if you prefer, I can run this for you with your go-ahead:

```powershell
$ruleset = @'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge"] } },
    { "type": "required_status_checks", "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "verify (ubuntu-latest)", "integration_id": 15368 },
          { "context": "verify (windows-latest)", "integration_id": 15368 } ] } }
  ]
}
'@
$ruleset | gh api --method POST repos/exones/braid/rulesets --input -
```

### Step 2: a light ruleset for `epic/*`

Target `refs/heads/epic/*` with only **Block force pushes**. Don't require PRs or status checks here: the coordinator commits briefs and the epic table directly to the epic branch, and those rules would block that. Item merges into the epic are gated by the coordinator skill, which says to merge only when `gh pr checks` is green on the PR's head.

### Step 3 (optional, later): a separate GitHub identity for agents

Right now every agent acts as `exones`. GitHub can't tell your merge from an agent's, so rulesets can make merges *safe* (green checks, PR required) but can't make `main` *human-only*. That stays an instruction in AGENTS.md.

If you want GitHub to enforce "only I merge `main`":

1. Create a bot account (or a GitHub App) and give it Write access to the repo.
2. Log the agents' `gh` in with that identity on this machine. Set the token up yourself; never paste it into chat.
3. Add yourself (Repository admin role) to the `main` ruleset's bypass list and turn on "Restrict updates".

The bot can then merge item PRs into epic branches, but only you can update `main`. A side benefit: you could require 1 approval on `main` and approve the epic PRs yourself.

### Repository settings worth changing at the same time

- Disable squash and rebase merging (Settings → General → Pull Requests), so every merge everywhere is a merge commit. That matches the epic model.
- Optionally turn on "Automatically delete head branches", so merged `item/*` branches disappear from GitHub. Local worktrees are unaffected.
