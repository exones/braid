# I-pr-proof-script-review-002

Parent BRAID-003/I, pass002. Independent Grok4.7 High/500K review in a top-level thread under the user's standing request. Candidate `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`, frozen target `7714587cfa7846c13560e0fd8c7f9a4c99b670f9`, PR https://github.com/exones/braid/pull/21. Host binds `review/braid-003-i-002` at the candidate; confirm actual root/branch/head once. No shell checkout creation or author checkout writes. Read this packet from the committed coordinator object supplied at launch with `git show <context>:<packet-path>`; coordinator context is intentionally not pushed during the freeze.

## Read now and scope

Read candidate AGENTS, review conventions/template, I backlog and repair packet `assignments/I-fix-001.md`, author report/checkpoint, review001 report and triage. Inspect the repair diff from `ad0b1b6dc5bf434f487ba0605e269e79194ef1f9` and the relevant complete live/fixture paths. Do not read the event log or replay broad initial discovery. Original criteria and previous proven checks remain applicable; only re-investigate unchanged behavior when the repair or conflicting evidence warrants it.

Recheck `I-pr-proof-script-review-001/F1`: the live target branch is resolved independently of cached baseRefOid before and after proof; open PR merge-test parents must be actual live tip then exact head; a stale base fails even when artifact bytes are waived. Verify regression cases for base advanced before proof, base moving during proof, unchanged current base, and explicit merged-historical scope/currentReady false. Check that changed PR state or target branch cannot incorrectly preserve current readiness across reread. Assess historical PASS versus open-current PASS, callers' interpretation, error propagation, and preserved run/job/artifact/source guarantees. Findings need severity, exact location and concrete scenario, not optional style changes.

## Proof and checks

Run focused offline fixtures and full live proof from your own candidate checkout. Full artifact mode is REQUIRED; SkipArtifacts is not authorized for I. Independently inspect raw GitHub refs, ordered merge parents, runs/jobs/steps and artifact bytes/provenance rather than using the candidate verifier as its only proof. No full product-suite repetition without an unresolved question, live failed-PR trial, source fixes, subordinate agents, watch or polling. Report commands and coverage limits honestly.

Coordinator independently reread current PR head/base, live target and ordered merge parents, and verified all required jobs/steps SUCCESS for these attempt1 runs:

- Push `41946708312`: Ubuntu `126980609151`, Windows `126980609537`, source candidate head.
- Pull request `41946714204`: Ubuntu `126980628292`, Windows `126980627988`; merge-test `89af138d2126bb1be824033c35cd1feb01552783`, parents frozen `7714587cfa7846c13560e0fd8c7f9a4c99b670f9` then candidate `d5fbbff821dbbd5f987aa2bc71a0a0296efb0777`.
- All four: Install dependencies, Verify, Upload packed tarball success. Workflow `.github/workflows/ci.yml`.

Author full-mode archive claims to verify independently:

| Event/job | Artifact | Archive SHA256 |
| --- | --- | --- |
| push Ubuntu | 13378089372 | 9dbf0b1f33ec54af49ef4897bbba397ee98a25c9f7eafef525bdf15c8752df58 |
| push Windows | 13378323952 | 7bf2435968ae829cb71c580cef3bdaa8cd72a3857dfdd9a85346630db5823652 |
| PR Ubuntu | 13377879620 | b7c587a6188688f875bd8e9c364a6443f232c920212d268d7f2699bde16b5b8b |
| PR Windows | 13378044624 | 5b2bbab614f3614b9eee53d7e272ec2f7193d1c75a45da4acdd6c8d01281b3ab |

Claimed tarball/provenance digest for each: `16bb1e4957258317830c2d78cdaaeed116cf46f479dec99c96fc30aefdb7fa36`. Equality is an observation for this head, not a cross-OS guarantee. Author local npm verify was a dirty probe from merge `5c479e6357fcc85bf2e06aaeab735fb23ef3c69b`, candidate false, 40 tests, docs text256, both skill validators exit0. It is not clean exact-head local proof. The earlier ad0 snapshot is historical evidence only. PR20 is a separate historical acceptance example.

## Outputs and return

Own only uncommitted `epics/braid/003-worker-skill/reports/reviews/I/I-pr-proof-script-review-002.md` and matching `checkpoints/reviews/I/I-pr-proof-script-review-002.md`. Use the review template: exact revision, F1 disposition, new findings or explicit none, relevant acceptance assessment, checks and limits. Candidate-only file references should be code paths so the copied report does not introduce broken links on the epic. Coordinator will copy the two files into its next LOCAL epic commit. Do not edit shared status or commit/push. The frozen target must not move due to coordinator records; if independently moved, report invalidated proof explicitly.

A concise exact-head PR21 summary comment is authorized; do not claim a formal GitHub approval. Send exactly one result via `t3_thread_send` to coordinator `8a3c206a-9192-498f-b90a-19b5bf807c8c`, with actual checkout/branch/head, output paths, F1 disposition, findings, checks/limits and next owner. Stop without self-queueing. Independent review and the user's human merge remain separate; D stays stopped. Last line: PR https://github.com/exones/braid/pull/21, head d5fbbff821dbbd5f987aa2bc71a0a0296efb0777, checks and reviews <state>.
