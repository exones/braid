# N: use braid for the tool and local storage

Kind: task. Epic: AGENTO-001. Feature: F1.
Status: done. The tool is `braid`, the Git repository is `https://github.com/exones/braid`, and the public package is `@exones/braid@0.1.0`.
Owner: one Grok 4.7 Extra High implementation worker. Depends on: C. The earlier correction was human-merged in PR #1 as `afc05074a27da2cb1a3c225bc9d42d10f184e504`; see `reports/bootstrap-delivery.md`.

## Selected name

2026-11-03, user: selected `braid` as the project, package, CLI, and storage name.

The former unscoped name is a different public package, version 0.1.2 when checked on 2026-11-03. `braid` has no live version and no maintainers. Its only published version, `0.0.1` from 2012, was unpublished on 2025-10-16. That version number cannot be published again. npm allows a new version of a fully unpublished name after 24 hours, and that window has passed. `braid@0.1.0` is not on the unpublished list. Nobody has published this project under `braid` yet, so the claim is not proven.

2026-11-03, user: make the package public in the same change as the rename. npm refused unscoped `braid` as too similar to `brace`. The user then chose scoped `@exones/braid@0.1.0`. The command stays `braid`. Do not publish the manifest that still carries the former name.

## Current plan

Use `braid` for the command and the storage directory `.braid/`. The npm package is `@exones/braid`. Apply that in runtime, help, errors, tests, Git ignore, README, the seed contract, and current implementation instructions. Create `https://github.com/exones/braid`, push the existing commit history there, and point this project at that repository. Leave `https://github.com/exones/agento` in place so its existing pull requests stay valid.

Leave recorded history accurate where it quotes the former name, including the occupied npm package and the merged PR #1 correction from `.crew/` to `.agento/`. Do not rewrite those observations into `braid`.

No state-schema, transition, locking, or durability change. No alias and no silent migration. A pre-existing `.crew/` or `.agento/` directory and its contents stay where they are.

## Acceptance criteria

1. Given a fresh temporary root, the full seed ledger scenario persists state, events, temp files, and lock only under `.braid/`. It does not create `.crew/` or `.agento/`.
2. Help, errors, the current storage contract, examples, and ignore rules agree on `braid` and `.braid/`.
3. Existing failure, concurrency, path/link safety, and manual-evidence checks still pass with the renamed paths. Do not weaken their expectations.
4. Pre-existing `.crew/` and `.agento/` directories are left untouched. Document that this correction does not migrate old disposable ledgers.
5. `pwsh -NoProfile -File ./scripts/Verify.ps1` passes. Report local evidence separately from hosted CI, review, and merge.
6. The published package is public `@exones/braid@0.1.0`. The command remains `braid`. The former manifest is not published.

## Implementation tasks

- [x] Rename the active tool to `braid`: command, package name, `.braid/` storage, help, errors, tests, Git ignore, README, seed contract, and current instructions. Leave historical records that quote the former name unchanged.
- [x] Create `https://github.com/exones/braid`, push the existing commit history there (including the rename commit), and point this project at that repository. Leave `https://github.com/exones/agento` in place.
- [x] Publish public `@exones/braid@0.1.0` with `scripts/Publish-Npm.ps1`. The script read `npm_braid_access_token` from Infisical and did not print it. The user chose the scoped name after npm refused unscoped `braid` as too similar to `brace`. Registry `latest` is `0.1.0`. npm also created `0.0.0-stage` while processing the new package.
- [x] Run `pwsh -NoProfile -File ./scripts/Verify.ps1`. Check a fresh root uses only `.braid/`, and that existing `.crew/` and `.agento/` directories are left in place. Local result: 40 tests passed. The clean proof of `cba9b0f` passed before publish.

## Earlier correction

PR #1 already renamed storage from `.crew/` to `.agento/` and merged at `afc05074a27da2cb1a3c225bc9d42d10f184e504`. That is not this rename. Evidence: [bootstrap delivery](../reports/bootstrap-delivery.md) and [PR #1](https://github.com/exones/agento/pull/1).

## Ownership and verification

The worker owns the affected product, test, and docs files, `checkpoints/N.md`, and `reports/N.md`. The coordinator owns the shared epic and current checkpoint. Preserve the existing index and user commits. Inspect remaining former-name references with `rg` and classify historical evidence explicitly. No concurrent implementation worker.

## Report and resume

The rename, the GitHub repository, and the public npm package are recorded above. Automatic release stays off until `BRAID_RELEASE` is set to `enabled` and someone dispatches `release.yml`.
