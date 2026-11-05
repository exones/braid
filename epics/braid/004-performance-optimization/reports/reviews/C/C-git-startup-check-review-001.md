# C-git-startup-check-review-001: independent review

The candidate checkout check matches a schema 1 contract, including this review binding, and the disposable fixture covers the declared failure cases. No actionable findings. The missing live worker-entry observation remains unproven, and fixture timings are not a speedup.

Parent: BRAID-004/C. Pass: 001. Reviewer: Cursor Grok 4.7 high/500K, separate top-level review workspace.
Agent/assignment name: C-git-startup-check-review-001.
Report: `epics/braid/004-performance-optimization/reports/reviews/C/C-git-startup-check-review-001.md`.
Checkpoint: `epics/braid/004-performance-optimization/checkpoints/reviews/C/C-git-startup-check-review-001.md`.
Assignment packet: `epics/braid/004-performance-optimization/assignments/reviews/C/C-git-startup-check-review-001.md` at packet-context `de31aa8bf0c2a0f36b5b35f4ddc3650a3265fa01`.
Candidate: `5a25b09985f92b25a8037938ef27dddcde7389c0`. PR: https://github.com/exones/braid/pull/24 into `epic/braid-004-performance-optimization`. Proof base `099737095cf4e06114fc3f96a61a879d937e0b96`. Source merge-base `7d1994ba3d305ec1f9094446cff3a32bddf48b2a`.
Workspace check: manual binding first, then one candidate-helper test with the filled review contract. Phase `review`. `expected.head` and `candidateHead` are `5a25b09985f92b25a8037938ef27dddcde7389c0`. `packetRevision` is `de31aa8bf0c2a0f36b5b35f4ddc3650a3265fa01`. Exit 0, outcome `match`. That test did not adopt the candidate skill or waive the manual binding.
Pass state: no-findings. Date: 2026-11-05.
Item status is not copied here.

## Scope and evidence

Reviewed the 22-file three-dot diff `099737095cf4e06114fc3f96a61a879d937e0b96...5a25b09985f92b25a8037938ef27dddcde7389c0`. Accepted pre-C policy stayed the external pin `e9a617fa60630327f161a78918f033e4461eb111`. Candidate skills were compared as source and were not executed as this review's policy. Read the committed review packet, the filled binding, candidate AGENTS, backlog C, assignment C, report C, `scripts/workspace-binding.md`, `validation/C/entry-scenario.md`, record ownership, and review indexing. Read the coordinator green inspection from packet-context `de31aa8bf0c2a0f36b5b35f4ddc3650a3265fa01`.

Manual binding, direct Git arguments, before the helper and before these files existed:

- `git rev-parse --show-toplevel` → `C:/worktrees/agento/review-braid-004-c-001`
- `git branch --show-current` → `review/braid-004-c-001`
- `git rev-parse HEAD` → `5a25b09985f92b25a8037938ef27dddcde7389c0`
- `git status --porcelain=v1` → empty
- `git remote get-url origin` and `git remote get-url --push origin` → `https://github.com/exones/braid.git`
- `git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'` → exit 128, `fatal: no upstream configured for branch 'review/braid-004-c-001'`

`BRAID_WORKSPACE_BINDING_SYNC_DIR` was unset. The checkout was still clean.

Candidate helper, one invocation, still before these report files:

```powershell
pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1 -ContractPath C:\worktrees\agento\epic-braid-004-performance-optimization\epics\braid\004-performance-optimization\assignments\reviews\C\C-git-startup-check-review-001.binding.json -RepositoryRoot C:\worktrees\agento\review-braid-004-c-001
```

Exit 0. Stderr `workspace-binding: match`. Result: `outcome` `match`, `phase` `review`, `checkedAt` `2026-11-05T11:45:17.952Z`, `elapsedMilliseconds` 1016, `gitReads` 14, `mismatches` empty, `failures` empty, `drift` null. Context `candidateHead` `5a25b09985f92b25a8037938ef27dddcde7389c0`, `packetRevision` `de31aa8bf0c2a0f36b5b35f4ddc3650a3265fa01`, `launchHead` null. Actual root `C:\worktrees\agento\review-braid-004-c-001` matched the contract's forward-slash root. Actual `gitDir` `C:\code\agento\.git\worktrees\review-braid-004-c-001` and `gitCommonDir` `C:\code\agento\.git` stayed distinct from that root. The 14 reads were `--no-optional-locks -C <root>` plus `rev-parse --is-inside-work-tree`, `rev-parse --path-format=absolute --show-toplevel`, `--git-dir`, `--git-common-dir`, `symbolic-ref --quiet HEAD`, `rev-parse --verify --end-of-options HEAD`, `remote`, `remote get-url origin`, `remote get-url --push origin`, `rev-parse --verify --symbolic-full-name --end-of-options @{upstream}`, `for-each-ref --format=%(upstream) refs/heads/review/braid-004-c-001`, `status --porcelain=v1 -z --untracked-files=all`, then the symbolic-ref and HEAD pair again. No fetch, push, switch, or repair. The 1016 ms is this process, not a before/after startup percentage.

