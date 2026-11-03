# Task A: publish and install-script facts

Status: partly proven. Date: 2026-11-03.
Backlog item: `epics/braid/002-trusted-publish/backlog/A-publish-facts.md`. Checkout/branch/HEAD: `C:\worktrees\agento\t3-73ebd7cf`; `feat/002-a-publish-facts`; parent `origin/main` `1766865e192871cca2559ce51e11810b09abade3`. The pull request URL and head SHA are in the delivery record below once this spike's push exists.

## Outcome

On the merged AGENTO-001/D tree, the dependency install-script allowlist is empty. There is no git dependency and no remote URL dependency. AGENTO-002/B enforces that empty allowlist with strict allow-scripts on the current npm, the npm 11.20.0 bundled with Node.js 26.13.0.

npm 11.20.0 can express that strict policy. It does so through explicit settings. Its own defaults still run unreviewed install scripts and still allow git and remote URL specs. The settings AGENTO-002/B adds to the existing `.npmrc` are:

```
strict-allow-scripts=true
allow-git=none
allow-remote=none
```

Keep the current `engine-strict=true` line. Leave `package.json` without an `allowScripts` field. Do not name any package.

Those three settings make `npm ci` fail before an unreviewed dependency lifecycle script runs, and they reject git specs and remote URL specs. The real lockfile installs successfully with the same flags. A separate npm 12 install is not the enforcement mechanism.

Acceptance criteria: the inventory command and `npm --version` are cited below; the allowlist is empty; AGENTO-002/B uses strict allow-scripts on current npm. Product code, `engines.node`, and `.github/workflows` are unchanged.

## Changes introduced

- Decision for AGENTO-002/B: enforce an empty `allowScripts` policy on npm 11.20.0 with `strict-allow-scripts=true`, `allow-git=none`, and `allow-remote=none` in `.npmrc`.
- Files AGENTO-002/B owns: `.npmrc`, `scripts/Verify.ps1`, and a new fixture runner it calls from that verify script. Recommended fixture directory: `test/fixtures/install-policy/`. The root `package.json` stays without `allowScripts`. Workflows stay unchanged because CI already runs `npm ci` and then `npm run verify`.
- The fixture is a separate project, not a root dependency. Its unreviewed `postinstall` must make the install exit 1 with `ESTRICTALLOWSCRIPTS` and must not execute. A git spec must exit 1 with `EALLOWGIT`. A remote URL spec must exit 1 with `EALLOWREMOTE`. A normal registry version spec must exit 0. An `allowScripts` entry of `false` skips the script and lets the install succeed, so the failing fixture stays unreviewed.

## Evidence

Toolchain: `pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1`. It verified Node.js 26.13.0 win-x64 SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` and used `.tools/node/node-v26.13.0-win-x64`. The PATH `node` in this session was Volta `v24.19.0`, so every npm command below is the pinned `node.exe` running that directory's `node_modules/npm/bin/npm-cli.js`.

| Check | Exact command or method | Result | Revision |
| --- | --- | --- | --- |
| Base | `git rev-parse HEAD` after `git fetch origin main` and `git checkout -b feat/002-a-publish-facts origin/main` | `1766865e192871cca2559ce51e11810b09abade3`, commit `docs(release): record the public @exones/braid package`. `release.yml` is on this commit. | `origin/main` |
| Node | `node --version` on the pinned `node.exe` | `v26.13.0`, exit 0 | Same tree, before this report commit |
| npm | `npm --version` through the pinned `npm-cli.js` | `11.20.0`, exit 0 | Same |
| Script inventory | `npm approve-scripts --allow-scripts-pending` after `npm ci` | `No packages with unreviewed install scripts.` Exit 0 | Same |
| Script inventory JSON | `npm approve-scripts --allow-scripts-pending --json` | `{"allowScripts":[]}`, exit 0 | Same |
| Current defaults | `npm config get` for `strict-allow-scripts`, `allow-git`, `allow-remote`, `allow-scripts` | `false`, `all`, `all`, and an empty value. All exit 0 | Same |
| Real tree under the chosen flags | `npm ci --strict-allow-scripts --allow-git=none --allow-remote=none` | Exit 0. `added 4 packages, and audited 5 packages in 2s` and `found 0 vulnerabilities` | Same |
| Installed identities | `npm ls --all --json` | `@types/node@26.6.6`, `undici-types@8.9.0`, `typescript@7.0.2`, and `@typescript/typescript-win32-x64@7.0.2`, each `resolved` from `https://registry.npmjs.org/`. Exit 0 | Same |
| Unreviewed script fails closed | Temporary `file:./scripty` package whose `postinstall` writes `ran.txt`, then `npm install --strict-allow-scripts --allow-git=none --allow-remote=none` | Exit 1, `ESTRICTALLOWSCRIPTS`, `scripty@1.0.0 (postinstall: ...)`. `ran.txt` was absent | Temp project outside the checkout |
| Default npm 11.20 runs the script | Same fixture, `npm install` with no strict flag | Exit 0. Warning: `1 package has install scripts not yet covered by allowScripts`. `ran.txt` was written | Temp project |
| Git spec rejected | Temporary `git+file:///` dependency, `npm install --allow-git=none --allow-remote=none` | Exit 1, `EALLOWGIT`, `Fetching packages of type "git" have been disabled` | Temp project |
| Remote URL rejected | Dependency `https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz`, same allow flags | Exit 1, `EALLOWREMOTE`, `Fetching packages of type "remote" have been disabled` | Temp project |
| Registry spec still installs | Dependency `left-pad@1.3.0` with `--strict-allow-scripts --allow-git=none --allow-remote=none` | Exit 0, `added 1 package` | Temp project |
| Ubuntu optional manifest | `npm view @typescript/typescript-linux-x64@7.0.2 name version hasInstallScript` | Printed `name` and `version` `7.0.2` only. Exit 0. `hasInstallScript` was absent | Registry view, 2026-11-03 |
| npm 12 availability | `npm view npm@12 version engines --json` | `12.0.0` through `12.2.1` advertise `node: ^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`. npm 12 was not installed | Registry view, 2026-11-03 |

