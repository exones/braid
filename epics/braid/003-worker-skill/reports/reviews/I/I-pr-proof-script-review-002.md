# I-pr-proof-script-review-002: repair of the live target tip

`scripts/Test-PrProof.ps1` at `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777` returns current PASS for pull 21 only when the merge-test parents are the live `epic/braid-003-worker-skill` tip `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` then that head. Review001/F1's stale cached `baseRefOid` is repaired for that steady state. The final reread still keeps the first view's pull-request state and base ref name, so a close or a retarget during the snapshot can keep `currentReady` true. That remainder is review002/F1. This pass does not merge and does not start D.

Parent: BRAID-003/I (`backlog/I-pr-proof-script.md`). Pass: 002.
Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`). Not the implementation author.
Agent/assignment name: I-pr-proof-script-review-002.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-002.md`, `epics/braid/003-worker-skill/checkpoints/reviews/I/I-pr-proof-script-review-002.md`.
Assignment packet: read with `git show 428791ac37bee10caa60ed9520119d848baa88a1:epics/braid/003-worker-skill/assignments/reviews/I/I-pr-proof-script-review-002.md`. That object is outside the candidate.
Candidate: `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`. Frozen target: `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`.
PR: https://github.com/exones/braid/pull/21, OPEN, MERGEABLE, `mergeStateStatus` CLEAN, `reviewDecision` empty.
Status: findings. Date: 2026-11-05.

## Scope and evidence

Reviewed the repair of `I-pr-proof-script-review-001/F1` on checkout `C:/worktrees/agento/review-braid-003-i-002`, branch `review/braid-003-i-002`, HEAD `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`. Origin `https://github.com/exones/braid.git`. The worktree and index were clean before this report. No author source, index, or cache was edited.

The range `7714587cfa7846c13560e0fd8c7f9a4c99b670f9...d5fbbff821dbbd5f987aa2bc71a0a0296efb0777` is `ad0b1b6` (the proof command), merge `5c479e6` of the frozen tip, and `d5fbbff` (the repair). The repair diff from `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9` changes `scripts/Test-PrProof.ps1`, `test/fixtures/pr-proof/Test-PrProof.ps1`, the worker skill, T3 continuation, the assignment-packet asset, the review template, and the I report and checkpoint. `.github/workflows/ci.yml` is unchanged.

Read: candidate AGENTS and review conventions, the review template, I backlog, repair packet `assignments/I-fix-001.md`, author report and checkpoint, review001, and `reports/I-coordinator-triage.md`. The event log was not read.

**Review001/F1 disposition.** Repaired for a cached `baseRefOid` that lags the branch tip. `Get-LiveTargetTip` reads `repos/<owner>/<repo>/git/ref/heads/<baseRefName>` and does not copy `baseRefOid` into the live tip. Open-PR parents must be that tip then the head. The same ref is read again after the downloads. Fixture `live-base-advanced` and `live-base-advanced-skip` exit 1 when the recorded base still matches the merge parents and the live tip has moved, including with `-SkipArtifacts`. A git, auth, or schema failure throws from `Invoke-GhJson` or `Get-LiveTargetTip` and the catch exits 1. This pass did not inject a live fault.

**Frozen target after proof.** `git ls-remote` and `git/ref/heads/epic/braid-003-worker-skill` both returned `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` before the downloads, after the independent downloads, after the pull 21 command, and after the pull 20 command. Object type was `commit`. Pull 21 stayed OPEN, `baseRefName` `epic/braid-003-worker-skill`, `baseRefOid` and `headRefOid` unchanged, `updatedAt` `2026-11-05T01:15:14Z`. `refs/pull/21/merge` stayed `89af138d2126bb1be824033c35cd1feb01552783`, parents `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` then `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`, committer `2026-11-05T01:10:47Z`.

**Hosted runs for this head.** `actions/runs?head_sha=d5fbbff821dbbd5f987aa2bc71a0a0296efb0777` returned `total_count` 2. Both are workflow `CI`, path `.github/workflows/ci.yml`, attempt 1, conclusion success. Each jobs payload has one row for each required name. Required steps Install dependencies, Verify, and Upload packed tarball are success.

