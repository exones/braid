# Bootstrap delivery: A/B/C/N

Date: 2026-11-03. Status: [PR #1](https://github.com/exones/agento/pull/1) human-merged; A/B/C/N Done. No package publication performed or authorized.

## Delivery scope and history

Remote `main` is `dc6e3c47aefa974f48124edeae934e471aa99bbe`. The user already committed A/B together as `3283807afee076d2d4cf1ee24c44ba1df20576da` (`Spikes A, B implemented`), before the PR delivery rule was introduced. Preserve that commit unchanged. Group A/B's outstanding delivery with C's manual ledger, N's `.agento/` correction, and the related operating-document cleanup in one bootstrap PR. Splitting the existing bundled history would obscure the actual delivery boundary. Future stories/spikes use scoped PRs by default.

No worker is running. At this handoff the index is empty; all current modified/untracked paths were inspected and belong to bootstrap implementation/evidence or the user's agreed workflow changes. Create owned branch `feat/seed-manual-ledger`, based on the current user commit, without resetting or rewriting local `main`.

Created that branch and committed product changes as `6d901901e5b4eb17d9b8c1feffc0f9569e0e1bbf` (`feat(ledger): add manual tracking with agento storage`). The local gate above tested the exact product/test content in that commit; subsequent changes are operating/evidence documentation. Active documentation links, coordinator skill structure, and `git diff --check` passed before commit. User commit `3283807` remains unchanged in the branch history.

## Checks

- Initial PR head: `a5c08402ff92768f88a5dbc69c2fc5036a5cbe8e`, including documentation commit `docs(workflow): record bootstrap delivery and storage decision`. Branch pushed and PR linked in T3. First observed hosted jobs: Windows and Ubuntu In Progress; no pass claimed.
- Separate fresh reviewer assigned to that exact head, including coordinator-authored documentation. Review is supporting bootstrap delivery, not final R (D does not exist yet).
- C gate independently rerun before N: Node v26.13.0/npm 11.20.0, typecheck/build, 38 tests passed.
- N gate independently rerun after N: `pwsh -NoProfile -File ./scripts/Verify.ps1`, exit 0, same toolchain, 39 tests in 3 suites passed, no skips.
- `git diff --check` passes. Documentation links and coordinator skill validation are checked before commit.
- README progress cleanup changes documentation only after the N gate.
- Initial review/CI observations above are historical. Current product review/CI results are recorded below; an agent review is not a platform approval or merge decision.

## Review corrections

Fresh review completed on initial head `a5c08402ff92768f88a5dbc69c2fc5036a5cbe8e`; two findings and corrections are recorded in [bootstrap-review.md](bootstrap-review.md). Initial Ubuntu CI failed on the Windows-only read-only destination assumption; preserved that failure evidence. The long-reason fix and corrected platform expectation pass a new local typecheck/build/40-test gate. Push corrections and request a bounded independent fix review; hosted CI must check the new head. No merge/publication performed.

Pushed corrected head `af0b69fa4c6ea8d2216d133c6d46a99981a1cbd9` and immediately relinked PR #1. Updated its description with 40-test validation and retained initial CI/review failure evidence. A separate read-only Sol High fix reviewer in a tool-created worktree, client request `b2c97d32-5890-4dad-b10a-0b8d991f0784`, completed with no actionable findings on that head. Review: <t3-thread://v2/c361f221-e595-46eb-8f4b-7926ea55f19c/thread:delegated-task:command%3Amcp%3Ad516eddd-b5de-42ae-905c-f8e6669b5562%3Adelegate-task%3Ab2c97d32-5890-4dad-b10a-0b8d991f0784>. The reviewer inspected the bounded diff/context, confirmed clean exact HEAD, and ran `git diff --check`; no redundant full test run or remote CI query was claimed.

Coordinator-observed hosted proof: [PR CI run 41663657936](https://github.com/exones/agento/actions/runs/41663657936), `headSha` `af0b69fa4c6ea8d2216d133c6d46a99981a1cbd9`, conclusion `success`; Windows job 126013116962 and Ubuntu job 126013116967 both passed dependency installation and verification. Push-triggered checks also passed. There is no formal GitHub review/approval recorded; agent review evidence is separate.

This follow-up commit changes only epic/backlog/checkpoint/reports to record those results. Runtime, tests, build, and workflow remain identical to the reviewed/CI-passed product revision. Validate documentation links/formatting and require hosted CI on the latest PR head. Its check results live on GitHub; no extra commit is needed merely to copy the follow-up commit's own results back into these files.

## Final CI and merge

Final PR head `e997381687c44a84be3e2648454d0ca038b584d0` passed [Windows/Ubuntu PR CI run 41664301642](https://github.com/exones/agento/actions/runs/41664301642). The coordinator confirmed its product/test/build/workflow content was unchanged from reviewed `af0b69f` and stopped the watch before human handback. User then merged and deleted the branch; GitHub confirms state `MERGED`, time `2026-11-03T15:41:11Z`, merge commit `afc05074a27da2cb1a3c225bc9d42d10f184e504`. The merge tree matches `e997381`; original user commits remain preserved. This closes A/B/C/N delivery, without implying a released/packaged seed.

Continue with D's packed-install proof, then separately assigned R. See `D-assignment.md` and the current checkpoint. No release, package upload, or stage 2 work is authorized by the merge.
