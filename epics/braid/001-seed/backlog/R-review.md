# R: fresh-context seed review

Status: done as legacy review execution only. Parent gate `AGENTO-001/review-01` completed with two P2 findings; D remains In Review. This file preserves the original R assignment rather than defining a new independent backlog deliverable. See [review record](../reports/reviews/AGENTO-001/01.md) and [checkpoint](../checkpoints/reviews/AGENTO-001/01.md).
Kind: review task. Epic: AGENTO-001. Feature: F2, installable bootstrap release.
Role: reviewer. Product files read-only; write review report/checkpoint metadata only.

## Read first

`AGENTS.md`, decisions, seed contract, epic/checkpoint, task reports A-D, N/N-review, bootstrap-delivery/bootstrap-review, D-review, draft final report, and the candidate changes. Start with acceptance outcomes; use chat only as optional context.

## Review

- CLI contract and honest distinction between manual completion and verified acceptance.
- State validation, safe paths, serialized updates, replacement behavior, consistency claims, and failure handling.
- Native command errors, Windows/Linux paths, and PowerShell exit propagation.
- Packed installation independent of source files; correct executable/assets and version.
- CI uses the declared gate and does not require privileged private access for PRs.
- Reports distinguish local checks, remote CI, release, and unverified infrastructure.

Run meaningful existing checks in disposable folders if helpful. Do not change product code, gates, infrastructure, or publication state. Avoid style-only findings.

## Output

Write `reports/R.md`: findings ordered by impact, with file/line, concrete failure scenario, expected behavior, and evidence. For each acceptance outcome state proven, unproven, or contradicted. If no findings, say so and identify coverage limits.

Write `checkpoints/R.md` and propose shared status/next actions in the review report. In coordinated mode the coordinator owns task R's shared epic row and `checkpoints/current.md`; do not edit them or the backlog. Do not fix findings or launch agents. An implementation assignment triages each finding as fixed, refuted with evidence, or explicitly deferred. Review completion alone does not close the seed. No Git writes, GitHub comments/approvals, PR watches, publication, or merge are assigned to this reviewer.
