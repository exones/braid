# Task B: fail unreviewed install scripts

Status: partly proven. Date: 2026-11-03.
Backlog item: `epics/braid/002-trusted-publish/backlog/B-install-scripts.md`. Checkout/branch/HEAD: `C:\worktrees\agento\t3-4b07542d`; `feat/002-b-install-scripts`; delivery commit records the pull request head.

## Outcome

`npm ci` now fails closed when a dependency install script is unreviewed, and it rejects git specs and remote URL specs. The mechanism is the one AGENTO-002/A recorded for npm 11.20.0: three settings in the existing `.npmrc`, with no `allowScripts` field on the root package. The real lockfile still installs. A separate fixture, not a root dependency, demonstrates the failures. `.github/workflows` is unchanged because CI already runs `npm ci` and then `npm run verify`.

Acceptance criteria: the root install passes under that policy; an unreviewed `postinstall` fails; a git spec and a remote URL spec fail; `engines.node` is still `>=26.13.0 <27`; nothing was published. Hosted CI, review, and human merge are not done.

## Changes introduced

- `.npmrc` now sets `engine-strict=true`, `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none`. `ignore-scripts` and `dangerously-allow-all-scripts` are not set. `allow-file` and `allow-directory` stay at npm's default `all`, so the fixture's local `file:` package can be considered and then rejected for its script. The root lockfile has no `file:` dependency.
- `scripts/Verify.ps1` runs `test/fixtures/install-policy/Test-InstallPolicy.ps1` after dependencies are present and before typecheck. The fixture copies the repository `.npmrc` into temporary projects outside the checkout, hides the user and global npmrc, and clears environment overrides for these settings. It does not pass `--ignore-scripts` or `--dangerously-allow-all-scripts`.
- The unreviewed project depends on `file:./scripty` and has no `allowScripts` entry. Its `postinstall` writes two marker files. The install exits 1 with `ESTRICTALLOWSCRIPTS` and does not create either marker. A direct run of that same script, before the install, does create both markers, so a no-op script cannot satisfy the check.
- An `allowScripts` value of `false` skips the script and lets the install exit 0, so the failing project stays unreviewed. On npm 11.20.0 this `file:` dependency is a link whose resolved spec is `file:../scripty`. A false entry on that spec matches the link whose script would run. A false entry on the package name does not match a `file:` dependency. A false entry on only `file:./scripty` matches the link target, which strict mode treats as reviewed, but the link itself still runs the script. The denied project therefore sets both `file:./scripty` and `file:../scripty` to false. The unreviewed project sets neither.
- A dependency `git+https://example.invalid/install-policy/unreviewed.git` exits 1 with `EALLOWGIT`. A dependency `https://example.invalid/install-policy/unreviewed.tgz` exits 1 with `EALLOWREMOTE`. `left-pad@1.3.0` exits 0 and installs `1.3.0`.
- Root `package.json` has no `allowScripts` field. `engines.node` is unchanged.

## Evidence

Toolchain: `pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1`. It verified Node.js 26.13.0 win-x64 SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` and used `.tools/node/node-v26.13.0-win-x64`. Commands below use that directory's `node.exe` and `node_modules/npm/bin/npm-cli.js`.

| Check | Exact command or method | Result | Revision |
| --- | --- | --- | --- |
| Base | `git fetch origin main`; `git rev-parse HEAD`; `git rev-parse origin/main`; `git checkout -b feat/002-b-install-scripts 75e293b8da799e8300c299e07c410a48c43c3d3f` | Both revisions were `75e293b8da799e8300c299e07c410a48c43c3d3f`, `Merge pull request #1 from exones/feat/002-a-publish-facts`. Branch created from that commit. | `origin/main` |
| Node and npm | `node --version` and `npm --version` through the pinned `node.exe` and `npm-cli.js` | `v26.13.0` and `11.20.0` | Same tree, before this report commit |
| Real lockfile | Pinned `node.exe` running pinned `npm-cli.js` `ci` from the repository root after `.npmrc` changed | Exit 0. `added 4 packages, and audited 5 packages in 2s` and `found 0 vulnerabilities`. `package-lock.json` stayed unmodified. | Dirty worktree, policy file present |
| Fixture | `pwsh -NoProfile -File .\test\fixtures\install-policy\Test-InstallPolicy.ps1` | Exit 0. Unreviewed: exit 1 `ESTRICTALLOWSCRIPTS`, script did not run. `allowScripts` false: exit 0, script did not run. Git: exit 1 `EALLOWGIT`. Remote: exit 1 `EALLOWREMOTE`. Registry: exit 0 `left-pad@1.3.0`. | Same dirty tree |
| Verify | `pwsh -NoProfile -File .\scripts\Verify.ps1` | Exit 0. Same Node `v26.13.0` and npm `11.20.0`. Fixture passed, typecheck, build, 40 tests in 3 suites, 0 failed. Package proof then ran. | Same dirty tree |
| Package proof inside verify | Printed by `scripts/Test-Package.ps1` | Dirty pre-commit probe, not a committed candidate. Digest `a747ade1dfa2523c6a59cdb084b40aded970ea24a69fd24a212cad309d2fa9ca`. Source revision `75e293b8da799e8300c299e07c410a48c43c3d3f`. `candidate` false. PowerShell `7.6.9`. | Before this report was added |

