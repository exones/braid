# I-pr-proof-script-review-003: final pull-request identity

`scripts/Test-PrProof.ps1` at `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4` keeps the second pull-request state and target ref, resolves that final ref, and checks the final merge parents before a current PASS. Closing, merging, or retargeting during an open proof fails with `currentReady` false, including a different branch name at the same tip. An open proof that fails stays `proofScope` `current`. Review002/F1 is repaired. This pass does not merge and does not start D.

Parent: BRAID-003/I (`backlog/I-pr-proof-script.md`). Pass: 003.
Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`). Not the implementation author.
Agent/assignment name: I-pr-proof-script-review-003.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-003.md`, `epics/braid/003-worker-skill/checkpoints/reviews/I/I-pr-proof-script-review-003.md`.
Assignment packet: read with `git show bb5c0a86e46b39d992c5faf9c16cf5272eaed7e4:epics/braid/003-worker-skill/assignments/reviews/I/I-pr-proof-script-review-003.md`. That object is outside the candidate.
Candidate: `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4`. Frozen target: `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`.
PR: https://github.com/exones/braid/pull/21, OPEN, MERGEABLE, `mergeStateStatus` CLEAN, `reviewDecision` empty.
Status: no-findings. Date: 2026-11-05.

## Scope and evidence

Reviewed the repair of `I-pr-proof-script-review-002/F1` on checkout `C:/worktrees/agento/review-braid-003-i-003`, branch `review/braid-003-i-003`, HEAD `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4`. Origin `https://github.com/exones/braid.git`. The worktree and index were clean before this report. No author source, index, or cache was edited.

The repair is commit `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4` on `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`: 8 files, 164 insertions, 16 deletions. It changes `scripts/Test-PrProof.ps1`, `test/fixtures/pr-proof/Test-PrProof.ps1`, the worker skill, T3 continuation, the assignment-packet asset, the review template, and the I report and checkpoint. `.github/workflows/ci.yml` is unchanged.

Read: candidate AGENTS and review conventions, the review template, I backlog, author report and checkpoint, coordinator-context `assignments/I-fix-002.md`, review002, and `reports/I-coordinator-triage.md` from `bb5c0a86e46b39d992c5faf9c16cf5272eaed7e4`. The event log was not read.

**Review002/F1 disposition.** Repaired at this head. `Get-LiveModel` reads a second `Get-PullRequestView` after the artifact work and stores `finalState` and `finalBaseRefName` from that view (`scripts/Test-PrProof.ps1` lines 773–787). The second `Get-LiveTargetTip` uses the second `baseRefName` (line 774). While the second state is open, `Get-PullMergeParents` runs again and the judgment compares those parents with the final tip and the pull-request head (lines 775–780 and 1058–1076). A second state other than open, or a different target name, adds a failure (lines 1046–1057). `proofScope` is `historical` only when both states are merged (line 1098). `currentReady` requires PASS, `proofScope` `current`, stable identity, and final state open (line 1105).

**Seam, not a hand-built judgment fixture.** `test/fixtures/pr-proof/Test-PrProof.ps1` dot-sources the command, sets `PrProofTransport`, and calls `Get-LiveModel` plus `Get-PrProofJudgment`. The command's main block runs only when the invocation name is not `.` (line 1151), so that dot-source does not start a live proof. The four committed cases passed: unchanged open PASS with `currentReady` true; open-to-closed FAIL `pull request closed during proof`; open-to-merged FAIL `pull request merged during proof`; retarget to `epic/other-target` FAIL `pull request target changed during proof`. Those three failures kept `proofScope` `current` and `currentReady` false. The transport stub returns the same tip SHA for every ref URL. A separate in-memory probe of the same functions recorded the second ref request as `repos/exones/braid/git/ref/heads/epic/other-target` and still failed the retarget. The same probe failed a final merge whose first parent, second parent, or parent order disagreed with the final tip then the head, and it passed a new merge SHA whose ordered parents were still that tip then the head. Two pull-request reads and two merge reads occurred on the open path. A thrown second view left `Get-LiveModel`. The CLI `catch` maps that class of failure to FAIL and exit 1.

**Review001/F1.** Still resolved. The fixture cases for a live base that has already advanced, including with `-SkipArtifacts`, and for a live base that moves during the proof, still FAIL. This head's open proof recorded base and live base are both the frozen tip.

