## 2026-11-13 18:28Z

Decisions: front matter values are always text (`0001` stays `0001`, no YAML number coercion); unknown keys are errors so typos fail loudly; braid ids are `0002`, strand ids `0002/A`, and `id` must match the folder; `delivery` is braid-only (default epic) and an error on a strand; strands without `order` run last, by letter. Root = nearest ancestor holding `braids/` or `.git`. Exit 1 for usage errors, 2 for malformed braids files. No new dependencies: a small YAML-subset parser instead of a YAML library.

Review of PR #60 (not blocking): inline list items now take JSON escapes in double quotes (chose the parser fix over a doc limit), documented in docs/braids-format.md; added tests for a BOM brief, quoted list items with escaped/doubled quotes and commas, and strands without order running last by letter.
