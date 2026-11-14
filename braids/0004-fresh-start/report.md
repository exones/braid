Removed the old ledger CLI (src/, its tests, seed-contract and cli-name docs, roadmap stages and bootstrap rules). New skeleton: src/cli.ts router with --version, help/--help and an unknown-command error; test/cli.test.ts runs the built CLI. README cut to what exists; MIT LICENSE and "license": "MIT"; LICENSE is packed. Test-Package.ps1 now proves version and help through the installed tarball. Validation: npm run verify:full passes locally; CI checked on the PR. Open: none.

For later items: none
Needs the user: none
