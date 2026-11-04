# BRAID-003/J record ownership

Each epic record now has one writer, branch, write moment, and committer. Live status lives in the epic table and a short rewritten checkpoint. This candidate is ready for its pull request; hosted checks are the remaining proof and are recorded on the pull request, not in a later commit.

### What changed

[Record ownership](../../../../docs/agile-workflow.md#record-ownership) is the only writer/branch/when/committer table. [Commit boundary](../../../../docs/agile-workflow.md#commit-boundary) keeps post-push proof in a pull-request comment and the result message. [Now and the log](../../../../docs/agile-workflow.md#now-and-the-log) splits a rewritten `checkpoints/current.md` from an append-only `checkpoints/log.md`. [One home for status](../../../../docs/agile-workflow.md#one-home-for-status) puts item status only in the epic backlog table. [Epic branch sync and skill pinning](../../../../.agents/skills/braid-coordinate/references/delivery.md#epic-branch-sync-and-skill-pinning) is the main-sync and skill-pin rule. The packet's Execution skill field names the revision and path. [Acceptance record](../../../report-format.md#acceptance-record) lists the facts the coordinator copies after the human merge.

### Why

BRAID-003 was writing the same status in several files, and facts learned after a push either rewrote a green head or sat uncommitted. The supplied cleanup snapshot (`worktree-cleanup.md`, SHA-256 `B083709D7C3C14F82AAD12C62EED5D3E6BE58B42F1A1AA86E4D1A408B4CEC419`) records 26 retired worktrees and 84 rehashed archive files from that pattern. One table and one write moment remove that choice.

### Left for you

No user action is needed on this pull request until independent review finishes. The coordinator accepts the green head and assigns `J-record-ownership-and-timing-review-001`. Human merge into `epic/braid-003-worker-skill` stays a separate action. I and D stay stopped.

### Technical record

- Item: [J](../backlog/J-record-ownership-and-timing.md). Packet: [assignments/J.md](../assignments/J.md). Decision: [D25](../../../../docs/decisions.md).
- Root: `C:/worktrees/agento/item-braid-003-j-record-ownership`. Branch: `item/braid-003-j-record-ownership`. Base: `epic/braid-003-worker-skill`. Initial HEAD: `2b823f9fb7918b8db04d8cf985be327cdad28f70`. Origin: `https://github.com/exones/braid.git`.
- Operating skill for this run: `ac5027c00433daf3fcaf111348fa7f87c270eef2` at `.agents/skills/braid-worker/SKILL.md`, loaded before the draft was edited. No product controller. Package `0.1.1`, schema 1.
- The commit that contains this report is the candidate. Pull-request URL, hosted run identities, and the post-push head are written in a comment on that pull request and in the coordinator result. This file is not updated to store them.
- Dependency facts used as supplied: H accepted head `7b56b82ae0b259a5e1e9a326786b1da286f5c10f`, human merge `2b6c2f407d275ed1faa2dc2768278fcfa302aaf9`. Planning PR 19 merge `c6d9e2f06f2852ad5b1cb89baf7019bc9e7a93d1`, plan head `4648f7b5894ca6af294c29bec107b8382ffc55c8`.
- Local gates: recorded below. `pwsh` `7.6.9`. The gate selected Node `v26.13.0` and npm `11.20.0`. The shell's default `node` before that selection was `v24.19.0`.
- Next coordinator action: after the green comment and result, accept this head and assign the named review. Do not start I or D.

## Lifecycle

Walkthrough against the changed text, including one review-fix round. File names are the matrix rows.

1. **Dispatch.** The coordinator commits `assignments/<ID>.md` on the epic branch before the checkout exists ([Record ownership](../../../../docs/agile-workflow.md#record-ownership)). The packet names the skill revision and source path. This dispatch names revision `ac5027c00433daf3fcaf111348fa7f87c270eef2` and path `.agents/skills/braid-worker/SKILL.md` ([Execution skill](../../../../.agents/skills/braid-worker/assets/assignment-packet.md) and [Epic branch sync and skill pinning](../../../../.agents/skills/braid-coordinate/references/delivery.md#epic-branch-sync-and-skill-pinning)). The coordinator rewrites `checkpoints/current.md`, appends one `checkpoints/log.md` line, updates the epic table, and pushes. The tree is clean.
2. **Implement.** The worker edits owned files on the item branch. This run keeps the revision named above. The skill text in this commit applies to a later item only after the coordinator records that adoption in `epic.md`.
3. **Push.** The worker commits the implementation, `reports/<ID>.md`, and `checkpoints/<ID>.md`, pushes, and opens one pull request into the epic ([Commit boundary](../../../../docs/agile-workflow.md#commit-boundary)).
4. **CI green.** The worker checks the packet's jobs on that head. The facts go in one pull-request comment and one result ([top-level item thread](../../../../.agents/skills/braid-worker/references/t3-continuation.md#top-level-item-thread)). There is no record commit on that head.
5. **Review.** Another reviewer reads that head, returns `reports/reviews/<ID>/*` and `checkpoints/reviews/<ID>/*`, and posts a short pull-request summary. The reviewer does not commit. The coordinator copies the files into the next epic commit and writes `reports/<ID>-coordinator-triage.md`. That commit is records-only ([Commit boundary](../../../../docs/agile-workflow.md#commit-boundary)).
6. **Fix.** When the review requires a change, the worker's repair commit on the item branch includes the fix and the updated report and checkpoint, because the head changes anyway. The worker pushes and waits for a new green head. The new proof is a new comment and a new result. A paperwork commit does not follow the green run.
7. **Merge.** A human merges the checked head into the epic. Green checks and the review are not that merge ([human merge stop](../../../../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop)).
8. **Acceptance.** The coordinator writes `reports/<ID>-acceptance.md` with the copied facts in the [acceptance record](../../../report-format.md#acceptance-record): checked head, base, workflow run, attempt, job, conclusions, required steps, merge SHA, review pass, reviewed head, findings, and triage. A link to a comment or a run is not the record. The same epic commit rewrites `checkpoints/current.md`, appends `checkpoints/log.md`, and sets the epic table. The coordinator runs `npm run verify` before pushing. Before the next dispatch, the coordinator counts `git rev-list --count <epic>..origin/main` and merges main when the count is not zero, using a pull request into the epic when that merge conflicts.

## Word counts

Whitespace-separated tokens at dispatch tip `2b823f9fb7918b8db04d8cf985be327cdad28f70`, then after the review001 repairs. Combined growth is 1196 words, 9.54 percent, under the about-10-percent cap.

| File | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `AGENTS.md` | 1688 | 1714 | 26 |
| `.agents/skills/braid-worker/SKILL.md` | 1665 | 1688 | 23 |
| `.agents/skills/braid-coordinate/SKILL.md` | 1347 | 1360 | 13 |
| `.agents/skills/braid-worker/assets/assignment-packet.md` | 804 | 839 | 35 |
| `.agents/skills/braid-worker/references/t3-continuation.md` | 1683 | 1687 | 4 |
| `.agents/skills/braid-coordinate/references/delivery.md` | 1941 | 2168 | 227 |
| `.agents/skills/braid-coordinate/references/delegation.md` | 719 | 732 | 13 |
| `docs/agile-workflow.md` | 1692 | 2459 | 767 |
| `epics/report-format.md` | 1004 | 1092 | 88 |
| **Total** | **12543** | **13739** | **1196** |

## Status search

Searched `AGENTS.md`, `README.md`, `epics/README.md`, `.agents/skills/`, the epic, backlog, and review templates, and `docs/` except `docs/decisions.md`. No `Current epic` pointer, no `Seed execution`, no `session reports`, no `Planning only`, and no `Begin with` progress line. The backlog template has no `Status:` line. The epic template keeps one status line, which is the epic-level home. Product docs still name the ledger states `backlog` and `in-progress`; those are command outputs, not epic status.

## Local gates

Hosted proof is not claimed here. The docs gate reads the Git index, so this report is included after it is staged. The commit is created only when that staged `npm run verify` also exits 0.

- `npm ci` with the pinned toolchain, then `npm run verify`: exit 0. Node `v26.13.0`, npm `11.20.0`, pwsh `7.6.9`. Docs gate passed (`text=233`). Tests: 40 pass, 0 fail. The pack is a dirty pre-commit probe, not a clean candidate: tarball SHA-256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`, source revision `2b823f9fb7918b8db04d8cf985be327cdad28f70`, `worktree-dirty True`, `candidate False`.
- `python -X utf8 -B C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/braid-worker`: exit 0, `Skill is valid!`
- The same command on `.agents/skills/braid-coordinate`: exit 0, `Skill is valid!`

## Review001 repair

Review001 at `ed03974840664d8580af2f998c9046d9562a66bd` found three timing contradictions. All are accepted for repair. The Sol coordinator made these small wording fixes directly after confirming both the Grok author and reviewer had completed and the author branch was clean; no worker was restarted or replaced.

- F1: the AGENTS finish list now explicitly applies the commit boundary to worker files: before push update them, after push send checks/blockers through the PR comment and result. Worker waiting/blocker guidance names that message route, including transport failures, without modifying committed records.
- F2: the legacy relay includes head/check facts in its waiting result. A repair includes record updates in its repair commit before push, then yields. The later evidence-only commit sentence is removed.
- F3: fixes stay on the item PR; review files follow the singular ownership table into the coordinator's next epic commit.

Lifecycle check after repair: a green completion and a post-push access/transport blocker leave the worker report/checkpoint unchanged and report the new facts through the assigned channel (and PR comment when accessible). A code or policy repair includes report/checkpoint changes before the new push, with fresh current-head proof afterward. Review files remain outside the item head. Human merge and release authority are unchanged. The original review and old-head green proof remain historical; this repair requires new local/hosted proof and independent recheck before acceptance.

Repair local proof: full `npm run verify` exited 0 with Node v26.13.0/npm11.20.0/pwsh7.6.9, docs gate `suppressed=7 exclusions=7 text=235`, cross-drive/negative fixtures and all40 tests passed, packed install passed. This was a dirty pre-commit probe from source `ed039748`, candidate false, tarball SHA256 `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`; no clean-candidate claim. Both external skill validators exited0. New-head hosted checks and independent recheck remain required after this repair push. Post-push proof goes in the PR comment/result rather than another file commit.
