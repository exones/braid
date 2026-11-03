# Bootstrap candidate review and triage

Date: 2026-11-03. PR: [#1](https://github.com/exones/agento/pull/1).

Fresh read-only reviewer: separate Sol agent `/root/bootstrap_review`. Exact reviewed initial head: `a5c08402ff92768f88a5dbc69c2fc5036a5cbe8e`, base `dc6e3c47aefa974f48124edeae934e471aa99bbe`. Reviewed product, storage/state/events/locking/failures, tests, toolchain/CI, README, and coordinator-authored operating docs. No additional actionable finding beyond the two below. No GitHub approval, packaging proof, or final R is implied.

## Findings and corrections

1. **P1: valid block reasons could make the ledger unreadable** (`src/ledger.ts`, original line 376). A reason can be 2000 characters, while `nextAction` is limited to 500. Unconditionally generating `Resolve: <reason>` committed invalid state/events for reasons longer than 491 characters. The coordinator reproduced this with separate processes: a 493-character reason returned success, stored a 502-character next action, then status exited 3. Corrected the generated default: retain `Resolve: <reason>` when it fits; otherwise use `Resolve block; see block reason.`. Preserve the entire reason and explicit `--next` unchanged. Updated help and the conflicting contract default. This preserves accepted long-input support rather than narrowing limits or truncating user text. Added process regression checks at reason lengths 491, 492, and 2000, including status, event consistency, resume, and explicit 500-character next action.

2. **P2: read-only-destination test assumed Windows behavior on POSIX** (`test/ledger-failures.test.ts`, original line 413). POSIX rename-over checks directory permissions, so mode 0444 on the destination does not prohibit replacement. The [initial Ubuntu CI run](https://github.com/exones/agento/actions/runs/41663011087) confirms the old assertion failed (`0 !== 5`), with 38 of 39 tests passing. Corrected the test to assert Windows denial/preservation and POSIX successful replacement with matching state/event revisions. The cross-platform injected pre-commit failure test remains unchanged and still proves state/event preservation. The real read-only-event append failure check remains. No test was deleted or skipped and no product failure guarantee was relaxed.

## Validation and remaining gates

After both corrections, `pwsh -NoProfile -File ./scripts/Verify.ps1` exited 0 on Node v26.13.0/npm 11.20.0: typecheck/build, 3 suites/40 tests passed, 0 skipped. These new changes require final hosted Windows/Ubuntu CI and a bounded fresh fix review. Original reviewer did not review the corrections; do not present the original review as approval of the updated head. Human merge approval remains outstanding.

## Fix review and hosted evidence

The separate Sol High reviewer completed the bounded recheck of `af0b69fa4c6ea8d2216d133c6d46a99981a1cbd9` against `a5c08402ff92768f88a5dbc69c2fc5036a5cbe8e` with no actionable P1/P2/P3 findings. It checked the reason/default boundaries, full reason and explicit next-action preservation, platform assertions, regression coverage, and triage documentation. It ran `git diff --check` and inspected the clean exact-head worktree; it did not rerun tests or query remote checks. This is an independent agent review, not a formal GitHub approval. Its link is in `bootstrap-delivery.md`.

The coordinator verified [PR-triggered CI run 41663657936](https://github.com/exones/agento/actions/runs/41663657936) has `headSha` `af0b69fa4c6ea8d2216d133c6d46a99981a1cbd9` and conclusion `success`. Both [Windows verification](https://github.com/exones/agento/actions/runs/41663657936/job/126013116962) and [Ubuntu verification](https://github.com/exones/agento/actions/runs/41663657936/job/126013116967) passed dependency installation and the PowerShell verification gate. The push-triggered jobs also show success. No additional product change is needed from these findings.

The following evidence-only commit updates epic/checkpoint/reports; product, tests, build, and workflow remain exactly as reviewed in `af0b69f`. Require hosted CI on the latest PR head as usual. Read its result from GitHub rather than generating another evidence commit merely to record an evidence commit's own checks. D packaging, final R, human merge, and release/publication remain outstanding.
