# I-pr-proof-script-review-001: current-head PR proof command

`scripts/Test-PrProof.ps1` at `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9` returns a finite PASS/FAIL/PENDING verdict, and its full-mode PASS on PR 21 matches the jobs and archive bytes for merge base `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`. That PASS is not current proof: `epic/braid-003-worker-skill` is `dd5b82fa8b8648e52d2c29b1c8981bc068f0c732`. Coordinator triage of finding F1 is next. This pass does not merge and does not start D.

Parent: BRAID-003/I (`backlog/I-pr-proof-script.md`). Pass: 001.
Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`). Not the implementation author.
Agent/assignment name: I-pr-proof-script-review-001.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-001.md`, `epics/braid/003-worker-skill/checkpoints/reviews/I/I-pr-proof-script-review-001.md`.
Assignment packet: read with `git show 0fa8b9f93c7a32c8088a98daa58dc61bbff13c9a:epics/braid/003-worker-skill/assignments/reviews/I/I-pr-proof-script-review-001.md`. That object is outside the candidate.
Candidate: `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`. Checked CI base: `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`. Current epic tip: `dd5b82fa8b8648e52d2c29b1c8981bc068f0c732`.
PR: https://github.com/exones/braid/pull/21, OPEN, MERGEABLE, `mergeable_state` clean, `reviewDecision` empty.
Status: findings. Date: 2026-11-05.

## Scope and evidence

Reviewed acceptance criteria 1–3 and the I proof contract on the attached checkout `C:/worktrees/agento/review-braid-003-i-001`, branch `review/braid-003-i-001`, HEAD `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`. The worktree and index were clean before this report. No author source, index, or cache was edited. The diff against `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579` is one commit, `ad0b1b6`, nine files. `scripts/Test-CoordinatorRecordsGate.ps1` is absent from that diff. `.github/workflows/ci.yml`, package metadata, and the release workflow are unchanged.

Read: candidate AGENTS and review conventions, the review template, I backlog, assignment, report, and checkpoint, the exact diff, `scripts/Test-PrProof.ps1`, `test/fixtures/pr-proof/Test-PrProof.ps1`, the `scripts/Verify.ps1` addition, and the worker skill, assignment-packet asset, T3 continuation, and review-template edits.

**Current metadata, re-read after the live command.** Pull 21 `base.sha` is still `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579`, `head.sha` is still `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`, and `updated_at` is `2026-11-05T00:39:18Z`. `refs/pull/21/merge` is still `489194602b5016dde7385eb3ae2e5e2457bde7a2`, parents `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579` then `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`, committer date `2026-11-05T00:35:23Z`. The epic branch tip is `dd5b82fa8b8648e52d2c29b1c8981bc068f0c732` at `2026-11-05T00:45:36Z`. Compare of `4631970...dd5b82f` is ahead by 2 and behind by 0:

| Commit | Subject | Files |
| --- | --- | --- |
| `0fa8b9f93c7a32c8088a98daa58dc61bbff13c9a` | docs(braid-003): record I green evidence and assign review001 | review assignment, `checkpoints/current.md`, `checkpoints/log.md`, `epic.md` |
| `dd5b82fa8b8648e52d2c29b1c8981bc068f0c732` | docs(braid-003): record top-level I review001 launch | `reports/I-coordinator-triage.md` |

Those commits are records. They do not change the proof script or CI. They do change the epic tip that a merge into `epic/braid-003-worker-skill` would use. The frozen parent mapping is accurate for `4631970` and is invalidated for `dd5b82f`.

**Hosted runs for this head.** `actions/runs?head_sha=ad0b1b6dc5bf434f487ba0605e269e79194ef1f9` returned `total_count` 2, both workflow `CI` path `.github/workflows/ci.yml`, attempt 1, conclusion success. No newer run existed before or after the live command.

