# npm distribution

Status: selected registry, 2026-11-03. This supersedes the Forgejo/Tailscale registry proposal. GitHub hosts source, PRs, and Actions; npm hosts release packages. No publishing has been performed or authorized by selecting this registry.

## Delivery sequence

1. B implements the TypeScript foundation and prepares deterministic Windows/Linux Actions checks. No npm account is needed for local package installation and build verification with public dependencies.
2. C implements the manual epic/story ledger.
3. D builds the exact tarball, installs it outside the source checkout, and verifies its behavior. Prepare npm publication from GitHub Actions after those checks, with a manual/reviewed release trigger.
4. Complete the account/package bootstrap and trusted-publisher setup, then perform an explicitly authorized release. Keep an exact versioned tarball as the bootstrap artifact/fallback.

The package is public `@exones/braid` with `"private": false`. The executable remains `braid`. Registry `latest` is `0.1.0`. This source is `0.1.1` and stays unpublished until a separate authorization.

## Prepared release workflow

Checked against npm's docs on 2026-11-03. Public `@exones/braid@0.1.0` is on the registry, along with `0.0.0-stage`. This source is the unpublished `0.1.1` candidate. This change does not publish, tag, or create a GitHub Release.

`.github/workflows/release.yml` runs only on `workflow_dispatch`. The required input `confirm` must be the word `publish`. The job checks out the selected ref, runs the same verify gate as pull requests, and uploads `artifacts/package/` as the workflow artifact `braid-release-tarball`. For this candidate that directory holds `exones-braid-0.1.1.tgz` and `exones-braid-0.1.1.provenance.json`. The workflow does not create a git tag or a GitHub Release.

`npm publish` runs only when both of these are true:

- `package.json` `private` is not `true`
- the GitHub Actions repository variable `BRAID_RELEASE` is exactly `enabled`

Until `BRAID_RELEASE` is exactly `enabled`, the publish step is skipped. `npm publish` is not executed by preparing this candidate. `private` is `false`. Do not dispatch the workflow to test it; the pull-request CI workflow already packs and uploads the tarball.

The publish step publishes the tarball produced by that same job (`npm publish --ignore-scripts <tarball>`). A scoped name also gets `--access public`, which matches the selected public-package route. A paid private npm package is not this workflow. The job uses GitHub-hosted `ubuntu-latest`, `contents: read`, `actions: write`, and `id-token: write`. It does not set `NODE_AUTH_TOKEN` or `registry-url`.

Trusted publisher settings must name the workflow filename `release.yml` only, including the extension. Keep `npm publish` in this file. npm's trusted publishing notes say that a `workflow_call` or a nested workflow can make npm validate the caller filename instead of the file that contains `npm publish`.

The provenance file next to the tarball is this repository's pack record: version, source revision, dirty flag, and SHA-256. It is not an npm provenance attestation. npm generates registry provenance automatically when a public package is published with trusted publishing from this public repository. Do not pass `--provenance` for that path.

## User actions before any publication

These are nonsecret setup actions. They do not block local tarball proof. Do not paste tokens into chat, GitHub secrets, or the repository. Do not infer an npm username from the GitHub account `exones`.

1. Sign in to the npm account or organization that should own the package and enable two-factor authentication. npm requires 2FA, or a granular access token with bypass 2FA, to create and publish packages. This project does not use a bypass token. npm documents that direct publishing with bypass-2FA granular tokens is being removed in January 2027.

2. The package name is `@exones/braid`, and the executable is `braid`. On 2026-11-03, `npm view agento` returned a different public package, version `0.1.2`. Do not publish this project under that name. Unscoped `braid` was then refused with 403 because npm treats it as too similar to `brace`. Publish public `@exones/braid@0.1.0` with `--access public`. An npm private package needs a paid plan; do not choose it unless that cost is accepted.

3. In a later change that explicitly authorizes publication, set the chosen `name`, set `"private": false`, and keep `repository.url` as `git+https://github.com/exones/braid.git`. npm's trusted publishing troubleshooting says `repository.url` must exactly match the GitHub repository. For a scoped public package, the release workflow adds `--access public` because scoped packages would otherwise be registry-private.

   Verification reads the selected name, version, and explicit private boolean from `package.json`. It validates the packed/installed manifests against those values, derives the tarball and scoped installation paths from npm's pack metadata, and records them in the provenance sidecar. The executable stays `braid` regardless of registry scope. Rerun the full gate and obtain a new clean artifact/digest after changing identity or privacy mode. The user authorized public `@exones/braid@0.1.0` in task N. Do not publish a manifest that still uses the former name.

