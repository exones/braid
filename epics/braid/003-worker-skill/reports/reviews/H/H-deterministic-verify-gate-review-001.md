# H-deterministic-verify-gate-review-001: deterministic verify gate

`npm run verify` at `7b56b82ae0b259a5e1e9a326786b1da286f5c10f` checks tracked Markdown links and anchors and tracked-text line endings, and the existing code gate is still in the same command. This pass has no actionable findings. Human merge of PR 18 into the epic remains.

Parent: BRAID-003/H (`backlog/H-deterministic-verify-gate.md`). Pass: 001.
Reviewer: independent review role, in T3 Code through the Cursor harness, model Grok 4.7 (`grok-4.7`). Not the implementation author.
Agent/assignment name: H-deterministic-verify-gate-review-001.
Report/checkpoint: `epics/braid/003-worker-skill/reports/reviews/H/H-deterministic-verify-gate-review-001.md`, `epics/braid/003-worker-skill/checkpoints/reviews/H/H-deterministic-verify-gate-review-001.md`.
Assignment packet: `epics/braid/003-worker-skill/assignments/reviews/H/H-deterministic-verify-gate-review-001.md`.
Candidate: `7b56b82ae0b259a5e1e9a326786b1da286f5c10f`. Parent: `3960e66679b8a2ea697a5fe6a40a414d4a3a6f6d`. Epic base: `02e3a5c208001794a7f37a564ccce8d4d3be1e71`.
PR: https://github.com/exones/braid/pull/18, OPEN, MERGEABLE, `reviewDecision` empty. Head and base reconfirmed after the checks.
Status: no-findings. Date: 2026-11-04.

## Scope and evidence

Reviewed acceptance criteria 1–4 against candidate Git objects. The review checkout stayed on `t3/acea0502` at coordinator context `42b6f4397bdb24c644ae51925bdc46bd29b8e7be`. Candidate blobs were read with `git show` and `git diff 02e3a5c208001794a7f37a564ccce8d4d3be1e71 7b56b82ae0b259a5e1e9a326786b1da286f5c10f`. Executable checks used a disposable clone of that commit at `C:\Users\exon\AppData\Local\Temp\braid-h-review-7b56b82`. The author checkout `C:\worktrees\agento\t3-b41c4990` was left untouched. Coordinator epic and checkpoint files were read as assignment context. They are not the reviewed candidate tree.

**Diff.** Four commits. `c1dd19f` adds the gate, `cc9e787` repairs Windows link scanning, `3960e66` merges epic tip `02e3a5c` (other parent `cc9e787`), and `7b56b82` records that repair. 17 files, 3721 insertions, 42 deletions. `.gitattributes`, `.editorconfig`, `.remarkrc.mjs`, `scripts/Verify.ps1`, `scripts/Test-DocsGate.ps1`, `scripts/check-markdown-links.mjs`, `scripts/markdown-link-exclusions.json`, `test/fixtures/docs-gate/Test-DocsGateNegatives.ps1`, exact `remark-cli` 12.0.1 and `remark-validate-links` 13.1.0 plus the lockfile, and the gate sentence in AGENTS.md, both skills, the assignment-packet asset, and README. `git diff --check` on that range exited 0. `.github/workflows/ci.yml`, `.npmrc`, and `docs/decisions.md` are unchanged from the epic base. Package version stays 0.1.1.

**Gate behavior.** `scripts/Verify.ps1` runs the docs gate and the disposable negative fixture, then the OIDC guard, install-policy guard, typecheck, build, test, and packed install. The link check uses `unified-engine` with `cwd` set to the repository being scanned, `detectIgnore: false`, and paths relative to that root. `repository: false` leaves external `http` and `https` URLs unchecked. `inspiration/` is omitted from the scanned file list, and `skipPathPatterns` skips a resolved path under `inspiration`. Seven historical `agento-coordinate` links are one-finding exclusions. Tracked text is read from index blobs and, when the bytes differ, from the worktree. `eol=lf` and the binary archive/image attributes are in `.gitattributes`.

**Preserved epic text.** Against `02e3a5c`, the AGENTS, skill, and assignment-packet edits insert the `npm run verify` sentence into the existing paragraphs. The packet Continuation bullet is unchanged from the epic tip, including the top-level watch route and the statement that watch survival, unassisted repair, and exactly-once delivery stay unproven.

**Local checks on the disposable candidate clone.** Node v26.13.0 and npm 11.20.0 came from that clone's `.tools` toolchain. PowerShell 7.6.9. `npm ci` exited 0 (200 packages). `scripts/Test-DocsGate.ps1` exited 0: `suppressed=7 exclusions=7 text=225`. `Test-DocsGateNegatives.ps1` exited 0: baseline, Windows `subst` cross-drive baseline, untracked broken link, and the four required failures (broken link, broken anchor, CR in the index blob, CR in the worktree, trailing whitespace in the index blob, trailing whitespace in the worktree). Extra probes on a throwaway repository: an external URL and a broken link inside tracked `inspiration/` passed; an unstaged broken heading failed; a link to a missing `inspiration/` file passed; a staged broken link with a repaired worktree file passed; a root-absolute `/missing.md` link passed. `npm audit --omit=dev` reported total 0. `npm ci` reported 9 moderate dev findings in the remark toolchain. `quick_validate.py` was not on the reviewer machine.

