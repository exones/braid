# Review agent naming update

Status: locally checked documentation update. Date: 2026-11-03.
Requested by: user. Checkout: `C:\code\agento`, branch `feat/package-bootstrap`.
Starting HEAD: `78a904b7be76256d8fae02fb0677f53333ab1666`. Delivery: existing [PR #2](https://github.com/exones/agento/pull/2).

## Changes introduced

The user selected item-bound review-agent names. The rule is maintained only in the [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing), including numbering, evidence paths, and legacy handling.

The first update (`017a356`) repeated the convention across entry points. On the user's follow-up, those copies were replaced with direct links to the authoritative section. README now links there too. The coordinator skill explicitly requires reading it before review assignment, and the templates point to the same source. Updating the convention now requires editing one section.

Existing review records, paths, findings, and aliases remain unchanged. No reviewer was launched or renamed. This report records the change; it does not define another naming policy.

## Validation and limits

Initial naming update: skill validation, 50 local links, and `git diff --check` passed. Consolidation follow-up: skill validation, 77 local links including 14 anchors across 14 changed files, and whitespace checks passed. A search across maintained entry points found naming formulas/examples only in the authoritative section. Product tests are not rerun solely for naming instructions; normal hosted CI applies after push. No runtime/package/workflow changes, new product capability, independent review, merge, publication, or stage 2 start is claimed.

## Next action

Deliver with the existing PR and use the new names for the next requested review. Human merge authority and the seed's In Review status are unchanged.
