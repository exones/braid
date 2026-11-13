# Staged bootstrap roadmap

These stages are capability boundaries for later releases. Live status is in the Backlog.md tasks under `backlog/`; see the [workflow](../.agents/skills/braid/references/workflow.md).

| Stage | Candidate | Delivered capability | Built using | Promotion proof |
| --- | --- | --- | --- | --- |
| 0 | Workflow bootstrap | Coordinator skill, analysis/refinement workflow, Agile epic/backlog templates, readiness/completion criteria, current checkpoint | Sol coordinator and project files | Structural validation plus fresh short-goal planning via AGENTS routing in Codex/T3 recorded in the seed skill-proof report. Invisible UI selection, every host, and all workflow branches remain unproven. |
| 1 | 0.1 seed | Manual epic/story ledger, CLI, state/events, PowerShell verification, Actions, packaged installation | Bootstrap coordinator skill and one implementation worker | Packed CLI works in a clean directory, local verification passes, Windows/Linux CI evidence recorded when remote exists. |
| 2 | 0.2 supervised | Current T3 contract, doctor, explicitly requested single-worker dispatch, independent gate reports | Pinned 0.1 for tracking; operator launches agents | One real task completed; failed gate prevents acceptance; changed head invalidates old proof. |
| 3 | 0.3 messaging | Typed routing, durable delivery, inbox/outbox, human questions, manual tick | Pinned 0.2, one worker | Real question/answer and fallback delivery; duplicate retries harmless; bounded conversation tests. |
| 4 | 0.4 coordination | Coordinator, DAG readiness, max parallelism, coarse resource exclusion, review | Pinned 0.3, coordinator and one worker | Demo shows two independent streams, dependent stream, failed gate, human question. |
| 5 | 0.5 recovery | Scheduled tick, bounded retry/nudge, pause/resume, thread replacement, export | Pinned 0.4, at most two workers | Interruption/restart exercises preserve work and prevent duplicate actions; fresh context resumes. |
| 6 | Pilot | Real project proof, compatibility fixes, operating guide, revised defaults | Pinned 0.5 | Evidence-backed final report and retro; limitations explicitly handed over. |

Since [D30](decisions.md), the `braid` skill keeps items in Backlog.md while the CLI's ledger stays as it is; stages 1–6 are revisited after the user's trial of `braid`.

## braid's own board

Planned after auto and unattended mode and, as [D01](decisions.md) says, built with the Backlog.md-based flow. braid gets its own task tracker and board, keeping what works in Backlog.md: Markdown task files in Git that travel with branches and PRs, a CLI with plain output for agents, acceptance criteria, Definition of Done, final summaries, subtasks and cross-branch reads. It adds:

- goals shown with their subtasks nested;
- states derived from GitHub, T3 and labels, not stored in task files: Running, In Review, Waiting for you (with the stop case), Done;
- actions: Start, Merge on request, Open thread.

Backlog.md stays the store until braid reads the same files, so existing tasks need no conversion. The first step is the spike TASK-2.

### Proposed path (TASK-2.2, 2026-11-13; the user decides)

