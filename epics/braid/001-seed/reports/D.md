# Task D: packed artifact and bootstrap proof

Status: partly proven. Date: 2026-11-03.
Backlog item: `epics/agento/001-seed/backlog/D-package.md`. Checkout/branch/HEAD: `C:\code\agento`; `feat/package-bootstrap`; this report is committed with the implementation. Parent before this commit: `149545c681021794721fc1ac2cf3950d88a73f88`. The candidate revision is the commit that contains this file. Origin: `https://github.com/exones/agento.git`.

## Outcome

The private `agento@0.1.0` package can be packed and installed outside the source checkout. `scripts/Test-Package.ps1` installs that exact tarball and runs the ledger scenario through the installed executable, including separate processes and paths that contain spaces. `scripts/Verify.ps1` runs that proof after typecheck, build, and the existing 40 tests. Windows and Linux CI upload the tarball and provenance. `.github/workflows/release.yml` is prepared and was not dispatched. Nothing was published, tagged, merged, or started as stage 2.

Local Windows verify passed. That pack was a dirty-worktree probe, so it is not the committed candidate. The clean-candidate rule is below. Hosted CI for this commit was not observed.

## Evidence

| Check | Exact command or method | Result | Revision |
| --- | --- | --- | --- |
| Full local gate | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. Typecheck, build, 40 tests passed, then the packed-install proof passed. | Dirty worktree. Packed `sourceRevision` `149545c681021794721fc1ac2cf3950d88a73f88`. `candidate` false. |
| Tarball digest | SHA-256 of `artifacts/package/agento-0.1.0.tgz` from that verify | `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb` | Same dirty probe. npm integrity `sha512-JAoa/9Z09KsMNhk720cRXE8BnSPUEcHvnel81TyfZLU52vNOrYsNtLYKe0TgxdNgJGZ8OT4Q/4c/Od5+lmvjiw==`. |
| Tool versions | Printed by Verify and Test-Package | Node `v26.13.0`, npm `11.20.0`, PowerShell `7.6.9`, Windows | Local toolchain `.tools/node/node-v26.13.0-win-x64` |
| Installed executable | npm install of the tarball into a temp directory outside `C:\code\agento`, then `pwsh -File` on `node_modules/.bin/agento.ps1` | Version line `agento 0.1.0`. Help includes the manual-completion sentence. `agento task` exits 1. Ledger scenario passed. Installed `dist/cli.js` hash matched the tarball. The path was not inside the checkout and was not a link. | Same dirty probe |
| Lock timeout | Installed executable, pre-created `.agento/lock` | Exit 4, bytes unchanged, elapsed 5468 ms | Same run |
| Name lookup | `npm view agento name version description --json` with the pinned npm | Exit 0. Public package `agento` version `0.1.2`, a different project. | 2026-11-03. Not a reservation of our package. |
| Hosted CI | Not run | Not observed for this commit. | Workflow now uploads `artifacts/package/` and sets `AGENTO_REQUIRE_CLEAN=1`. |
| Publication | Not run | `private` remains true. `release.yml` was not dispatched. No tag and no GitHub Release. | n/a |

The gitignored provenance file from the dirty probe is `artifacts/package/agento-0.1.0.provenance.json`. It is not the committed candidate. An earlier dirty pack of the previous README was `718c22ee69a7ec277588906955a2eecb088ee267b2689ef3af712088d37faf9b` and is superseded.

Clean-candidate rule: the tarball contains `package.json`, `README.md`, and `dist/`. It does not contain the git SHA or this report. After this commit, a clean `scripts/Test-Package.ps1` with `AGENTO_REQUIRE_CLEAN=1` must exit 0, set `worktreeDirty` false, set `sourceRevision` to `git rev-parse HEAD`, and produce the SHA-256 above. That confirmation is recorded in the pull request body so this file does not need another commit. Repeated Windows packs of an unchanged tree matched during the earlier README probe; cross-machine and cross-OS equality is not claimed.

Installed proof covered the contract lifecycle for a story, task, and spike; status JSON from a new process; invalid transitions and duplicate `new` with unchanged bytes; repeated `init` including a partial event tail; rejected ids and a missing root; an existing `.crew` directory left untouched; a Windows junction at `.agento` rejected; schema 2, a stale temp file, a partial event line, the lock timeout, two concurrent adds, and the Windows read-only state destination. Each command was a separate process. Ledger roots contained spaces.

## Decisions

- Pack and install with `--ignore-scripts`. The package has no `prepare`, `prepack`, or `publish` script. `AGENTO_VERIFY_DEPTH` and `AGENTO_PACKAGE_PROOF` stop the two scripts from calling each other.
- The provenance sidecar holds version, source revision, dirty flag, and SHA-256. The digest is not embedded in the tarball. `agento --version` stays `agento 0.1.0`.
- GitHub Actions sets `AGENTO_REQUIRE_CLEAN=1`. A local dirty verify is allowed and is labeled `candidate: false`.
- `actions/upload-artifact` is pinned to v7.0.2, commit `cf430e030ddbb5b0abf93d22962f4752f3646cd9`, checked 2026-11-03. The CI job grants `actions: write` so the upload can succeed, and does not grant `id-token`.
- `release.yml` runs only on `workflow_dispatch` when `confirm` is `publish`. `npm publish` is skipped unless `private` is not true and repository variable `AGENTO_RELEASE` is `enabled`. The publish command, when reached, publishes the verified tarball from that job. Scoped names add `--access public`. This is the public-package route, not a paid private package.
- Trusted-publisher instructions follow the npm docs checked 2026-11-03, including npm CLI 11.5.1+, GitHub-hosted runners, workflow filename `release.yml`, allowed `npm publish` for configurations created after 2026-09-03, and the two-day expiry. No npm identity was inferred from GitHub. No token was requested.
- In-process fault injection stays in the node tests. The installed executable has no test hook.

## Open points

- Hosted Windows and Linux CI for this commit are not observed. Linux was not run locally.
- The clean confirmation is not inside this committed probe. Use the pull request body and a clean provenance file.
- Tarball bytes may differ on the Ubuntu runner. Do not require the Windows SHA-256 to match the Linux artifact until that is measured.
- Unscoped `agento` is already published by another project. The user must choose a different npm name and account. Publication, tagging, and a GitHub Release are not authorized.
- Event-append and pre-commit replace injection were not repeated through the installed executable. A kill during rename or sync remains untested.
- R has not been assigned. Stage 2 has not been started.

## Resume

Coordinator: inspect the PR diff and the clean-pack identity in the PR body, watch hosted CI, then assign R. Do not publish or start stage 2.

## Proposed shared updates

Do not mark D Done. Propose `in-review` once the PR exists.

- Epic row D: `in-review`. Evidence: this report and the PR. Local Windows packed-install proof only. Hosted CI not yet observed.
- Epic checkboxes: leave D, hosted CI, R, final report, and release unchecked. `reports/final.md` is a draft. R stays backlog until a separate assignment.
- `checkpoints/current.md`: record the PR URL and head from the worker return. Next action is hosted CI, then R. User action: choose an npm account and a package name other than the existing unscoped `agento`, using `docs/npm-distribution.md`. That choice does not block review of the local package proof.
