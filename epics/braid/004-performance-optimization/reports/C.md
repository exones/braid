Assigned startup can confirm one checkout with a read-only PowerShell contract, then go to the named first action. Local verification passed. Hosted CI on the commit that contains this report is the remaining proof. Independent review and the human merge stay separate.

### What changed

`scripts/Test-WorkspaceBinding.ps1` compares a schema 1 JSON contract with one local checkout. It checks the absolute root, attached branch or detached HEAD, full HEAD, origin fetch and push, exact upstream or an explicit absence, and clean or declared dirty status, including renames. Exit 0 is a match, exit 1 is a mismatch or branch/HEAD drift during the read, and exit 2 is invalid input or a failed Git inspection. Credentials in a remote URL are removed from the result and from diagnostics. The helper does not fetch, repair, switch, clean, or write the repository.

`test/fixtures/workspace-binding/Test-WorkspaceBinding.ps1` is wired into `scripts/Verify.ps1`. It uses disposable repositories only. Worker, coordinator, and review entry now name the same `pwsh -File` invocation, a prepared read-now batch, and the idle-create then one-initial-send sequence. Decision D27 records that rule. Changed skills are not adopted for this run.

### Why

Startup was repeating hand-built Git commands. An ordinary A launch expanded a nested `pwsh -Command` batch and then failed an unquoted `@{upstream}` parse. The shared checker keeps the required identity check, and a packet can carry the context batch that used to be searched for again. A null-probe timing is not a baseline and is not a speedup claim.

### Left for you

No user action. After this head's Windows and Ubuntu CI is green, the coordinator inspects the result and assigns `C-git-startup-check-review-001`. Merging into `epic/braid-004-performance-optimization` is the human gate before B. This candidate is not Done. Do not adopt the edited skills for a live worker until that adoption is recorded.

### Technical record

- Item: [C](../backlog/C-git-startup-check.md). Packet: [assignments/C.md](../assignments/C.md). Epic: [BRAID-004](../epic.md). Schema: [workspace binding](../../../../scripts/workspace-binding.md).
- Root: `C:/worktrees/agento/item-braid-004-c-git-startup-check`. Branch: `item/braid-004-c-git-startup-check`. Launch HEAD: `7d1994ba3d305ec1f9094446cff3a32bddf48b2a`. Origin: `https://github.com/exones/braid.git`. Upstream: absent, as declared. The candidate is the commit that contains this report. Pull request base: `epic/braid-004-performance-optimization`.
- Binding exception: untracked `scripts/Test-WorkspaceBinding.ps1` was already present. No tracked path was dirty. The file is the owned helper and was kept.
- Execution skill: external pin `e9a617fa60630327f161a78918f033e4461eb111`, blob `9c744ac8ea0688248cf6ba1f69ee224784af3769`. This run did not use the candidate skill to govern itself.
- Focused fixture, then the same fixture inside verify: 25 cases, 18 matches. Verify measured match invocations at 877-1237 ms. An earlier focused run of those cases was 915-1522 ms. That is helper process time, not a before/after percentage. Details: [observations](../validation/C/observations.json). Scenario order: [supported route](../validation/C/supported-route-scenario.json).
- `npm ci` exited 0 with Node.js `v26.13.0` and npm `11.20.0` from `C:/Users/exon/AppData/Local/braid/toolchains/node-v26.13.0-win-x64` (200 packages). PowerShell `7.6.9`.
- Dirty `npm run verify` exited 0: docs `text=272`, tests 40 passed, packed tarball SHA-256 `d3769f91666ad5a159fc3410ad49cd9965b245648cb83634f926d3d679fcc07d`, `candidate false`, source revision still `7d1994ba3d305ec1f9094446cff3a32bddf48b2a`. Hosted CI is the clean proof.
- Skill validators, separate from CI: `quick_validate.py` printed `Skill is valid!` for `.agents/skills/braid-worker` and `.agents/skills/braid-coordinate`.
- Limits: no fresh-context worker or reviewer trial was started. The null probe remains diagnostic (222 ms Git, 116.014 s to its trivial read, 10 context reads, 9 searches, interrupted). One A reviewer launch is the only observed idle-create then one-initial-send sequence. Watch survival, unassisted repair, and exactly-once delivery are not claimed.
- Proposed shared status: C is locally verified and awaiting current-head CI, review, and human merge. Do not dispatch B. Do not mark C Done. Next coordinator action after the green result: assign `C-git-startup-check-review-001`.