| Event | Run | Job | Artifact | Bytes | Archive SHA-256 |
| --- | --- | --- | --- | --- | --- |
| push | [41946708312](https://github.com/exones/braid/actions/runs/41946708312) | ubuntu `126980609151` | `13378089372` | 32018 | `9dbf0b1f33ec54af49ef4897bbba397ee98a25c9f7eafef525bdf15c8752df58` |
| push | same | windows `126980609537` | `13378323952` | 32024 | `7bf2435968ae829cb71c580cef3bdaa8cd72a3857dfdd9a85346630db5823652` |
| pull_request | [41946714204](https://github.com/exones/braid/actions/runs/41946714204) | ubuntu `126980628292` | `13377879620` | 32035 | `b7c587a6188688f875bd8e9c364a6443f232c920212d268d7f2699bde16b5b8b` |
| pull_request | same | windows `126980627988` | `13378044624` | 32040 | `5b2bbab614f3614b9eee53d7e272ec2f7193d1c75a45da4acdd6c8d01281b3ab` |

**Independent archives, downloaded before the candidate command.** Bytes are under `C:\Users\exon\AppData\Local\Temp\braid-I-review-d5fbbff`. Each zip starts with `PK`, and its length and SHA-256 match the table and the artifact `digest`. Each zip contains `exones-braid-0.1.1.tgz`, `exones-braid-0.1.1.provenance.json`, and `npm-pack.json`. The tarball SHA-256 is `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36` in all four and equals `provenance.digest`. `candidate` is true and `worktreeDirty` is false. Push `sourceRevision` and `githubSha` are the candidate, `pullRequestHeadSha` is empty, and `githubRef` is `refs/heads/item/braid-003-i-pr-proof`. Pull-request `sourceRevision` and `githubSha` are `89af138d2126bb1be824033c35cd1feb01552783`, `pullRequestHeadSha` is the candidate, and `githubRef` is `refs/pull/21/merge`. The same tarball digest on all four archives is an observation for this head.

**Candidate command for pull 21.** From this checkout, `pwsh -NoProfile -File scripts/Test-PrProof.ps1 -PullRequest 21` printed `PASS`, exited 0, `mode` `live`, `proofScope` `current`, `currentReady` true, `skipArtifacts` false, limitations empty. `recordedBase` and `liveBase` are both `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`. `headRecheck.unchanged` is true. Run, job, archive, tarball, source, and parent values repeat the independent evidence above. `-SkipArtifacts` was not used. The command's later copies under ignored `.tools/pr-proof/21-d5fbbff821db` have the same byte lengths.

**Historical pull 20.** `gh pr view 20` is MERGED, head `d28e052e26ac3a13dc2c34c3fa3cc1838864c8ca`, `baseRefOid` `2b823f9fb7918b8db04d8cf985be327cdad28f70`, merged `2026-11-04T23:54:03Z`. The same full-mode command exited 0 with `proofScope` `historical`, `currentReady` false, that recorded base, live base `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, and limitation `historical merged snapshot; not current pull-request readiness`. Pull-request parents in the JSON are the recorded base then the head. This pass did not hash those archives again. The command's push Ubuntu archive hash equals the earlier author figure `ccd75bbc7c7776e6938682588c76061ea387d05ddc7b08ff35b88b9256285c9d`.

**Offline checks.** PowerShell 7.6.9. `pwsh -NoProfile -File test/fixtures/pr-proof/Test-PrProof.ps1` exited 0: green current PASS, newer failed attempt FAIL, pending PENDING, newer pending run PENDING, stale head FAIL, reversed parents FAIL, archive digest FAIL, provenance digest FAIL, `-SkipArtifacts` PASS with the waiver limitation, `-SkipArtifacts` still FAIL on a failed job, expired archive FAIL, live base already advanced FAIL, that case still FAIL with `-SkipArtifacts`, live base moving during proof FAIL, matching live base PASS, merged historical PASS with `currentReady` false, missing pull request rejected. The fixture script does not call `gh`.

## Findings

### I-pr-proof-script-review-002/F1

Severity: medium. File: `scripts/Test-PrProof.ps1`, `Get-LiveModel` lines 752–770, and `Get-PrProofJudgment` lines 883–889, 1034–1040, and 1051–1057.

The second `Get-PullRequestView` is reduced to `head`. `state` stays the first view's state. `Get-LiveTargetTip` on the reread uses `$first.baseRefName`. Merge parents stay the commit read at the start. `currentReady` is true when the verdict is PASS and that first state is anything other than `merged`.

Concrete result: start from open pull 21, base ref `epic/braid-003-worker-skill` at `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, merge parents that tip then `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`, and the four required jobs success. During the artifact downloads the pull request is closed, or its base ref name is changed to another existing branch, while `epic/braid-003-worker-skill` remains `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` and the head remains `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`. The reread resolves the original branch, `headRecheck.unchanged` is true, and the command prints `PASS` with `proofScope` `current` and `currentReady` true. The JSON `state` remains `open`.

A close or a different base ref name already present on the first view takes the closed failure or the live tip of the new name. A move of the same branch's tip fails with `live target ref changed during proof`, which fixture `live-base-moved` covers. A merge into that same branch usually moves the tip and fails on that check. This pass did not close or retarget pull 21. Before and after the live command the pull request was still open on `epic/braid-003-worker-skill` at the frozen tip, so this head's PASS is the unchanged-base case.

Expected behavior: exit 1 and `currentReady` false when the second view is closed or names a different base branch. Re-read the merge parents against the final branch tip before a current PASS.

## Acceptance assessment

| Criterion | Verdict at `d5fbbff` |
| --- | --- |
| 1. A merged historical pull request returns PASS with its recorded ids, and an open current pull request is distinguishable | Proven. Pull 20 exits 0 with `proofScope` `historical`, `currentReady` false, recorded base `2b823f9fb7918b8db04d8cf985be327cdad28f70`, and live base equal to the frozen epic tip. Pull 21 exits 0 with `proofScope` `current` and `currentReady` true. Pull 20 archive bytes were not hashed again in this pass. |
| 2. FAIL when a required job has failed, PENDING while runs are in progress | Proven offline. The failed-attempt fixture exits 1. The pending fixtures exit 2. No live failed or pending pull request was opened. |
| 3. Docs point at the command; independent review; human merge into the epic | The worker skill, T3 continuation, assignment-packet asset, and review template tell callers to accept an active pull request only when `proofScope` is `current`, and they describe a historical PASS as a merged snapshot. This file is the independent review. Human merge of pull 21 is still open, so I is not Done. |

Proof-contract checks that held on the fixtures and on the pull 21 evidence: exit 0 only for PASS, exit 1 for FAIL, exit 2 for PENDING; both events, both `verify` jobs, and the three required steps; a stale live tip fails with artifact bytes waived; a matching live tip can PASS; merged output stays historical with `currentReady` false; push provenance maps to the candidate; pull-request provenance maps to merge-test `89af138d2126bb1be824033c35cd1feb01552783` with parents frozen tip then head. Review002/F1 is the remaining current-readiness hole.

## Triage and gate

Review001/F1's cached-`baseRefOid` defect is repaired at `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777` for the steady state and for a same-branch tip change. Review002/F1 is open. The coordinator records fixed, refuted, or deferred with the exact revision. GitHub `reviewDecision` is empty. This file is the technical gate record. It is a review summary, and the human merge remains a separate action. D stays stopped.

## Resume

Coordinator triages review002/F1. The pull 21 full-mode PASS is current proof against frozen tip `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, which was still the remote epic tip after the checks. Owned outputs stay uncommitted:

- `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-002.md`
- `epics/braid/003-worker-skill/checkpoints/reviews/I/I-pr-proof-script-review-002.md`

Proposed shared status: I stays in review. Review001/F1's stale cached base is repaired at this SHA. Review002/F1 is unresolved. I is not merged and not Done. The reviewer stops. D stays stopped.

### Limits

- `npm run verify`, the skill validators, typecheck, build, the test suite, and pack were not re-run. The author's full verify was a dirty probe from merge `5c479e6357fcc85bf2e06aaeab735fb23ef3c69b`, candidate false.
- No live failed or pending pull request was created. Review002/F1 was traced through `Get-LiveModel` and was not triggered on GitHub.
- Pull 20 archive bytes were not downloaded independently in this pass.
- An open parent mismatch, including reversed parents, uses the reason `merge-test first parent is not the live target tip` even when the second parent is the mismatched value. The verdict is still FAIL.
- The fixture loader substitutes the recorded base when `liveBase` is absent. The live path throws instead. The advanced, moving, and matching fixtures set `liveBase` explicitly.
- Job selection keeps the first row with the required name. This head's jobs API returned one row per required name.
- The live runs wrote gitignored files under `.tools/pr-proof/`. Tracked source and the index stayed unchanged apart from the two uncommitted review files.
- The command does not compare `githubRef`. The inspected pull 21 provenance refs match the push branch and `refs/pull/21/merge`.