Focused fixture, after that helper test:

```powershell
pwsh -NoProfile -File test/fixtures/workspace-binding/Test-WorkspaceBinding.ps1
```

Exit 0. `cases=25 matchElapsedMs=866-1121 matchCount=18`. `git status --porcelain=v1` in this review root was empty afterward. Those 866-1121 ms figures are disposable-repository helper process times on this Windows machine.

Hosted proof corroborated through the GitHub API, not by a new download. PR 24 is open, head `5a25b09985f92b25a8037938ef27dddcde7389c0`, base `099737095cf4e06114fc3f96a61a879d937e0b96`, no reviews recorded. Push run 42018593378 attempt 1 and pull_request run 42018697039 attempt 1 are success. Ubuntu jobs 127215280357 and 127215626407, Windows jobs 127215280658 and 127215626729, each with Install dependencies, Verify, and Upload packed tarball success. Merge-test commit `aea18ef88e544e8c065abf9c49661deffa11fab9` has parents `099737095cf4e06114fc3f96a61a879d937e0b96` then `5a25b09985f92b25a8037938ef27dddcde7389c0`. This pass did not recompute the coordinator's tarball SHA-256 `d3769f91666ad5a159fc3410ad49cd9965b245648cb83634f926d3d679fcc07d`. `npm run verify` was not repeated. External skill validators were not rerun; the worker report says both printed `Skill is valid!`, and the skill diff does not change frontmatter.

The worker's initially untracked `scripts/Test-WorkspaceBinding.ps1` is disclosed in `reports/C.md` and `checkpoints/C.md`. At this candidate it is a tracked file in a clean tree. That disclosure is not a clean-binding claim for the worker's first tree, and no ownership or proof conflict remained to investigate.

## Findings

No actionable findings.

## Acceptance assessment

1. Proven for a matching initial, resume, coordinator, and review contract. Fixture `clean-match`, `resume-owned-dirty`, `coordinator-and-initial-shape`, and `review-candidate` each accept one local invocation and reject a confused shape (`test/fixtures/workspace-binding/Test-WorkspaceBinding.ps1` lines 324-354, 410-431, 674-716). This review's own contract did the same: exit 0, 14 local Git reads, no Node, npm, network, or setup. `elapsedMilliseconds` is recorded. Nothing in that result says Git startup became faster.

2. Proven by the focused fixture, exit 0, against disposable roots only. Wrong root and linked root: `subdirectory-is-not-root` (lines 383-391) and `linked-worktree` (lines 560-583), which requires `repositoryRoot` to name the attached worktree rather than the shared common directory. Detached and wrong branch: `detached` (lines 541-557) and `wrong-head-and-branch` (lines 369-380). Wrong HEAD is the same case. Absent origin, trailing-slash and case differences, and fetch/push split: `origin-urls` (lines 586-617). Absent, present, and wrong upstream: `upstream` (lines 644-671). The helper treats `rev-parse @{upstream}` exit 128 with an empty `for-each-ref` upstream as absent, and any other disagreement as `inspection-failed` (`scripts/Test-WorkspaceBinding.ps1` lines 811-826). Staged, unstaged, and untracked: `staged-unstaged-untracked` (lines 434-460). Unmerged `UU` with `MERGE_HEAD` left in place: `unmerged` (lines 503-524). Spaces, Unicode, and staged renames: `resume-owned-dirty`, `rename-space`, and `arrow-rename` (lines 410-500). On Windows the arrow case uses hyphenated names; the `->` names run only off Windows. Ubuntu Verify succeeded, and that job runs this fixture, so this pass does not re-prove that filename locally. Malformed, duplicate, incomplete, and unknown fields: `invalid-contracts` (lines 718-773) and the coordinator/initial extras (lines 709-714). Failed Git and a non-repository: `failed-git` (lines 776-799) and the not-a-repo sample, both `inspection-failed`, not `match`. Branch and HEAD drift: `head-drift` and `branch-drift` (lines 802-865), exit 1, `drift.recheckRequired`. Credential URLs are redacted before stdout or stderr (`scripts/Test-WorkspaceBinding.ps1` lines 78-99 and 645-651); `credentials-scrubbed` asserts the secret strings are absent and that userinfo-only differences still mismatch. Read-only behavior is the before/after SHA-256 of every file under the disposable root, including Git files (`Get-Manifest`, lines 213-240). Unexpected user text is read back unchanged (lines 394-407). A declared copy without `originalPath` is invalid; a successful Git copy status is parsed by the same NUL path as a rename and is not a separate matching fixture.