Built on [Backlog.md as braid's reference](backlog-md.md) and [the new braid CLI](braid-cli.md): a fresh Node tracker that reads Backlog.md's files, React board served on 127.0.0.1, `backlog` stays the writer at first.

**Starting agents.** T3 Code ships a `t3` CLI (v0.1.6 here, `~/.t3/bin/t3.cmd`) that talks to the running T3 server: `t3 thread start <project> <message|-> --worktree <base> --branch <item branch> --provider <id> --model <slug> --title … --json` starts a thread in a new worktree and prints its id; `t3 thread send <thread> <message|->` queues a message for an existing thread (a busy thread gets it as its next turn); with `--wait`, `start` and `send` wait for the agent and exit 0 on its reply, 1 if the run fails and 2 if it waits for an answer. `t3 thread list --project <path> --json` gives per thread `status` (seen: `running`, `completed`, `interrupted`, `cancelled`), `title`, `link` (opens the thread), `linkedPullRequest` and `pullRequests`; only `t3 thread show <thread> --json` adds `thread.branch`, `thread.worktreePath`, `thread.pendingRequestCount` and `activeRunId`. `branch` can be null (this worker's own thread: branch null, worktreePath set). So the board's Start, Open thread and messages need no T3 internals. Limits: it needs the T3 desktop app or service running; `start` has no flag for reasoning effort or other options (BRAID.md's `effort=`), so those come from the project's defaults until T3 adds one; each call costs about 1 s (an Electron process start). Fallback without T3: `claude -p` or `codex exec` in a worktree braid creates. That loses the visible thread the user can read and answer, T3's MCP tools the skills use (thread messages, PR links and watches), and live state; braid would have to keep the session id and log itself.

**Derived states.** Stored statuses stay To Do, In Progress, Done; the lanes are computed at read time from the task, its `item/<id>-*` branch and PR, and its T3 thread. Measured on this repository (55 PRs, 73 threads).

Joining a thread to a task: (1) the thread's `pullRequests` from `list` give the PR, whose head branch `item/<id>-*` names the task; this covers a thread once it has linked a PR (35 of 73 here). (2) Before that, `show`'s `worktreePath` matched against `git worktree list --porcelain` gives the worktree's branch, which names the task; a worktree path never changes, so it is cached per thread id after one `show`. (3) `branch` from `show` is a fallback when set. Later, threads braid starts itself are recorded in `runs/` with their task (goal 5), and no join is needed.

| State | Rule | Source | Reliability | Cost per refresh |
| --- | --- | --- | --- | --- |
| Running | a thread joined to the task is `running`, or the item branch exists with no PR and no thread | `t3 thread list` (1.3 s per project), `git worktree list` (<0.1 s), `git ls-remote` (0.5 s) | high with T3; low without (a stopped agent looks the same) | 1.3 s, plus `show` below |
| In Review | an open PR from the item branch, its thread not `running` | `gh pr list --state open --json headRefName,statusCheckRollup,…` (0.8 s) | high: braid names branches by task ID | 0.8 s |
| Waiting for you | a `running` thread has `pendingRequestCount > 0`; or the PR is green and the task carries an `ask:<key>` label or a `Needs the user:` line other than `none`; or the PR targets `main` (the user's merge) | `t3 thread show` (~1 s each), `gh`, the task file on the item branch (`git show`) | medium: the stop case comes from labels and the summary's text, so the format must hold; whether a thread asking a question (not an approval) shows in `pendingRequestCount` is not checked | ~1 s per `running` thread of an open item, +0.1 s per task read |
| Done | the PR is merged, or the copy on the base branch says Done | `gh pr list --state all` (0.9 s lean, 3.5 s with checks; merged PRs never change, so cache them) | high | cached after the first run |

Plus To Do (ready when every dependency is Done, else Blocked), Failed (red checks on the PR) and Stopped (the task's thread is `interrupted` or `cancelled` and there is no PR). T3 doesn't say whether the user or an error stopped a thread, so Stopped means "no agent is working on it; look at the thread", not a failure.

`show` calls per refresh: one per `running` thread joined to an open item (for `pendingRequestCount`), plus one per new thread not yet joined. With one item at a time that is 1–3 (worker, reviewer, a new thread); with several agents (goal 6) it grows with them. Run in parallel, a refresh is about 1.5–2.5 s (`list` 1.3 s and `show` ~1 s side by side, `gh` 0.8 s); sequential, 4–6 s. That is acceptable for a refresh a minute plus one on file changes, with worktree paths and merged PRs cached; GitHub's 5,000 GraphQL points an hour are ample. Reading T3's local API directly instead of the CLI (each call starts an Electron process) would cut most of the T3 cost; not checked.

**What Backlog.md 1.55.3 already shows for a goal.** `task view` lists a parent's subtasks; `task list -p <id>` filters by parent. The terminal board places a subtask right after its parent only when both have the same status, with no nesting marker (`buildColumnTasks`, `src/ui/board.ts`). The web board is a flat column per status; only the task modal lists the subtasks with "n of m complete" and links back to the parent (`TaskDetailsModal.tsx`). No view keeps a goal and all its subtasks together across statuses.

**First version: a read-only board (goal 1 of [braid-cli.md](braid-cli.md#follow-up-goals-in-order), tier L).** `braid board` reads `backlog/` on the current branch and the item and epic branches, joins GitHub and T3 (read-only), and serves the board. A goal is one card placed in the lane of its most urgent subtask (Waiting for you before Running, In Review, To Do, Done), with a progress count (2 of 3 Done) and one dot per subtask; it expands in place into its subtasks, each with its own state, PR, checks and thread link, and opens a side panel with the task's description, criteria and final summary. A story is a single card. No actions; links open the PR or the thread. Size, goal 1 only: about 5,500–8,400 product lines, summing braid-cli.md's rows for `format/` (1,200–1,600), the read half of `config/` and `git/` (500–800, no ID allocation), `store/` without writes (800–1,100), `model/` (400–600), `sources/` and `derive/` with a read-only T3 source (800–1,300), `server/` (300–500) and `web/` (1,500–2,500). braid-cli.md's 7,500–11,100 is the whole first product, which adds the write side (`ids/`, the lock, the CLI commands) in goal 2. Tests one to two times that, four phases as in braid-cli.md, with the T3 source read-only in phase (b) rather than in goal 4.

Candidate lanes, for the user to choose:

- **A. By state:** To Do · Running · In Review · Waiting for you · Done (Blocked, Failed and Stopped as badges).
- **B. By who acts:** Queue (To Do, Blocked) · Agents (Running, In Review) · You (Waiting, merges, Failed, Stopped) · Done.
- **C. A with a ready split:** Blocked · Ready · Running · In Review · Waiting for you · Done.

**Follow-up goals**, as in braid-cli.md: 2 compatible task commands; 3 coordinator commands (`next`, `status`, `facts`, `recap`, `merge`); 4 board actions: Start through `t3 thread start`, Open thread through the thread's `link`, Merge on request through `gh pr merge --match-head-commit`, with the session token; 5 following agents and resuming (`runs/` records holding thread ids, checkpoints, `t3 thread send` to resume); 6 reports and several agents. Open: T3's effort setting on start, and whether the board can live in a T3 panel instead of its own server.

The coordinator skill is delivered in stage 0, before the CLI. Stage 4 adds deterministic coordination in the product; it is not the first time a coordinator is used. Later milestones refine the bootstrap skill using delivery evidence. Work division follows the [workflow](../.agents/skills/braid/references/workflow.md); a review is part of its item, not a new item.

## Bootstrap rules

Each run records its released controller version, candidate commit, schema version, and acceptance policy. The controller installation lives outside the candidate checkout. The candidate operates on disposable test runs until promoted. Do not change the running controller's files through development builds or `npm link`.

Promotion means deterministic checks passed, the actual packed artifact was exercised, relevant live proof exists, and evidence is recorded. Publishing and merge authority remain explicit. If a gate cannot run, the stage is partially proven rather than complete.

Before stage 2 work begins, install accepted 0.1 in a separate location and create the stage 2 work ledger with it. Update Markdown checkpoints alongside it. The machine ledger owns execution status; narrative files reference that status rather than becoming a competing database.

Stage 2 doctor should compare the actual checkout, attached branch, initial revision, origin and PR base with the assignment packet. Its independent gate reports should also check the candidate diff against the packet's allowed paths. These checks turn the manual startup and scope checks into recorded evidence. Until stage 2 gate reports exist, `gh pr checks` on the PR's latest commit is the CI evidence.

Stage 4 DAG readiness must verify each required human dependency merge into the declared integration branch before dispatch. Green CI, a review, or a narrative Done label alone cannot satisfy that dependency. This is future automation of the existing human merge stop, not new merge authority.

## Four gates

1. Ready to start: backlog item, scope, dependencies, ownership, and expected proof exist.
2. Ready to merge: checks pass on current code; requested evidence and review triage exist.
3. Ready to release: packed installation and state compatibility are exercised.
4. Ready for greater autonomy: the new automation's success and failure paths are demonstrated.

Milestone review uses a fresh context. Start cross-provider review when configured and available; do not make an unavailable provider a hidden prerequisite for basic local work.

## Infrastructure lane

npm is the confirmed release registry. Settle package account/scope/name and access settings before publication, then prepare GitHub Actions trusted publishing where supported. Install-policy and OIDC work stay independent of registry account setup. Surface user-owned publishing steps when release work needs them. No self-hosted package infrastructure or tailnet CI access is planned. `.github/workflows/release.yml` is the prepared manual dispatch. It uploads the verified tarball and skips `npm publish` until the package is deliberately made publishable and the GitHub variable `BRAID_RELEASE` is `enabled`. Preparing that file does not authorize publication. The trusted-publishing steps and current release status are in [npm distribution](npm-distribution.md). Pinned-controller install steps are in the README.

Until publication proof exists, retain and install exact versioned tarballs. Release assets provide a durable bootstrap fallback once authorized publishing is configured. Ordinary PR CI should not depend on the private registry or tailnet.

## Stage retrospectives

At each boundary record intervention count, gate failures, recovery problems, and coordination overhead when measurable. Turn observed failures into regression tests or a concise rule; route improvements through ordinary PRs. Replan remaining work within the goal, documenting why. Changes to scope or acceptance standards need an explicit decision.