**Hosted jobs, from `gh run view` and the Verify logs. Artifacts were not downloaded.**

| Run | Event | Job | Verify source revision | Result |
| --- | --- | --- | --- | --- |
| [41925786653](https://github.com/exones/braid/actions/runs/41925786653) attempt 1 | push | verify (ubuntu-latest) `126909727353` | `7b56b82ae0b259a5e1e9a326786b1da286f5c10f` | success; docs gate `suppressed=7 exclusions=7 text=225`; cross-drive skipped |
| 41925786653 | push | verify (windows-latest) `126909727821` | `7b56b82ae0b259a5e1e9a326786b1da286f5c10f` | success; same docs-gate counts; cross-drive baseline passed; four negative cases failed as required |
| [41925792078](https://github.com/exones/braid/actions/runs/41925792078) attempt 1 | pull_request | verify (ubuntu-latest) `126909746868` | merge-test `c8e0443e82e4cba56c5ef4eb0c2586745b7e02ea` | success; same docs-gate counts |
| 41925792078 | pull_request | verify (windows-latest) `126909746477` | `c8e0443e82e4cba56c5ef4eb0c2586745b7e02ea` | success; cross-drive baseline passed |

Install dependencies, Verify, and Upload packed tarball succeeded on all four jobs. `package-proof candidate True` on each. GitHub records merge-test parents as base `02e3a5c208001794a7f37a564ccce8d4d3be1e71` then head `7b56b82ae0b259a5e1e9a326786b1da286f5c10f`. The candidate workflow sets `BRAID_PR_HEAD_SHA` from `github.event.pull_request.head.sha`. The provenance file inside the uploaded artifact was not read.

The original Windows failures remain historical. Push `41924394832` job `126904854767` and the matching pull_request job failed in the disposable baseline with `ignore` `RangeError: path should be a path.relative()d string` for a `C:\Users\runneradmin\AppData\Local\Temp\...` file while the checkout was on `D:\a\braid\braid`. The in-repo docs gate had already passed (`text=222`). The repair log and the local `subst` run pass that case.

## Findings

No actionable findings.

Coverage that stays outside the acceptance criteria: the link check reads worktree bytes of index-tracked Markdown, so a staged broken link is accepted while the worktree file is valid; a clean checkout still sees the committed bytes. Root-absolute `/...` links are unchecked with `repository: false`; the candidate Markdown has none. A missing final newline is not a failure. `remark` 15.0.1 and `unified-engine` 11.2.2 are transitive lockfile entries hoisted to the top of `node_modules`; the gate exits if those directories are absent. The 9 moderate dev-audit findings are the disclosed remark toolchain set. Production audit total is 0.

## Acceptance assessment

| Criterion | Verdict at `7b56b82` |
| --- | --- |
| 1. `npm run verify` fails on a broken relative link, a broken anchor, a CRLF line, and trailing whitespace | Proven. The negative fixture is part of `scripts/Verify.ps1`. Local Windows run and the Windows push log show each case failing as required, including index-blob and worktree forms for CR and trailing whitespace. An untracked broken link stays green. |
| 2. The same command passes locally and in Ubuntu and Windows push and pull_request jobs | Proven for this head's hosted gate. All four jobs and the Install, Verify, and Upload steps succeeded. The disposable clone of this head passed the docs gate with the same `7/7/225` counts. The author's clean full local verify, including typecheck, build, tests, and pack, was on `3960e66`. The only later diff is `reports/H.md` and `checkpoints/H.md`, which this docs-gate run included. This review did not repeat the typecheck, build, test, or pack steps locally. |
| 3. Docs name `npm run verify` as the single deterministic pre-PR gate | Proven. AGENTS.md, both skills, the assignment-packet asset, and README use that sentence. External skill validators stay outside the command. `ci.yml` still runs `npm run verify`. |
| 4. Separate review and human merge into the epic | This pass is the separate review and records no product defect. Human merge of PR 18 into `epic/braid-003-worker-skill` is still open, so H is not Done. |

## Triage and gate

No findings to fix, refute, or defer. GitHub `reviewDecision` is empty. This file is the technical gate record. It is not a merge. The coordinator's user briefing follows `epics/report-format.md`.

## Resume

Coordinator triages this no-findings pass and stops for the human merge of https://github.com/exones/braid/pull/18 at `7b56b82ae0b259a5e1e9a326786b1da286f5c10f` into the epic before I. Owned outputs stay uncommitted:

- `epics/braid/003-worker-skill/reports/reviews/H/H-deterministic-verify-gate-review-001.md`
- `epics/braid/003-worker-skill/checkpoints/reviews/H/H-deterministic-verify-gate-review-001.md`

Proposed shared status: H stays in review until that human merge is verified. The reviewer stops.
