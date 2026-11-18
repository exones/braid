---
id: '0020'
title: "Gap inbox: small findings and side ideas without a decision each"
status: Done
labels: ["kind:goal", "tier:L", "ask:architecture", "ask:process", "auto"]
dependencies: []
delivery: epic
---

## Goal

Small leftovers stop costing the user a decision each, and the user's ideas get a place where they aren't forgotten.

- **Leftovers** are non-blocking review findings, the unfinished bits a report names and the worker's `For later items:`. Today the `braid` skill's "Side ideas get a home" rule asks the user each time where one goes, and leftovers stay scattered across briefs and reports where nothing gathers them.
- **Ideas** are the user's brain dump: a thought written down so it isn't forgotten. It may later seed one braid, several or none, and nothing says when.

This goal gives each project one inbox with two folders: a fixed routing rule fills the leftovers folder without asking anyone, and a batched decision (a sweep) empties it. Ideas are written well by a small skill and wait until the user picks one.

Strands, in run order:

- 0020/A: the inbox branch, `braid note` and `braid inbox`
- 0020/F: the sweep commands
- 0020/B: the "sweep due" line in recaps, and the counts in `braid list`
- 0020/C: the board's inbox
- 0020/E: the `braid-idea` skill
- 0020/D: the coordinator skills

## Working at the end

- The inbox is one branch, `braid-inbox`, holding `leftovers/` and `ideas/` with one file per entry. braid commands write it directly, from any thread or worktree.
- A gap found during an item is routed by a fixed rule, without asking the user:

  | Found when | Goes to |
  |---|---|
  | Blocking | the same PR (as now) |
  | Non-blocking, small, in files the PR already touches, before merge | the same PR (the coordinator decides, as now) |
  | Anything else: leftover findings, unfinished bits, `For later items:` | a leftover: self-contained text (what, where, why) plus its source item and links |
  | The user's side observation while an item runs | an idea if it is new, a leftover if it is about the work at hand |

- `braid note "<text>" --from <source>` captures a leftover and `braid note --idea` an idea. Each is committed and pushed at once. `braid inbox` lists the open entries of both kinds. The sweep commands take, pass over, drop and reopen entries.
- The user starts a thread with `$braid-idea <a sentence>`. The skill understands the idea, asks only if it really can't, restates it cleanly, and writes a short, readable idea.
- Recaps stay quiet about the inbox until a sweep is due, then end with one line, for example `Sweep due: 3 open leftovers`. They never list entries or ideas. `braid list` shows the counts, and the board shows both lists.
- Leftovers: at 3 open leftovers, at any recap, or before the next braid is planned (with at least one), the coordinator proposes one **sweep story**, saying which leftovers go in and which are dropped and why. The user answers once for the batch. The sweep story runs after the current braid, and at most one sweep is pending at a time: a later proposal adds to it. A leftover passed over in 2 sweeps is dropped, the drop is recorded in its file, and the user can bring it back.
- Ideas never expire, count towards no trigger and are never proposed for review. Only the user drops one, or asks for one to become a braid (or several); the coordinator then plans from it and marks it taken.

## Already decided

- **Storage.** One file per entry on a dedicated branch, `braid-inbox`, in `leftovers/` and `ideas/` (user, 2026-11-18). The branch is never merged into `main`, like `gh-pages`.
  - Compared and rejected: a local `.braid/inbox.json` (not versioned, against D08); one `braids/inbox.md` (append conflicts); a `Triage` status (a braid number and folder per one-line entry); entries in `braids/inbox/` riding with the capturer's branch. The last was the first choice, but a plan review showed it can't work:
    - `braid accept` refuses a checkout with staged files.
    - The coordinator on a lone story, a `$braid-idea` thread and the user on `main` hold no branch to commit to.
    - Sweeps would have no home.
    - The cross-branch read covers only `braid/*` branches.
    - An installed `braid` older than this one throws on any non-braid folder under `braids/` (`src/braids/store.ts:143`).
  - The folder is the kind. Status (`open`, `taken`, `dropped`) is front matter, so an entry never moves when its status changes.
  - Writers: only braid commands (`braid note` and the sweep commands) write `braid-inbox`, each as one commit pushed at once, retrying after a fetch when someone else pushed first. This is the one exception to "one writer per branch". Distinct file names keep concurrent writers from conflicting.
  - Pushes to `braid-inbox` run no CI: the workflow's `push` trigger covers only `main` and `braid/*`.
- **Thresholds.** A sweep is proposed at 3 open leftovers or before planning the next braid. A leftover passed over in 2 sweeps is dropped (user, 2026-11-18). "Small" for a same-PR fix stays the coordinator's judgment: files the PR already touches, within the brief's expected size.
- **Ideas** never expire and are never proposed for review (user, 2026-11-18).
- **Sweep stories.** A sweep story is `kind:task` with the label `sweep`, at the lowest tier that fits (usually S). Auto mode never decides a sweep.
- **The `braid-idea` skill** is a separate small skill, so the main skills stay lean (user, 2026-11-18). `scripts/Install-Skills.ps1` already installs every `braid-*` folder.
- **No import** of past leftovers (user, 2026-11-18).
- **No inbox actions on the board**, including adding an idea, for now (user, 2026-11-18). An "Add idea" on the board can come with 0012 (Board on the phone).
- **Cut after the plan review:**
  - a command to move an entry between kinds (drop it and note it again instead)
  - hand-written ideas without front matter
  - an inbox line in `braid status`
- **During this goal.** The installed `braid` comes from `main` (D39), so this goal's own run can't use the inbox. Its leftovers go into the report as before, and are noted once the new version is installed after the final merge.
- **Skill changes.** This goal is the user's request to change `.agents/skills/` (AGENTS.md), and the user merges it.

## Out of scope

- Board actions on the inbox: take, drop, sweep or add.
- Merging `braid-inbox` into `main`.

## Completion

- [x] `braid note` (leftovers and ideas) commits and pushes to `braid-inbox` from any worktree, and `braid inbox` lists it (0020/A)
- [x] The sweep commands take, pass over, drop and reopen entries (0020/F)
- [x] Recaps say when a sweep is due and are otherwise quiet about the inbox; `braid list` shows the counts (0020/B)
- [x] The board shows both lists (0020/C)
- [x] `$braid-idea` writes a clean, readable idea from a sentence (0020/E)
- [x] The skills route gaps by the fixed rule and propose sweeps of leftovers at the batch points; "Side ideas get a home" is replaced (0020/D)
- [x] The gate command from BRAID.md passes on the final PR
- [x] report.md written: what changed, why, validation, anything open

## Background

Practices compared when this was proposed:

- **Fix it in the current PR** ("Boy Scout rule"): good for small fixes in files the PR already touches, but it costs a review and CI round and the scope creeps.
- **Inbox plus batched triage** (Linear's Triage inbox, GitHub `needs-triage`, the GTD inbox): capturing takes no decision, and the deciding happens in batches. This is the core of this goal.
- **A parking lot per item**: what braid's `For later items:` is today. Easy to write, never read again.
- **Shape Up**: cuttable nice-to-haves, a cool-down for small fixes and no backlog. Leftovers are dropped unless raised again, which the drop rule borrows. Ideas are exempt, at the user's request.
- **A capacity share for chores** (a Kanban chore lane, or "20% for tech debt"): the sweep story fills that role.
- **Decide at capture by a fixed rule**: the routing table.
