# AGENTO-002/A checkpoint

Updated: 2026-11-03. Worker-owned. Coordinator owns `checkpoints/current.md` and `epic.md`; those files were not edited.

## Task and checkout

Spike AGENTO-002/A, publish and install-script facts. Checkout: `C:\worktrees\agento\t3-73ebd7cf`. Branch: `feat/002-a-publish-facts`, created from `origin/main` `1766865e192871cca2559ce51e11810b09abade3`. Controller: manual epic files. No subagents.

## Completed

- Confirmed `HEAD` matched `origin/main` after `git fetch origin main`. `release.yml` is on that commit. Package name `@exones/braid`, `private` false, `engines.node` `>=26.13.0 <27`.
- Installed the pinned toolchain with `scripts/Install-NodeToolchain.ps1`: Node.js `v26.13.0`, npm `11.20.0`.
- Ran `npm approve-scripts --allow-scripts-pending` after `npm ci`. Result: no unreviewed install scripts. JSON `allowScripts` is `[]`.
- Real lockfile `npm ci --strict-allow-scripts --allow-git=none --allow-remote=none` exited 0 (4 packages added).
- Fixtures outside the checkout: strict mode exits 1 with `ESTRICTALLOWSCRIPTS` and does not run `postinstall`; the default npm 11.20 install runs it; `allow-git=none` exits 1 with `EALLOWGIT`; `allow-remote=none` exits 1 with `EALLOWREMOTE`; a registry version spec still installs.

## Decision

Empty allowlist. AGENTO-002/B uses strict allow-scripts on current npm 11.20.0. Add `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none` to `.npmrc`. Do not add `package.json` `allowScripts`. Do not install a separate npm 12. B also calls a fixture from `scripts/Verify.ps1` and does not edit `.github/workflows`.

## In flight

None. No publish, no `BRAID_RELEASE`, no `npm publish`.

## Checks

Cited in `reports/A.md`. `scripts/Verify.ps1` was not re-run because this spike does not change product code, the package manifest, or workflows. Pull request CI still runs that gate.

## Changed files

- `epics/braid/002-trusted-publish/reports/A.md`
- `epics/braid/002-trusted-publish/checkpoints/A.md`
- `epics/braid/002-trusted-publish/backlog/A-publish-facts.md`

## Next concrete action

Push `feat/002-a-publish-facts`, open the pull request against `main`, and record its URL and head SHA in the report and the backlog delivery record. Coordinator then watches hosted CI and review. Do not mark Done. Do not start AGENTO-002/B from this worker.

## Blockers

None for this spike. Done still needs the pull request, hosted CI on its head, review, and human merge.
