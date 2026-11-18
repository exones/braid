Planning now looks at every unfinished braid before drafting a new one, wherever it lives, links the ones it overlaps and puts duplicates and contradictions to the user in the plan request.

- 0027/A (PR #140): `braid list --open` lists every braid not Done from the working tree, braid and strand branches, and local and `origin/` `plan/` branches, with where it was read, the first paragraph of its Goal and its strands. `braid new` ends with `Open braids: N (braid list --open)`.
- 0027/B (PR #146): an optional `related` front-matter field on braids (braid ids, stored one way); `braid new`/`braid edit --related`; `braid view` shows its own `Related:` ids without reading branches, and `braid view --links` adds `Linked from:`; `braid list --open` shows `related:`; `braid check` warns on an unknown id. D61.
- 0027/C (PR #147): the braid skill's Plan step 3 "Look around": overlap, prerequisite, or duplicate/contradiction with a `scope` warning in the plan request; the plan shows related braids; the brief template has `related`. D62.

Validation: each strand passed `npm run verify` and both `ci` checks; M strands had an independent review, L strands too, and 0027/B a re-check after the user's change. The braid branch is green on its merge commits.

Open: a braid CLI older than 0027/B rejects briefs with `related` (`unknown key: related`); update the installed CLI before links are written. Leftovers 2026-11-18-hr41 (fewer git processes for list --open and check), 2026-11-18-r8xz (docs/cli.md), 2026-11-18-6pyw (template line) wait on the sweep decision.

Decisions: plan approved with the related field; 0027/A did not wait for 0025; merge of the planning PR and auto mode; the related format approved, with back-links in `braid view` only on `--links`; #147 merged on request after the process stop.
For later items: none
Needs the user: process: the braid skill changes (0027/C) reach main with this PR; the user merges it.