The fixture asserts the repository `.npmrc` text, that the root manifest has no `allowScripts` field, and that `engines.node` is `>=26.13.0 <27`. It also reads `strict-allow-scripts=true`, `allow-git=none`, `allow-remote=none`, `engine-strict=true`, and `ignore-scripts=false` from the copied project config. Those checks establish the local policy behavior on npm 11.20.0. They do not establish hosted CI, review, or merge. The package-proof digest above is not the digest of the committed tree.

## Decisions

- Enforce the empty allowlist only with the three `.npmrc` settings AGENTO-002/A named. Do not add a root `allowScripts` field and do not install a separate npm 12.
- Keep the failing fixture unreviewed. `false` is a different project used to show why an explicit deny is not the failure the story requires.
- Leave `allow-file` and `allow-directory` unset. `none` would reject the fixture's `file:` package before `ESTRICTALLOWSCRIPTS`. The root lockfile has no file or directory specs; git and remote specs are the classes A found absent and B keeps disallowed.
- Call the fixture from `scripts/Verify.ps1` instead of editing `.github/workflows`. CI `npm ci` picks up `.npmrc` on its own.

## Open points

- Hosted CI, review, and human merge are still open. This item is not Done.
- The local package proof was a dirty tree. The clean pack is the hosted verify run, which sets `BRAID_REQUIRE_CLEAN=1`.
- GitHub Actions uses `actions/setup-node` with Node.js `26` and `check-latest: true`. The hosted npm may be newer than 11.20.0. The three `.npmrc` keys are explicit. Ubuntu is the confirmation that `file:../scripty` still matches the link there.
- README still describes `.npmrc` as only `engine-strict=true`. This story did not edit README. The documented verify order omits the new fixture step.
- Nothing was published. `BRAID_RELEASE` was not set. `npm publish` and `scripts/Publish-Npm.ps1` were not run. `engines.node` was not changed. `.github/workflows` was not changed. `feat/package-bootstrap` was not edited.

## Resume

Coordinator: use the pull request for hosted CI, review, and human merge. Keep this item in review until those gates pass. AGENTO-002/C is next and starts only after this story is handed back. Do not mark B Done from this report.

## Proposed shared updates

Do not mark B Done. Epic row B becomes `in-review`. Evidence: this report and the pull request. Local proof is the pinned npm 11.20.0 `npm ci` and the fixture exits above. Hosted CI is not observed yet.

- Row B status: `in-review`.
- Rows C, D, and E stay as they are. C remains backlog until a later assignment.
- `epics/braid/002-trusted-publish/checkpoints/current.md` and `epic.md` stay coordinator-owned and were not edited.
- `epics/braid/001-seed/checkpoints/current.md` was not edited.

## Delivery

- Branch: `feat/002-b-install-scripts`
- Base: `origin/main` `75e293b8da799e8300c299e07c410a48c43c3d3f`
- Pull request: recorded in the delivery commit
- Head SHA: recorded in the delivery commit
- Done: no
