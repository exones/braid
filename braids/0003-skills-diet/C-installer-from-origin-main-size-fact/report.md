# Report: 0003/C

## What changed

- `Install-Skills.ps1` without `-Ref` runs `git fetch origin main` and installs `origin/main` (the stamp's `ref` is `origin/main`). A failed fetch stops the install. `-Ref` behaves as before.
- `braid facts` leaves `braids/**` out of the lines changed for the size fact.
- README and `docs/braids-format.md` describe both.

## Why

A stale local `main` once installed old skills (2026-11-13); the item's own brief, report and logs inflated the size fact (user, 2026-11-15).

## Validation

`npm run verify` passes (174 node tests); Pester 17 pass. New: Pester test with origin ahead of a stale local `main`, Pester test for a failed fetch, facts test with a 200-line `braids/` change. The Pester fixture repo now has a bare `origin`, and its helper pushes after each commit.

For later items: none
Needs the user: `none`
