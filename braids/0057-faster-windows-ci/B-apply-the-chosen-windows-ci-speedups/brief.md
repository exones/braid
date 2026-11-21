---
id: '0057/B'
title: "Apply the chosen Windows CI speedups"
status: Outline
labels: ["kind:task", "tier:M"]
dependencies: ['0057/A']
order: 20
---

## Goal

Apply the Windows CI speedups the user picks from 0057/A's report to `.github/workflows/ci.yml`, and to the tests and scripts where the report says so. Record the Windows job times before and after on the PR.

## What works at the end

- `verify (windows-latest)` is measurably faster on PRs. It keeps the same check names and the same `verify:full` coverage, unless the user decided otherwise.
- `docs/development.md` describes the runner setup, and `docs/decisions.md` records the choice and its reasons.

## Open questions

- Which candidates, and in what order: 0057/A recommends, the user picks.
- Whether this stays one PR or splits, for example the runner setup in `ci.yml` as one strand and a test-harness change as another.
