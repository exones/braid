A compatible Node.js already on PATH is used immediately. Otherwise Windows reuses one verified Node.js 26.13.0 install for every checkout that asks for that pin. Ubuntu CI then rejected the repaired head because a relative `BRAID_TOOLCHAIN_DIR` was reported as a missing PATH runtime. This commit rejects that override before the Unix stop. Hosted CI on the new head is the remaining proof. Independent review and the human merge into the epic stay separate.

### What changed

The direct installer and `Resolve-BraidNodeToolchain` follow one order. A Node.js `>=26.13.0 <27` on PATH is returned when the npm that shipped with that same install runs. Otherwise the selected pin is reused from `%LOCALAPPDATA%/braid/toolchains`, or from an absolute `BRAID_TOOLCHAIN_DIR`. On Windows, a missing pin is downloaded, checked against the pinned SHA-256 and the official `SHASUMS256.txt`, validated, and published as `node-v<version>-<platform>`.

Publication holds a per-key file lock for at most 120 seconds, writes `.braid-toolchain.json` only inside the staging directory, and renames that directory into place. A later run reuses a complete directory without contacting the network. A corrupt completed directory stays in place and the error names it. Checkout-local `.tools` is left untouched.

`scripts/Verify.ps1` runs `test/fixtures/node-toolchain/Test-NodeToolchain.ps1` before typecheck. README setup and decision D26 describe the same behavior. The engine range, install policy, and the rest of the verification gate are unchanged.

The Unix fixture Node no longer calls `dirname` or `tr`. It resolves its own directory and reads `fixture-version.txt` with shell builtins, so the PATH-only fixture still runs when `/usr/bin` is absent.

When PATH has no compatible Node.js and `BRAID_TOOLCHAIN_DIR` is set, the resolver now checks that the override is absolute before it stops on a host that cannot download. An absolute override on that host still fails with the existing PATH-only message and does not create a store. A compatible PATH Node is still returned without consulting the override.

### Why

Each new worktree was downloading Node.js into its own `.tools` directory even when a compatible runtime was already on the machine. Agents and developers can now share one verified pin, and a machine that already has a matching Node.js does not download anything. Isolated `npm ci` and the packed-install proof still run per checkout.

The first published head, `cdcbe249a2f5ed9efc50d565ae3e9b417a24a01a`, failed both Ubuntu verify jobs in that fixture. Windows verify passed. A cleared PATH made `dirname` missing, the stub read the working directory instead of its own, and the resolver reported that no compatible Node.js was on PATH.

The second published head, `8112c467428a54576b92fee3a2462cb144950e3e`, got past that stub. Ubuntu verify then failed the direct relative-override case. On Unix the script stopped at the no-download branch and never reached `Get-BraidToolchainRoot`, so stderr did not contain the absolute-path error. The dot-sourced Windows-shaped call already did. Direct and dot-sourced invocation now agree on that rejection.

### Left for you

No user action. After the new head's CI is green, the coordinator inspects the result and assigns the independent review. Merging the pull request into `epic/braid-004-performance-optimization` is the human gate before B. This candidate is not Done.

### Technical record

