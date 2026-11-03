# Static command audit

Status: research complete for plan review; runtime unproven.
Exact source HEAD: `da4792a485f45f54b0f0b912d3df62a2a484bdf0`.
No command in this table was executed by this exercise. “Suitable” means supported by the inspected repository at this revision, with the stated preconditions and side effects; it is not a blanket safety or runtime-success guarantee.

## Existing command decisions

| Existing command or entry | Preconditions and effects found by inspection | Documentation decision | Source |
| --- | --- | --- | --- |
| node --version | Node executable on the selected session PATH; prints version; does not invoke the product | Suitable prerequisite probe; do not assume the machine default meets the engine | [installer](../../../../../../scripts/Install-NodeToolchain.ps1), [package](../../../../../../package.json) |
| pwsh version via $PSVersionTable.PSVersion inside pwsh | Requires pwsh itself to launch; shell variable read | Suitable shell probe; command-not-found needs shell installation guidance, not product setup | [CI](../../../../../../.github/workflows/ci.yml) |
| pwsh -NoProfile -File .\scripts\Install-NodeToolchain.ps1 | pwsh >=7.6; Windows x64/Arm64; downloads Node 26.13.0 and checks official plus pinned SHA-256; writes .tools/cache and .tools/node; reuses a matching install; refuses an incomplete existing destination; may remove a failed downloaded archive | Suitable opt-in Windows setup step with network, writes, preservation/error boundaries; not a diagnostic-only command | [installer](../../../../../../scripts/Install-NodeToolchain.ps1) |
| Prepend captured toolchain directory to session PATH | Changes only the current shell environment; installer progress is stderr, stdout is directory | Suitable walkthrough step; no permanent system PATH claim | [README](../../../../../../README.md), [installer](../../../../../../scripts/Install-NodeToolchain.ps1) |
| npm ci | Run from repository root with compatible Node; .npmrc enforces engine range; installs/replaces dependencies and can contact registry | Suitable explicit dependency install step; not read-only or run in this exercise; no exact npm version/error text assumed | [npmrc](../../../../../../.npmrc), [package](../../../../../../package.json), [CI](../../../../../../.github/workflows/ci.yml) |
| npm run typecheck | Dependencies installed; tsc --noEmit using tsconfig.json | Suitable optional development check, not necessary first-run command | [package](../../../../../../package.json), [config](../../../../../../tsconfig.json) |
| npm run build | Dependencies installed; compiles src to dist with declarations/maps | Suitable first-run preparation; creates build output | [package](../../../../../../package.json), [build config](../../../../../../tsconfig.build.json) |
| npm test / npm run test | Dependencies and built dist expected by CLI tests; node --test --test-reporter spec test; suites use temporary roots | Existing optional test entry; do not label write-free or run before build | [package](../../../../../../package.json), [CLI tests](../../../../../../test/cli.test.ts) |
| npm run verify / pwsh -NoProfile -File .\scripts\Verify.ps1 | pwsh >=7.6; chooses pinned/local compatible Node and can download on Windows fallback; requires dependencies; typechecks, builds, tests, then packed-install proof; stops/propagates first native failure | Suitable separate extended check with full write/network explanation; not a harmless probe | [verifier](../../../../../../scripts/Verify.ps1), [installer](../../../../../../scripts/Install-NodeToolchain.ps1) |
| npm run package:proof | Rebuilds; replaces artifacts/package contents; npm pack --ignore-scripts; extracts; npm init and installs exact tarball outside checkout with --ignore-scripts; runs ledger scenarios and cleans temporary directories | Supported maintainer check, excluded from beginner first-run sequence; invoked transitively by verify | [package proof](../../../../../../scripts/Test-Package.ps1) |
| node .\dist\cli.js --help / --version | After build with compatible Node; package metadata read; help/version return before executeCommand; expected version agento 0.1.0; no ledger creation | Preferred first local product run; does not prove ledger behavior | [main](../../../../../../src/main.ts), [version reader](../../../../../../src/package-version.ts), [help](../../../../../../src/help.ts), [CLI tests](../../../../../../test/cli.test.ts) |
| node .\dist\cli.js --root existing-path status [epic-id] | Existing real initialized ledger; reads state/events but acquires/releases .agento/lock and can wait/fail; root must exist | Existing diagnostic for ledger users only; omit from first-run requirement and never call it filesystem-write-free | [ledger](../../../../../../src/ledger.ts), [filesystem](../../../../../../src/ledger-fs.ts), [contract](../../../../../../docs/seed-contract.md#status) |
| init, new, story add/start/block/complete through the compiled entry | init creates .agento; other accepted mutations update state/events; root must exist; completion is manual; duplicate new/add are not idempotent | Supported existing usage, outside this small first run; link existing CLI docs if needed, never suggest running in the contributor checkout to test setup | [README](../../../../../../README.md), [parser](../../../../../../src/args.ts), [contract](../../../../../../docs/seed-contract.md) |

## Commands and shortcuts excluded

No npm start/dev/doctor/setup script exists in the inspected package. No repair/replay, arbitrary state-setting, task/spike command family, or story resume command exists in the current help/parser. Do not invent them. A source checkout does not install agento on PATH.

Do not recommend npm link, global installation, or npm install agento as a source-setup shortcut: the package is private at this revision and its name is not a confirmed publication identity. No registry lookup was made in this exercise.

No backup, restore, lock removal, ledger deletion, engine/checksum bypass, publication, or external account action belongs in this documentation slice. Troubleshooting must not claim verify is network-free: toolchain fallback alone disproves that description.

## Research limits

Inspected local implementation, configuration, existing contract, and CLI test definitions only. Tests were read, not run. Dependency lifecycle behavior and dependency contents were not audited; npm ci is an installation step, not certified side-effect-free. No external toolchain availability, download digest, runner image, version support lifecycle, registry identity, or hosted CI result was independently verified. Repository version requirements are revision-specific facts, not current upstream recommendations.