| Event | Run | Job | Steps Install dependencies, Verify, Upload packed tarball |
| --- | --- | --- | --- |
| push | [41942426871](https://github.com/exones/braid/actions/runs/41942426871) | ubuntu `126966280989`, windows `126966280712` | success; job `head_sha` is the candidate |
| pull_request | [41942455320](https://github.com/exones/braid/actions/runs/41942455320) | ubuntu `126966376360`, windows `126966376787` | success; job `head_sha` is the candidate |

`gh pr checks 21` reports all four jobs pass. Each jobs payload has one row for each required name.

**Archives, downloaded independently before the candidate command.** Bytes are under `C:\Users\exon\AppData\Local\Temp\braid-I-review-ad0b1b6`. Each zip length matches `size_in_bytes`. Each SHA-256 matches the artifact `digest` and the packet table. Each zip contains `exones-braid-0.1.1.tgz`, `exones-braid-0.1.1.provenance.json`, and `npm-pack.json`. The tarball SHA-256 is `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36` in all four and equals `provenance.digest`. `candidate` is true and `worktreeDirty` is false. Push `sourceRevision` and `githubSha` are the candidate, `pullRequestHeadSha` is empty, `githubRef` is `refs/heads/item/braid-003-i-pr-proof`. Pull-request `sourceRevision` and `githubSha` are `489194602b5016dde7385eb3ae2e5e2457bde7a2`, `pullRequestHeadSha` is the candidate, `githubRef` is `refs/pull/21/merge`. The same tarball digest on all four archives is an observation for this head. It is not a cross-OS claim.

| Event / job | Artifact | Bytes | Archive SHA-256 |
| --- | --- | --- | --- |
| push Ubuntu `126966280989` | `13376278439` | 32017 | `77fda68310748eee4018316211319b5957549ded9d92854a874743a4b65559b7` |
| push Windows `126966280712` | `13375884590` | 32023 | `bdb158ae0b24ac7a193d876706ff90a80ddf60820a418c0a6115d8dfc6bdb8e4` |
| PR Ubuntu `126966376360` | `13376684659` | 32034 | `a2c84473d3e4e36f537206e2487dffabe5a4bf6dd97f851a7b019d0b0f294091` |
| PR Windows `126966376787` | `13375809394` | 32041 | `2be45f6e595c8effe6c5c3874a1f39d265b8f101b1d3788d6cb7a2dea0419ffc` |

**Candidate command.** From this checkout, `pwsh -NoProfile -File scripts/Test-PrProof.ps1 -PullRequest 21` printed `PASS`, exited 0, `mode` `live`, `skipArtifacts` false, limitations empty. Its JSON repeats the run, job, artifact, archive, and tarball identifiers above. Pull-request parents are `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579` then `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9`. `headRecheck` head and base equal the first read, `unchanged` true. That PASS agrees with the PR object and with the independent bytes. It certifies base `4631970`, which is not the epic tip. `-SkipArtifacts` was not used.

**Offline checks.** PowerShell 7.6.9. `pwsh -NoProfile -File test/fixtures/pr-proof/Test-PrProof.ps1` exited 0: green PASS, newer failed attempt FAIL, pending PENDING, newer pending run PENDING, stale head FAIL, reversed parents FAIL, archive digest FAIL, provenance digest FAIL, `-SkipArtifacts` PASS with the waiver limitation, `-SkipArtifacts` still FAIL on a failed job, expired archive FAIL, missing pull request rejected. Extra fixtures from this checkout: equal-timestamp artifacts FAIL as ambiguous; a higher attempt with an older `createdAt` FAIL on the failed job; a skipped upload FAIL while a sibling run is pending; a step with conclusion `success` and status `in_progress` FAIL. The fixture script does not call `gh`. `scripts/Verify.ps1` invokes that fixture and then the existing typecheck, build, test, and packed-install commands. This review did not re-run `npm run verify`.

## Findings

### I-pr-proof-script-review-001/F1

Severity: high. File: `scripts/Test-PrProof.ps1`, `Get-PullRequestView` at lines 563–573, parent comparison at lines 788–789, and the re-read at lines 916–923.

`Get-PullRequestView` takes the base from `gh pr view --json baseRefOid`. The parent check requires the merge-test parents to be that SHA then the pull-request head. The re-read compares a second pull-request view with the first. It never resolves the base branch tip.

Concrete result: before and after the live command, `epic/braid-003-worker-skill` was `dd5b82fa8b8648e52d2c29b1c8981bc068f0c732` while pull 21 `base.sha` and `refs/pull/21/merge` still identified `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579` and `489194602b5016dde7385eb3ae2e5e2457bde7a2`. The command printed `PASS` and exited 0 with `headRecheck.unchanged` true. A worker treating exit 0 as current-base proof would accept a merge-test whose first parent is not the epic tip.

Expected behavior: exit 1 when the current tip of the pull request's base branch differs from the merge-test's first parent. The archive digests and the historical parent order for `4631970` can stay in the JSON. They are not a PASS for `dd5b82f`.

## Acceptance assessment

| Criterion | Verdict at `ad0b1b6` |
| --- | --- |
| 1. A green pull request returns PASS with the correct ids and digests | Proven for PR 21 against base `4631970`. Independent archive bytes, provenance, and the commits API match the command's JSON. Historical merged PR 20 was not run again. This PASS is invalidated for epic tip `dd5b82f` by F1. |
| 2. FAIL when a required job has failed, PENDING while runs are in progress | Proven offline. The failed-attempt fixture exits 1 and selects attempt 2. The pending and newer-pending fixtures exit 2 and do not keep an older success. No live failed pull request was opened. |
| 3. Docs point at the command; independent review; human merge into the epic | The worker skill, T3 continuation, assignment-packet asset, and review template point at `scripts/Test-PrProof.ps1` and keep the prose check set as the definition. This file is the independent review. Human merge of PR 21 is still open, so I is not Done. |

Proof-contract checks that held on the fixtures and on the `4631970` evidence: exit 0 only for PASS, exit 1 for FAIL, exit 2 for PENDING; both events, both `verify` jobs, and the three required steps; newest run and highest attempt; a terminal failure beating a pending sibling; expired, ambiguous, missing, and digest-mismatch failures; fixture `mode` distinct from live `mode`; `-SkipArtifacts` recorded only when passed and not substituted after a failed job. Push provenance maps to the candidate with an empty pull-request head. Pull-request provenance maps to merge-test `489194602b5016dde7385eb3ae2e5e2457bde7a2` with parents base then head, for base `4631970` only.

## Triage and gate

F1 is open. The coordinator records fixed, refuted, or deferred with the exact revision. GitHub `reviewDecision` is empty. This file is the technical gate record. It is not a GitHub approval and it is not a merge. The coordinator's user briefing follows `epics/report-format.md`. D stays stopped.

## Resume

Coordinator triages F1. The historical CI record for base `4631970cc6e7ac6eec1e2da9dc3b95a8a502b579` remains the checked archive evidence. It is not current proof against `dd5b82fa8b8648e52d2c29b1c8981bc068f0c732`. Owned outputs stay uncommitted:

- `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-001.md`
- `epics/braid/003-worker-skill/checkpoints/reviews/I/I-pr-proof-script-review-001.md`

Proposed shared status: I stays in review. F1 is unresolved. I is not accepted, not merged, and not Done. The reviewer stops. No merge and no D dispatch.

### Limits

- `npm run verify`, the skill validators, typecheck, build, the test suite, and pack were not re-run. The author's full verify was a dirty probe from `4631970` and is not a clean exact-head local proof.
- No live failed or pending pull request was created. PENDING and terminal-failure precedence are fixture evidence.
- Job and step selection keeps the first row with the required name. This head's jobs API returned one row per required name.
- An expired artifact is ignored when another fresh artifact with the same name exists. The fresh one can be older.
- A missing `size_in_bytes` does not fail before the body is read (`scripts/Test-PrProof.ps1` lines 630–632). These four artifacts declared 32017–32041 bytes and the downloaded lengths matched.
- The live run wrote gitignored files under `.tools/pr-proof/`. Tracked source and the index stayed unchanged apart from the two uncommitted review files.
- The command does not read `githubRef`. The inspected provenance refs match the push branch and `refs/pull/21/merge`.
