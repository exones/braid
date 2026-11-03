# E: review the install policy and OIDC guard

Kind: review task. Epic: [AGENTO-002](../epic.md). Feature: public npm release.
Status: backlog. Owner: a reviewer other than the AGENTO-002/B and AGENTO-002/C author. Depends on: AGENTO-002/B and AGENTO-002/C.

This item is AGENTO-002/E. The seed review item is AGENTO-001/R.

## Read first

`AGENTS.md`, `docs/decisions.md`, this epic, `checkpoints/current.md`, `reports/A.md`, `reports/B.md`, `reports/C.md`, and the AGENTO-002/B and AGENTO-002/C diffs.

## Value or research question

Someone who did not author AGENTO-002/B or AGENTO-002/C checks that the install policy and the OIDC regression check match this epic, and that neither story publishes.

## Scope and non-goals

Examine the diff and the evidence after both candidates exist. Return findings as scoped fixes to the implementation worker. Do not publish, dispatch, or change `private`. Do not treat a local review note as a GitHub platform approval. Do not start a new feature.

## Acceptance criteria

1. Given the AGENTO-002/B and AGENTO-002/C candidates, when the reviewer finishes, then the report lists each finding or states that there are none, with the reviewed head SHA.
2. Given a finding, when it is returned, then it names the file and the expected correction. The reviewer does not implement the product change in the review role.
3. The review does not claim a GitHub approval and does not claim a package was published.

## Implementation or research tasks

- [ ] Read the AGENTO-002/B and AGENTO-002/C diffs and their reports.
- [ ] Write findings or an explicit none in `reports/E.md`.
- [ ] Hand scoped fixes back. Stop after this item.

## Ownership and verification

Own `checkpoints/E.md` and `reports/E.md`. The coordinator assigns fixes as a separate implementation pass. Meaningful check: the report identifies the reviewed SHAs and separates local review from hosted CI and from merge. Human merge remains the user's decision.

## Delivery record

Empty until assigned.

## Report and resume

Write `epics/agento/002-trusted-publish/checkpoints/E.md` and `epics/agento/002-trusted-publish/reports/E.md`. Stop after this item.