3. Proven. `resume-owned-dirty` matches the checkpoint HEAD with `launchHead` set to forty `b` characters and asserts the result HEAD is not that launch value (lines 416-428). `unexpected-dirty-preserved` exits 1, names `worktree.entries`, and leaves `user note.txt` in place (lines 394-407). `review-candidate` matches while detached at the candidate with a later `packetRevision`, then mismatches `head` after checkout of the packet revision, and rejects `candidateHead` that differs from `expected.head` with exit 2 (lines 674-701). The helper's review rule is `candidateHead` must equal `expected.head` (`scripts/Test-WorkspaceBinding.ps1` lines 385-387). A missing HEAD file and a broken gitdir are exit 2 (`failed-git`). This review result kept the same split: candidate `5a25b09985f92b25a8037938ef27dddcde7389c0`, packet revision `de31aa8bf0c2a0f36b5b35f4ddc3650a3265fa01`.

4. Proven for the prepared instructions and the scenario file. Unproven for a live worker entry. Worker, reviewer, and coordinator text name one `pwsh -NoProfile -File scripts/Test-WorkspaceBinding.ps1` invocation, exit 0 to the named first action, exit 1 for the reported fields only, and exit 2 as not a match (`.agents/skills/braid-worker/SKILL.md` lines 22-24, `.agents/skills/braid-worker/assets/assignment-packet.md` line 14, `.agents/skills/braid-coordinate/assets/review.md` line 12, `.agents/skills/braid-coordinate/references/delivery.md` line 50, `docs/agent-handoff.md` line 35, `validation/C/entry-scenario.md` lines 11-18). The supported-route file orders idle create, one initial send, packet/skill/AGENTS, one read-now batch, one binding invocation, then the named first action, and forbids a heading search, nested `pwsh -Command`, an unquoted `@{upstream}`, upstream repair, and restarting a live worker. The fixture checks that order only (`supported-route-scenario`, lines 896-918). This review followed that reviewer sequence on an already bound checkout: packet, pinned pre-C policy, AGENTS, one supplied read-now batch, manual binding, then one helper test. It did not search headings before that batch and did not repair upstream.

   The live worker-entry observation is missing. `validation/C/observations.json` line 38 says it was not run, and `validation/C/entry-scenario.md` lines 3-5 say the scenario does not start it. The worker report states the same limit. This review's helper exit and the fixture's 18 match timings cannot be relabeled as that trial. They do not measure an ordinary assignment from idle creation through the first useful source action, and they do not establish a representative speedup.

   Passive ordinary-A evidence is present and was used as a trace, not as a new timed baseline. `validation/C/startup-probe-001/real-worker-cross-check.json` records the nested `pwsh -Command` expansion (`The term '=' is not recognized`) and the unquoted `@{upstream}` parse (`Missing '=' operator after key in hash literal`) at lines 104 and 153. Fixture `quoting-and-passive-evidence` (lines 868-893) reads those strings and reproduces both failures. The null probe remains diagnostic only: 222 ms in one Git batch, 116.014 seconds to its trivial task, 10 context reads, 9 searches, and an interruption after it already knew the null task (`observations.json` lines 25-31). No universal timing, watch survival, autonomous repair, or exactly-once claim is supported.

5. Proven as a reporting split, with no speedup claim to accept. `reports/C.md` and `validation/C/observations.json` separate helper process time, command-construction failures, context reading, and substantive work. The backlog states that the screenshot's 3m10s is not an acceptance baseline. This pass's 1016 ms and the fixture's 866-1121 ms stay in that helper-process category.

6. Proven for the focused fixture and the current-head Windows and Ubuntu CI steps named above. Full local `npm run verify` was not repeated; the hosted Verify steps already ran on this head, and this pass had no unresolved question that required another one. Tarball bytes were not rehashed here. Independent review is this pass: no actionable findings. Changed skill and doc text keeps external pinning, `npm run verify`, ownership, human merge, manual fallback, and the pre-execution binding order. D27 records the helper without making it a product doctor (`docs/decisions.md` line 35). README adds the fixture as verify step 7 and a short pointer at lines 39 and 45, and does not become a status dashboard. `docs/roadmap.md` is outside the diff. This pass does not adopt the candidate skills, merge, or mark C Done.

## Triage and gate

No actionable findings to fix, refute, or defer. This file is not a GitHub approval, a merge decision, or item Done. A later independent recheck of C uses the next pass number. The coordinator copies these uncommitted review files, writes the user account, and keeps the human merge of PR 24 as a separate gate. B stays behind that merge.

## Resume

Next coordinator action: copy this report and checkpoint into the epic record and triage the pass as no actionable findings on `5a25b09985f92b25a8037938ef27dddcde7389c0`. The bounded fresh-context worker-entry observation is still coordinator-owned and is still required before final acceptance; this review does not supply it. Do not adopt the edited skills until that adoption is recorded. Do not dispatch B. Do not mark C Done. The reviewer stops, does not commit, and does not watch PR 24.