4. Create the package once before saving a trusted publisher. The local command is `pwsh -NoProfile -File ./scripts/Publish-Npm.ps1`. It reads `npm_braid_access_token` from Infisical and does not print or store the token. Link the repository with `infisical init`, or set `BRAID_INFISICAL_PROJECT_ID`. The default environment is `prod`; override it with `BRAID_INFISICAL_ENV`. The script searches that environment for `npm_braid_access_token`. Run a clean package proof first so `artifacts/package/exones-braid-0.1.0.tgz` exists. `release.yml` does not use Infisical. After this first publish, GitHub Actions uses trusted publishing. `npm stage publish` on a package that does not exist yet publishes a public placeholder; do not use it as a silent first step.

5. After the package exists, add one GitHub Actions trusted publisher:
   - Organization or user: `exones` (the GitHub owner of `github.com/exones/braid`, not an npm identity)
   - Repository: `braid`
   - Workflow filename: `release.yml`
   - Environment: leave blank. This workflow does not set a GitHub environment. Add one only by creating the environment, setting that exact name on the publisher, and adding the same `environment:` to the release job in a reviewed change.
   - Allowed actions: configurations created after 2026-09-03 allow `npm stage publish` by default. Also allow direct `npm publish`. This workflow runs `npm publish` and does not run `npm stage publish`.
   - Complete the first successful publish that uses the new configuration within 2 days, or npm expires it. npm does not validate the fields when they are saved.
   - Trusted publishing requires npm CLI 11.5.1 or later and Node.js 22.14.0 or later. This repository's gate uses Node.js 26. GitHub-hosted runners are required; self-hosted runners are not supported. Provenance is automatic for a public package from a public repository and is not generated for a private repository.

6. Create the repository variable `BRAID_RELEASE` with the value `enabled` only when a dispatch should be allowed to publish. It is not a secret. Do not create an npm automation token or `NODE_AUTH_TOKEN` for this workflow.

7. Dispatch `release.yml` and enter `publish` in `confirm`. After a trusted publish works, set the package's publishing access to "Require two-factor authentication and disallow tokens."

8. Keep the versioned tarball and provenance file as the installable fallback. Attaching them to a GitHub Release is a separate authorization. Install that tarball outside the checkout using the README procedure. That install does not start the next stage.

## User involvement before publishing

The coordinator or worker must identify the exact prerequisite when needed and continue independent work:

- npm account/organization owner and the intended package name/scope. Use the existing free/public-package route unless a different access model is chosen; flag any paid requirement before adopting it.
- Account verification, required two-factor setup, and any initial package publication/ownership action that needs the user's session.
- Trust configuration binding the package to the actual GitHub repository and publishing workflow, plus any release-environment approval the user chooses.
- Final authority to publish the verified artifact under the selected identity.

Request credentials through the host's secret mechanism if needed; never ask for raw token values in chat. Prefer trusted publishing where available. Do not silently generate a public release to test configuration.

These prerequisites do not block local packaging. The exact nonsecret actions are in the section above. Put an actionable blocker in the checkpoint and the coordinator's `You` report when it becomes relevant. Avoid vague "needs credentials" messages: specify the nonsecret setup action and which release step it blocks.

## References

Checked 2026-11-03:

- [Public scoped packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), including staged publishing and the public placeholder created when a new package is staged.
- [Trusted publishing](https://docs.npmjs.com/trusted-publishers/): npm CLI 11.5.1+, Node.js 22.14.0+, GitHub-hosted runners, `id-token: write`, workflow filename only, `repository.url` match, allowed actions after 2026-09-03, and the two-day configuration expiry.
- [Requiring 2FA](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/).
- [Access tokens](https://docs.npmjs.com/about-access-tokens/), including stage-only tokens and the January 2027 direct-publish deprecation.
- [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
- [Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/).
- [Private package requirements](https://docs.npmjs.com/about-private-packages/), if public access is later reconsidered.