- Item: [A](../backlog/A-shared-node-toolchain.md). Packet: [assignments/A.md](../assignments/A.md). Epic: [BRAID-004](../epic.md).
- Root: `C:/worktrees/agento/item-braid-004-a-shared-node-toolchain`. Branch: `item/braid-004-a-shared-node-toolchain`. Context HEAD: `8610548f9792072e2e70bb56f0d12e1783a9015e`. Failed published heads: `cdcbe249a2f5ed9efc50d565ae3e9b417a24a01a` and `8112c467428a54576b92fee3a2462cb144950e3e`. The candidate is the commit that contains this report.
- Pull request: https://github.com/exones/braid/pull/22 into `epic/braid-004-performance-optimization`.
- Launch thread: `mcp:launch:a8ea3b557d4313ab62e717fee1c4b0b2d6a99bc22281ef29c7499e89c0a9b1f9`, run ordinal 1. Coordinator thread: `ae791527-bf56-41da-a7d9-30821a74cfc5`.
- Skill: `.agents/skills/braid-worker/SKILL.md` at `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`. No controller or schema run.
- Failed hosted runs for `cdcbe249a2f5ed9efc50d565ae3e9b417a24a01a`: push https://github.com/exones/braid/actions/runs/41946952200 and pull_request https://github.com/exones/braid/actions/runs/41946958466. `verify (windows-latest)` passed. `verify (ubuntu-latest)` failed in Verify, jobs `126981425434` and `126981446361`, at `Install-NodeToolchain.ps1:425` after `dirname: not found`.
- Failed hosted runs for `8112c467428a54576b92fee3a2462cb144950e3e`: push https://github.com/exones/braid/actions/runs/41948944012 and pull_request https://github.com/exones/braid/actions/runs/41948951090. Pull_request Windows job `126988028816` passed. Ubuntu jobs `126988006751` and `126988029307` failed in Verify on `direct relative override did not match /absolute/`. The push Windows job was still in progress when those logs were read. Those runs are not proof for this commit.
- Local fixture after the override repair: `pwsh -NoProfile -File test/fixtures/node-toolchain/Test-NodeToolchain.ps1` exited 0 on Windows x64. It covered PATH precedence, unusable npm, fallback, two roots, warm reuse with downloads disabled, two fixture pins, checksum failures, missing npm, wrong extracted version, preserved corruption, handled failure, relative override, the same relative override with `-ForWindows:$false`, default root, missing `LOCALAPPDATA`, non-Windows failure, direct warm fallback, concurrency, interruption, and a 2-second lock timeout against the 120-second default. Fixture hashes are not in the production table. Production `win-x64` and `win-arm64` hashes are unchanged. The Windows fixture uses the C# stub, so it does not execute the shell stub. Direct Unix invocation of that stub remains hosted Ubuntu proof.
- Shell stub probe, separate from the fixture: Docker Desktop BusyBox `/bin/sh` (not Ubuntu dash) ran the builtin-only script with PATH set to an empty directory. Full-path `--version` printed `v26.13.0`, bundled npm `--version` printed `10.9.0`, `fail-npm` exited non-zero, and a CR-terminated version file still printed `v26.13.0`. A bare `node` on a PATH containing only that directory also printed `v26.13.0`.
- Real installation, separate from the fixture: [observation](../validation/A/observation.md). Cold install exited 0 in 12.3 seconds and verified SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. Node.js `v26.13.0`, npm `11.20.0`. Warm reuse with proxies pointed at `127.0.0.1:9` exited 0 in 1.2 seconds and did not download. `win-arm64` was not executed. The checkout `.tools` directory stayed absent.
- `npm ci` exited 0 using the existing Node.js `v26.13.0` at `C:/worktrees/agento/epic-braid-003-worker-skill/.tools/node/node-v26.13.0-win-x64` on PATH (200 packages, npm `11.20.0`). That checkout was not modified.
- Earlier dirty `npm run verify` on `8610548f9792072e2e70bb56f0d12e1783a9015e` exited 0: `candidate false`, docs `text=254`, tests 40 passed, packed tarball SHA-256 `085f960417343e5bbb3ed95185e5c9e78f18a705f251ee69a33fc296036517ca`. A second dirty verify including the first report also exited 0. Dirty `npm run verify` of the stub-repair record set also exited 0 and remained a non-candidate. Dirty `npm run verify` of this override-repair record set exited 0: docs `text=258`, tests 40 passed, packed tarball SHA-256 `085f960417343e5bbb3ed95185e5c9e78f18a705f251ee69a33fc296036517ca`, `candidate false`, source revision still `8112c467428a54576b92fee3a2462cb144950e3e` because the worktree was dirty. Hosted CI is the clean proof.
- Frozen set: `.github/workflows/ci.yml`, events `push` and `pull_request`, jobs `verify (windows-latest)` and `verify (ubuntu-latest)`, successful Install dependencies, Verify, and Upload packed tarball, plus each `braid-package-<os>` tarball digest and provenance. Not verified for this commit.
- Limits: no Unix downloader, no shared `node_modules`, no engine change, no migration or deletion of `.tools`, arm64 install not observed. The shell probe was BusyBox, not the Ubuntu runner.
- Proposed epic status: keep A in progress and point its evidence at this report and pull request 22. Do not mark Done and do not dispatch B.
- Next: push this commit to the open pull request. After the new head is green, comment the run, job, artifact, and source evidence and send one result to the coordinator.
