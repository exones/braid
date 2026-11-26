# 0078/B report

## What changed

- `test/fixtures/oidc-release/Test-OidcReleaseGuard.ps1` (685 lines, a line-and-indent reader with its own fixture plumbing) is gone. `test/pester/Release-Workflow.Tests.ps1` (276 lines, 27 tests) replaces it.
- The suite holds a YAML reader of about 80 lines. It reads block mappings, block sequences, `|` scalars, plain and quoted scalars and comments, and throws on anything else (tabs, flow style, bad indentation, duplicate keys). One `Get-ReleaseFindings` function checks the parsed workflow and returns one `<code>: <detail>` line per broken property.
- `scripts/Verify.ps1` no longer runs the guard in the quick gate. It runs in `verify:full` through `scripts/Test-Pester.ps1`.
- Size: 685 + 7 lines removed, 276 + 5 added, in 5 files (plus this item's folder). The suite is a little over the brief's 150 to 250, because the reader stays in the file and three checks were added.

## Why

The old guard needed a hand-written reader and ran on every quick verify. The suite now reads the workflow as data, so each check is one or two lines.

## Where it runs

It runs only in `verify:full`, which CI runs on every pull request (Windows and Ubuntu) and which the release job runs before it publishes. That covers every change to `release.yml` or `Publish-Npm.ps1` before it merges and again before any publish. A path filter would add machinery and protect nothing more, and the quick gate gets about a second shorter.

## Properties: old guard → suite

Each property the old guard checked is a test, and none was dropped:

| Property | Finding code | Negative test |
| --- | --- | --- |
| No `NPM_TOKEN` | `token` | job env names `NPM_TOKEN` |
| No `NODE_AUTH_TOKEN` | `token` | job env names `NODE_AUTH_TOKEN` |
| Space-indented YAML | throws | tab-indented workflow |
| `workflow_dispatch` with input `confirm` | `trigger` | `workflow_call` instead |
| Exactly one job runs npm publish | `publish-job` | a second job runs `npm publish` |
| Publishing job has `id-token: write` | `id-token` | removed; commented out; moved to the workflow level |
| Job `if: github.event.inputs.confirm == 'publish'` | `confirm` | `'ship'` |
| Node.js 26 (`26`, `"26"`, `26.x.y` pass) | `node-version` | `"24"`; positive `"26.13.0"` and bare `26` |
| `BRAID_RELEASE` from `vars.BRAID_RELEASE` | `publish-condition` | renamed to `AGENTO_RELEASE` |
| Decision: `private` not true AND `BRAID_RELEASE == 'enabled'`, written to `GITHUB_OUTPUT`, step has an id | `publish-condition` | `-or` instead of `-and` |
| Publish step limited to `steps.<id>.outputs.enabled == 'true'` | `publish-condition` | the `if` removed |
| npm 11.5.1 gate exits before publish | `npm-gate` | accepts 11.5.0; gate removed |
| `--ignore-scripts` on the single `artifacts/package` tarball | `tarball` | no tarball argument |
| `npm publish` only in `release.yml` | the second `It` | (checked on the real `.github/workflows/`) |

Checks added:

- **Trigger.** `workflow_dispatch` must be the only trigger, so adding `push` now fails. Before, only the presence of the dispatch input was checked.
- **`id-token`.** It must not be granted to another job, or to the whole workflow through workflow-level permissions, which includes `write-all`. Before, moving it to the workflow level failed only because the job lost it.
- **Runner.** The publishing job must run on `ubuntu-latest`, because trusted publishing needs a GitHub-hosted runner.
- **`BRAID_RELEASE`.** It must come from `vars.BRAID_RELEASE` on the decision step itself, not just anywhere in the job.

Unreadable workflows throw, so the test fails: missing file, empty file, no `jobs`, tabs, and flow style. The live-workflow test passes only on positive matches, so a reader that read nothing can't pass it.

## Dependency

No dependency was added. Neither GitHub runner image ships `powershell-yaml`, and the npm `yaml` package is not a direct dependency of this repository. So the suite keeps the smallest reader that does the job, as the brief allowed.

## Validation

- `scripts/Test-Pester.ps1 -Path test/pester/Release-Workflow.Tests.ps1`: 27 passed, 0 failed (Windows, about 7 s).
- The parsed `release.yml` was checked by hand: 8 steps, the decision step id `publication`, the publish step's `if`, the job's permissions, and `on` holding only `workflow_dispatch`.
- `npm run verify` (the gate), one run on a heavily loaded machine: the docs gate, typecheck and build passed, and every node test passed but one. That one, `test/requests.test.ts` "a waiter outlasts a queue of holders longer than its wait while the lock keeps changing hands", failed with `q is locked` after 3.6 s, then passed when rerun alone (4.2 s). This change touches no TypeScript or test under `test/`. So the gate box stays unticked until CI's `verify:full` is green on both runners.

## Docs

- `docs/development.md`: the quick gate's list no longer has the guard, and the list of Pester suites has the new suite.
- `docs/npm-distribution.md`: one paragraph says what the suite guards and where it runs.
- `docs/decisions.md`: not changed. Its dated 2026-11-05 entry says the quick gate ran the OIDC guard, which was true then. The user decided nothing here.

## Open

- The lock test above is load-sensitive even after 0078/J. A loaded machine still trips it.
- `scripts/Publish-Npm.ps1` is a separate local publish path that gets an npm token from Infisical. The guard never covered it and still doesn't, because the brief's properties are about `release.yml`.

For later items:
- After this item, no hand-written harnesses are left under `test/fixtures/` (`install-policy/` holds only a package). The AGENTS.md sentence "The older hand-written fixtures under `test/fixtures/` stay until they are converted" can go (needs the user's go; 0078/A noted the same).

Needs the user: none