`npm approve-scripts --allow-scripts-pending` reads the installed tree (`loadActual()`). The cited run is the one after `npm ci`. An earlier run, while `node_modules` was absent, printed the same sentence and is not the inventory.

The command output is the script inventory:

```text
npm --version
11.20.0

npm approve-scripts --allow-scripts-pending
No packages with unreviewed install scripts.

npm approve-scripts --allow-scripts-pending --json
{
  "allowScripts": []
}
```

Parsed `package-lock.json` (lockfileVersion 3) is the git and remote cross-check, not the script inventory. It has 23 package entries. All 23 `resolved` values are `https://registry.npmjs.org/` tarballs. It has 0 git resolutions, 0 non-registry remote resolutions, 0 `hasInstallScript` flags, and 0 git, URL, or `file:` dependency specs. The successful `npm ci` with `--allow-git=none --allow-remote=none` is the behavioral check for this tree. The left-pad registry install shows a registry tarball is not a remote URL dependency.

The four installed packages have no `preinstall`, `install`, `postinstall`, or `prepare` script and no `binding.gyp`. The root package scripts (`typecheck`, `build`, `test`, `verify`, `package:proof`) are maintainer scripts. `approve-scripts` does not list the project root.

This local proof shows the current tree and the chosen flags. It does not show hosted CI, review, or merge. `scripts/Verify.ps1` was not re-run; this spike changes no product, package, or workflow file. The pull request CI job still runs that gate.

## Decisions

- The allowlist is empty. Do not add `allowScripts` to `package.json`, and do not approve or deny any package. npm's pending JSON is an empty array. npm drops an empty `allowScripts` object rather than keeping `{}`.
- AGENTO-002/B uses strict allow-scripts on current npm 11.20.0. The policy lives in `.npmrc` so the existing `npm ci` in `.github/workflows/ci.yml` and `.github/workflows/release.yml` picks it up.
- `strict-allow-scripts=true` is required for the failure AGENTO-002/B demands. On this npm the default is `false`, and the advisory probe showed the unreviewed `postinstall` still runs and the install exits 0. With the flag, npm threw `ESTRICTALLOWSCRIPTS` before `ran.txt` existed.
- `allow-git=none` and `allow-remote=none` are required on this npm because both default to `all`. Set to `none`, they already fail the install (`EALLOWGIT`, `EALLOWREMOTE`). npm 12 changes those two defaults to `none`; this npm can express the same policy by setting them.
- A separate npm 12 install is not used. npm 12.2.1 can run on Node.js 26, and this spike did not install it. npm 12 still defaults `strict-allow-scripts` to false in its config docs: unreviewed scripts are skipped and the install can exit 0. AGENTO-002/B needs the install to fail, which is the strict flag this npm 11.20.0 already implements. Adding npm 12 would be a second toolchain on the same Node.js 26 engine.
- The 8 July 2026 changelog remains the source for the npm 12 defaults (allowScripts off, `--allow-git` and `--allow-remote` default `none`, npm 11.16+ warns). The command results above are the behavior of the pinned 11.20.0.

## Open points

- Hosted CI, review, and human merge are still open. This item is not Done.
- `approve-scripts` on this Windows x64 machine did not install the other optional `@typescript/typescript-*` packages. Ubuntu CI installs `@typescript/typescript-linux-x64@7.0.2` instead of the win32 package. That registry manifest did not advertise `hasInstallScript`. The strict `npm ci` on the runner is the confirmation for that platform.
- GitHub Actions uses `actions/setup-node` with Node.js `26` and `check-latest: true`. The hosted npm may be newer than 11.20.0. The three `.npmrc` keys are explicit so that difference does not depend on a default.
- Nothing was published. `BRAID_RELEASE` was not set. `npm publish` and `scripts/Publish-Npm.ps1` were not run. `ignore-scripts` and `dangerously-allow-all-scripts` were not set.

## Resume

Coordinator: use the pull request for hosted CI, review, and human merge. Keep row A at `in-review` until those gates pass. AGENTO-002/B is the next implementation item and starts from this decision. Do not mark A Done from this report.

## Proposed shared updates

Do not mark A Done. Epic row A becomes `in-review`. Evidence: this report and the pull request. Local proof is the pinned npm 11.20.0 inventory and the fixture exits above. Hosted CI is not observed yet.

- Row A status: `in-review`.
- Rows B, C, D, and E stay as they are. B remains backlog until a later assignment.
- `epics/braid/002-trusted-publish/checkpoints/current.md` and `epic.md` stay coordinator-owned and were not edited.
- The planning sentence that AGENTO-002/A is waiting on AGENTO-001/D is stale on this `main`: `release.yml` is present at `1766865e192871cca2559ce51e11810b09abade3`, `package.json` `name` is `@exones/braid`, and `private` is `false`. `engines.node` remains `>=26.13.0 <27`.

## Delivery

- Branch: `feat/002-a-publish-facts`
- Base: `origin/main` `1766865e192871cca2559ce51e11810b09abade3`
- Pull request: recorded after `gh pr create`
- Head SHA: the commit that contains this report
- Done: no