**Frozen target around the proof.** `git ls-remote` and `git/ref/heads/epic/braid-003-worker-skill` both returned `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` before the independent downloads and after the pull 21 and pull 20 commands. Object type was `commit`. Pull 21 stayed OPEN, MERGEABLE, CLEAN, `baseRefName` `epic/braid-003-worker-skill`, `baseRefOid` and `headRefOid` unchanged, `updatedAt` `2026-11-05T03:31:22Z`, `reviewDecision` empty. `refs/pull/21/merge` stayed `1b08f102475da058f09ca8a5f94ff6e5863f1110`, parents `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` then `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4`, committer `2026-11-05T03:27:34Z`. Pull 21 was not closed or retargeted.

**Hosted runs for this head.** `actions/runs?head_sha=4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4` returned `total_count` 2. Both are workflow `CI`, path `.github/workflows/ci.yml`, attempt 1, conclusion success. Each attempt-1 jobs payload has one row for each required name. Required steps Install dependencies, Verify, and Upload packed tarball are success. `gh pr checks 21` reports those four jobs pass.

| Event | Run | Job | Artifact | Bytes | Archive SHA-256 |
| --- | --- | --- | --- | --- | --- |
| push | [41961723639](https://github.com/exones/braid/actions/runs/41961723639) | ubuntu `127029392267` | `13385488438` | 32017 | `a02ffe9ad27f8ec304d7ef40fad036dba4675db5ebbbf04645096c093d776abc` |
| push | same | windows `127029391373` | `13385956584` | 32022 | `60c71a12dd64018cd23417789ec31aa1e173f72c173bbc6c01b848ee3f61d48d` |
| pull_request | [41961730264](https://github.com/exones/braid/actions/runs/41961730264) | ubuntu `127029412439` | `13385248381` | 32033 | `9789e5b2d66f445044057f74b6aae2e89c8cff6d5a0e00ade93e92fc29dc3262` |
| pull_request | same | windows `127029412879` | `13385373920` | 32040 | `c3b817a57691260130595376954c067be2800943a753973ebcb30fb53de7a151` |

**Independent archives, downloaded before the candidate command.** Bytes are under `C:\Users\exon\AppData\Local\Temp\braid-I-review-4fed09d`. Each zip starts with `PK`, and its length and SHA-256 match the table and the artifact `digest`. Each zip contains `exones-braid-0.1.1.tgz`, `exones-braid-0.1.1.provenance.json`, and `npm-pack.json`. The tarball SHA-256 is `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36` in all four and equals `provenance.digest`. `candidate` is true and `worktreeDirty` is false. Push `sourceRevision` and `githubSha` are the candidate, `pullRequestHeadSha` is empty, and `githubRef` is `refs/heads/item/braid-003-i-pr-proof`. Pull-request `sourceRevision` and `githubSha` are `1b08f102475da058f09ca8a5f94ff6e5863f1110`, `pullRequestHeadSha` is the candidate, and `githubRef` is `refs/pull/21/merge`. The same tarball digest on all four archives is an observation for this head.

**Candidate command for pull 21.** From this checkout, `pwsh -NoProfile -File scripts/Test-PrProof.ps1 -PullRequest 21` printed `PASS`, exited 0, `mode` `live`, `proofScope` `current`, `currentReady` true, `skipArtifacts` false, final state `open`, final target `epic/braid-003-worker-skill`, limitations empty. `recordedBase` and `liveBase` are both `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`. `headRecheck.unchanged` is true. Run, job, archive, tarball, source, and parent values repeat the independent evidence above. `-SkipArtifacts` was not used. The command's later copies under ignored `.tools/pr-proof/21-4fed09d514ce` have the same byte lengths and SHA-256 values.

**Historical pull 20.** The same full-mode command exited 0 with `proofScope` `historical`, `currentReady` false, state and final state `merged`, target name unchanged, recorded base `2b823f9fb7918b8db04d8cf985be327cdad28f70`, live base `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, head `d28e052e26ac3a13dc2c34c3fa3cc1838864c8ca`, and limitation `historical merged snapshot; not current pull-request readiness`. The command's four archive hashes match the figures already recorded for that head. This pass did not download pull 20 a second time outside that command.

**Offline checks.** PowerShell 7.6.9. `pwsh -NoProfile -File test/fixtures/pr-proof/Test-PrProof.ps1` exited 0: green current PASS, newer failed attempt FAIL, pending PENDING, newer pending run PENDING, stale head FAIL, reversed parents FAIL, archive digest FAIL, provenance digest FAIL, `-SkipArtifacts` PASS with the waiver limitation, `-SkipArtifacts` still FAIL on a failed job, expired archive FAIL, live base already advanced FAIL, that case still FAIL with `-SkipArtifacts`, live base moving during proof FAIL, matching live base PASS, merged historical PASS with `currentReady` false, the four live-model seam cases above, and a missing pull request rejected.

**Callers.** The worker skill, T3 continuation, assignment-packet asset, and review template say to accept a PASS for an active pull request only when `proofScope` is `current` and the final view is still open on the same target ref. On this head, PASS with `proofScope` `current` is the same condition as `currentReady` true: the failure list blocks a PASS when the final state, target name, head, tip, or final parents disagree.

## Findings

No actionable findings.

## Acceptance assessment

| Criterion | Verdict at `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4` |
| --- | --- |
| 1. A merged historical pull request returns PASS with its recorded ids, and an open current pull request is distinguishable | Proven. Pull 20 exits 0 with `proofScope` `historical`, `currentReady` false, and recorded base `2b823f9fb7918b8db04d8cf985be327cdad28f70`. Pull 21 exits 0 with `proofScope` `current`, `currentReady` true, final state open, and final target `epic/braid-003-worker-skill`. |
| 2. FAIL when a required job has failed, PENDING while runs are in progress | Proven offline. The failed-attempt fixture exits 1. The pending fixtures exit 2. No live failed or pending pull request was opened. |
| 3. Docs point at the command; independent review; human merge into the epic | The worker skill, T3 continuation, assignment-packet asset, and review template point at `scripts/Test-PrProof.ps1` and keep the prose check set as the definition, including the final open view on the same target ref. This file is the independent review. Human merge of pull 21 is still open, so I is not Done. |

Proof-contract checks that held on the fixtures, the seam probe, and the pull 21 evidence: exit 0 only for PASS; both events, both `verify` jobs, and the three required steps; archive bytes match the artifact digest; tarball bytes match provenance; push provenance maps to the candidate; pull-request provenance maps to merge-test `1b08f102475da058f09ca8a5f94ff6e5863f1110` with parents frozen tip then head; a stale live tip still fails with artifact bytes waived; a close, merge, or same-SHA retarget during an open proof fails and stays `proofScope` `current`.

## Triage and gate

Review001/F1 stays resolved at `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`. Review002/F1 is repaired at `4fed09d514ceaa7d90b4ab5fe1be2e45f76bfcb4`. The coordinator records that disposition with the exact revision. GitHub `reviewDecision` is empty. This file is the technical gate record. It is a review summary, and the human merge remains a separate action. D stays stopped.

## Resume

Coordinator triages this pass. The pull 21 full-mode PASS is current proof against frozen tip `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, which was still the remote epic tip after the checks. Owned outputs stay uncommitted:

- `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-003.md`
- `epics/braid/003-worker-skill/checkpoints/reviews/I/I-pr-proof-script-review-003.md`

Proposed shared status: I stays in review. Review002/F1 is repaired at this SHA. No new findings. I is not merged and not Done. The reviewer stops. Next owner is the coordinator for triage and the human merge gate. D stays stopped.

### Limits

- `npm run verify`, the skill validators, typecheck, build, the test suite, and pack were not re-run. The author's full verify was a dirty probe from `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`, candidate false. `quick_validate.py` is not in this checkout.
- No live close, merge, or retarget of pull 21 was performed. Those failures were stubbed `gh` responses through `Get-LiveModel`. No live GitHub auth or schema fault was injected. The injected second-view throw was in-process.
- The committed seam stub returns one tip SHA for every branch URL. The retarget URL was checked by the separate probe, not by an assertion inside the fixture. The fixture's `ExpectedCode` parameter is not asserted; the process exit for PASS and FAIL is covered by the other fixture cases and by the live commands.
- A parent mismatch, including a wrong second parent or reversed parents, uses the reason `merge-test first parent is not the live target tip`. The verdict is still FAIL.
- `headRecheck.unchanged` compares the head and tip SHAs. A same-SHA retarget fails on the target name while that flag can remain true. `currentReady` is false in that case.
- A replacement merge object with the same ordered parents still passes. The command is a finite snapshot, not an atomic GitHub transaction.
- Pull 20 archive bytes were hashed from the command's downloads. They match the previously recorded hashes. They were not fetched again by a second client.
- Job selection keeps the first row with the required name. This head's jobs API returned one row per required name.
- The command does not compare `githubRef`. The inspected pull 21 provenance refs match the push branch and `refs/pull/21/merge`.
- The live runs wrote gitignored files under `.tools/pr-proof/`. Tracked source and the index stayed unchanged apart from the two uncommitted review files.
