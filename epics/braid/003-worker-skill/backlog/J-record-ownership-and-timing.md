# J: clear record ownership, one home for status, and epic branch hygiene

Kind: task. Epic: [BRAID-003](../epic.md).

Depends on: H's human merge into the epic.

## Read first

AGENTS.md, `docs/decisions.md`, [Agile workflow files and ownership](../../../../docs/agile-workflow.md#files), [delivery rules](../../../../.agents/skills/braid-coordinate/references/delivery.md), both skills and the [assignment packet](../../../../.agents/skills/braid-worker/assets/assignment-packet.md), [report format](../../../../epics/report-format.md), [directory map](../../../../docs/directory-structure.md), [epic index](../../../README.md), the epic template, this epic and its current checkpoint. Evidence of the problem: `reports/worktree-cleanup.md` (still uncommitted in the coordinator checkout when J was written), the epic's first-parent history since `0e10d3b`, and PR #17 (seven conflicts from one unsynced main PR).

## Value

Epic records under `epics/` have per-role owners for a few files, but no rule says which branch each record lives on or when it is written, and status is repeated in many places. Observed in BRAID-003:

- Records written after a push either change the PR head (invalidating its green proof) or stay uncommitted. The coordinator epic checkout carries uncommitted "local supplements"; retiring 26 worktrees needed hash-matching and archiving 84 leftover evidence files.
- `delivery.md` says review reports belong to the item PR, which is impossible without a new head after review; in practice the coordinator copies them and commits directly to the epic.
- Coordinator-authored skill, AGENTS, decisions and roadmap changes land on the epic without an item PR or review.
- `checkpoints/current.md` has grown into a long append-only log a fresh agent must parse.
- A maintenance session wrote files into the live coordinator checkout.
- Status is written in at least five places: AGENTS.md ("Current epic" pointers to 001-seed, "Seed execution…", "The active Codex session reports…"), `epics/README.md` ("Begin with the CI-wait spike", "Planning only until…"), a narrative `Status:` line in every backlog file (up to 400 characters), the `epic.md` header paragraph plus table plus release checklist, and `current.md`. They drift and nobody can maintain them all.
- Main moved during the epic (PR #14) and the epic branch was not synced; the later sync (PR #17) hit seven conflicting files. Workers launched from the epic tip ran older skill text than main, and earlier items' skill edits took effect for the next worker immediately.

The coordinator, workers, reviewers and the maintainer get one table that answers "who writes this file, on which branch, when, and who commits it", one place to read status, a predictable main-sync routine, and no workflow step that requires a dirty tree or a post-green commit.

## Scope and non-goals

The user agreed these rules on 2026-11-04; J adopts all of them:

- **Ownership matrix:** every record has one writer, branch, write moment and committer (table below).
- **Before push in the PR, after push by the coordinator:** an item PR carries the code plus the worker's report and checkpoint as they stand at candidate time. Everything learned after the push (hosted CI proof, review passes, triage, acceptance, merge) is written on the epic by the coordinator, ending with one acceptance commit after the human merge. The PR head never changes for paperwork.
- **Post-push evidence on GitHub, facts copied into files:** between push and merge, the worker's current-head proof lives in a PR comment and its result message, and the reviewer posts a short PR summary comment. These comments are transport, not the durable record. The coordinator's acceptance file copies the verified facts themselves, not just links: checked head SHA, base, workflow run/attempt/job IDs with conclusions, required steps, merge SHA, review pass name, reviewed head, findings and triage. Hosted logs and artifacts expire and comments can be edited, so a link alone never counts as the record. A PR closed without merge gets a coordinator triage note on the epic saying why.
- **Keep the epic in sync with main, and pin the skills:** see the branch hygiene section.
- **Small rules:** maintenance or audit sessions use their own branch and worktree, never a live checkout; the coordinator runs `npm run verify` before pushing its records; stale pointers go.
- **One home for status:** see the status section.

### Ownership matrix

Adopt it as the single authority in `docs/agile-workflow.md`, replacing the per-file owner comments in its Files section, and link to it from other places rather than restating it:

| File | Writer | Branch | When | Committed by |
| --- | --- | --- | --- | --- |
| `epic.md`, `checkpoints/current.md`, `checkpoints/log.md`, `backlog/*.md` | coordinator | epic | planning, dispatch, triage, acceptance, close; log lines as events happen | coordinator, pushed at each step |
| `assignments/<ID>.md`, `assignments/reviews/<ID>/*` | coordinator | epic | before the item or reviewer launches; a change is a new commit | coordinator |
| product code, project docs, skills, `docs/decisions.md`, `docs/roadmap.md` | worker | item | implementation | worker, via item PR |
| `reports/<ID>.md`, `checkpoints/<ID>.md`, `validation/<ID>/` | worker | item | before each push | worker, via item PR |
| current-head CI proof and result | worker | none: PR comment and result message | after green | not a file |
| `reports/reviews/<ID>/*`, `checkpoints/reviews/<ID>/*` | reviewer | none: returned files plus a PR summary comment | after the green head | coordinator copies into its next epic commit |
| `reports/<ID>-coordinator-triage.md` | coordinator | epic | after review returns | coordinator |
| `reports/<ID>-acceptance.md` | coordinator | epic | after human merge: copied facts listed above, not only links | coordinator, one acceptance commit |
| `reports/final.md`, `retro.md` | coordinator | epic | epic close, before the main PR | coordinator |
| maintenance/audit records | that session | its own branch/worktree | never inside a live checkout | that session, via its own PR |

Also, in the owning authorities:

- Worker: after the first push, no further record file commits unless a repair changes the head anyway; the green proof goes in a PR comment and the result message. Replace the "post-push evidence supplements" wording accordingly.
- Coordinator: commit and push its own records immediately at each boundary; never carry uncommitted records. Coordinator commits to the epic are records-only (the files listed as coordinator-owned) and are explicitly exempt from independent review; any other path needs an item PR. A decision is recorded in `epic.md` and carried into `docs/decisions.md` by an item.
- Reviewer: returns its files and posts a short PR summary comment; it does not commit to the item or epic branch.
- Fix the `delivery.md` sentence placing review reports in the delivery PR.
- **Separate "now" from the log.** `checkpoints/current.md` is a short "now" state, rewritten (not appended) at each step: task, actual revisions, live handles, blockers, one next action; about 15 lines. Resuming agents read only this file. `checkpoints/log.md` is an append-only event log for debugging: one timestamped line per event (launch, CI result, relay, intervention, decision, merge) with the identifiers needed to trace it (thread/task/clientRequestId, PR, head, run). Append without reading the file; never rewrite or reorder entries; resuming agents and packets do not load it by default. Earlier full versions of `current.md` remain in git history because the coordinator commits each step. No new `checkpoints/history/` snapshots; existing history files stay as historical records. Both files have one writer, the coordinator; parallel items add lines (one per active item in `current.md`), not writers, because workers write only their own `checkpoints/<ID>.md` and reports on their item branches. If an epic ever has more than one coordinating writer, each gets its own log file rather than sharing one. Update the epic template and report-format/checkpoint guidance to match.

### One home for status

Each fact has one home; every other place links to it or says nothing.

- **Item status** (`backlog` … `done`, plus a short evidence link) lives only in the `epic.md` backlog table. Backlog files carry scope, acceptance and dependencies, not status narratives; the backlog template drops its `Status:` line.
- **What is happening now** (live threads, PRs, heads, next action) lives only in `checkpoints/current.md`.
- **Epic-level status** is the single status line at the top of `epic.md`. `epics/README.md` lists epics with a one-line, timeless description and no progress words.
- **AGENTS.md, README, skills, templates and docs/** contain policy and mechanics only: no current-epic pointers, no "active session reports…" facts, no epic-specific wording such as "Seed execution". Session observations that matter go to the decision log; the provider profile keeps the user's preference and verified route, not what a particular session reported.
- The decision log stays: it is dated history, not live state.

### Epic branch hygiene and skill pinning

- At each item boundary (after an item merges into the epic, before the next dispatch), the coordinator checks for new main commits (`git rev-list --count <epic>..origin/main`). If any, it merges main into the epic with a merge commit. A conflicting sync goes through a small PR into the epic, like PR #17, so the user sees the resolution. Always sync once more before the final epic PR.
- Never rebase or force-push the epic branch. Do not sync while an item worker is mid-flight unless the user asks; if the epic moves under an open item PR anyway, the worker merges the new epic tip into its branch and reruns its proof.
- Skill pinning: a worker runs a recorded skill revision, not the epic's moving tip. The packet names that revision. J chooses and documents the mechanism. Default proposal: epics that do not edit the skills use the skills in the checkout (dispatch tip); an epic that edits the skills has the coordinator provide a pinned installed copy outside the checkout (the released-controller rule in AGENTS) at main or a recorded commit, and the packet names its path and revision. A skill change made by an item applies to later items only when the coordinator records its adoption in `epic.md`.

Non-goals: a separate records branch or out-of-git state (later roadmap), moving or rewriting historical records, restructuring this epic's existing `current.md` or removing existing backlog status lines (the coordinator migrates its own files once at adoption), product/CLI/schema/CI changes, automation that enforces the matrix or the sync.

## Acceptance criteria

1. Given any file type in the matrix, the maintained docs name exactly one writer, branch, write moment and committer, and every other policy file links to that one table instead of restating it.
2. Given the full item lifecycle (dispatch, implement, push, CI green, review, fix, merge, acceptance), no step in the skills, packet asset, delivery rules or report format requires a commit to a green PR head for records, or leaves a record uncommitted in any worktree. Shown with a written walkthrough of the lifecycle against the changed text, including one review-fix round.
3. The acceptance-file contract lists the facts to copy (head, base, run/attempt/job IDs and conclusions, required steps, merge SHA, review pass, reviewed head, findings, triage) and states that a link to a comment or run alone is not the record; the epic template or report format shows a short placeholder example.
4. The review-report contradiction in `delivery.md` is gone; the records-only coordinator commit exemption and the "project docs only via item PRs" rule are stated once and linked.
5. The `current.md`/`log.md` split is described once with a short placeholder example of each: `current.md` is rewritten and is the only file read on resume; `log.md` is append-only, one line per event with exact identities, and not read on resume; both are coordinator-only, including with parallel items.
6. Status has one home: a search of AGENTS.md, README, `epics/README.md`, skills, templates and `docs/` (excluding the dated decision log) finds no current-epic pointer, session-reported fact or progress wording; the backlog template has no status line; the status rule is stated once and linked.
7. The main-sync routine (when, merge not rebase, conflicting sync via PR, final sync before the main PR, open item PR after a sync) is stated once in the delivery rules and referenced from the coordinator skill's boundary step.
8. The skill-pinning mechanism is documented, the packet asset has a field for the skill revision and source path, and the walkthrough shows one dispatch naming them.
9. Soft text cap: the policy files agents routinely read (AGENTS.md, both `SKILL.md` files, the assignment packet asset, `t3-continuation.md`, `delivery.md`, `delegation.md`, `docs/agile-workflow.md`, `epics/report-format.md`) grow by at most about 10% combined, measured from J's dispatch tip (12,385 words at the main-sync tip `02e3a5c`, so roughly 1,200 words). No restating: each new rule is written once and other files link to it. `reports/J.md` lists before/after word counts per file.
10. `npm run verify` (H's single gate) passes locally and in all four CI jobs on the current head; both skill validators pass; independent review and human merge into the epic.

## Implementation tasks

- [ ] Add the matrix and the status rule to `docs/agile-workflow.md`; reduce other mentions to links.
- [ ] Add the main-sync routine and skill pinning to `delivery.md`; add the boundary step to the coordinator skill and the skill-revision field to the packet asset.
- [ ] Update worker skill, coordinator skill, delegation, packet asset, delivery, report format, directory map, epic and backlog templates, `epics/README.md`, AGENTS.
- [ ] Write the lifecycle walkthrough and the before/after word counts in `reports/J.md`.
- [ ] Run gates; deliver through PR into the epic.

## Ownership and verification

Worker owns the files listed in the implementation tasks plus `reports/J.md` and `checkpoints/J.md`. Coordinator owns this backlog file, `epic.md`, `current.md` and the J assignment. Checks: `npm run verify`, both `quick_validate.py` runs, all four CI jobs on the current head. Docs-only: artifact download not required unless the packet says otherwise.

## Review gates

`J-record-ownership-and-timing-review-001` on the exact green head: checks each matrix row against the changed text, the lifecycle walkthrough, the status search, the sync and pinning rules, and that no gate or human-merge rule was weakened. [Review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing).

## Delivery record

Named item branch from the accepted epic tip, PR into `epic/braid-003-worker-skill`, Conventional Commits, checked head, local gate, hosted CI, review triage, human merge into the epic and merge SHA. The epic PR into main stays separate.

## Report and resume

Write `checkpoints/J.md` and `reports/J.md` per [report format](../../../../epics/report-format.md). Stop after this item.
