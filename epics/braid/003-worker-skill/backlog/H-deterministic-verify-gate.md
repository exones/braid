# H: make `npm run verify` the single deterministic gate, including docs

Kind: task. Epic: [BRAID-003](../epic.md).
Status: backlog. User agreed 2026-11-04. After F merges; order relative to D decided by the coordinator.
Depends on: F merged into the epic.

## Value

Agents currently re-derive docs checks on every item: ad hoc link/anchor scripts, manual line-ending checks, remembered `git diff --check`. `npm run verify` (`scripts/Verify.ps1`) already runs locally and in CI, but covers code only. One command should cover docs too, so local and CI gates cannot drift and packets can say "`npm run verify` passes" instead of listing checks.

## Scope

- Add `.gitattributes` (`* text=auto eol=lf`, `binary` for archives/images) and `.editorconfig` (LF, final newline, UTF-8). Renormalize once; expect no content change because tracked files are LF today.
- Add an offline relative-link and heading-anchor check for tracked Markdown, run from `scripts/Verify.ps1`. Prefer `remark-cli` + `remark-validate-links` as pinned devDependencies (installed by `npm ci`); exclude `inspiration/` and external URLs. Fix or explicitly exclude links it finds broken, with a reason.
- Add a whitespace check to `Verify.ps1` that is meaningful in CI (for example `git diff --check` against the merge base or the empty tree for tracked text), without depending on uncommitted state.
- Point AGENTS.md, both skills and the assignment-packet asset to `npm run verify` as the pre-PR gate; keep any external skill validators listed separately if they cannot run in CI.

No product/CLI change, no weakening of existing Verify steps.

## Acceptance criteria

1. `npm run verify` fails on a broken relative link, a broken anchor, a CRLF-introduced line, and trailing whitespace in tracked text; demonstrated with temporary fixtures or a test, then removed.
2. `npm run verify` passes on the resulting head locally and in the existing CI jobs (Ubuntu and Windows, push and pull_request).
3. Docs name `npm run verify` as the single deterministic pre-PR gate.
4. Separate review and human merge into the epic.
