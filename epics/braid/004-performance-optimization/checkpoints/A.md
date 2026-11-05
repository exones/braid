# A checkpoint

- Task: BRAID-004/A shared Node.js toolchain. The Unix fixture stub is repaired in this commit after hosted Ubuntu verify failed. Current-head hosted proof is still outstanding.
- Root: `C:/worktrees/agento/item-braid-004-a-shared-node-toolchain`
- Branch: `item/braid-004-a-shared-node-toolchain`. Upstream: `origin/item/braid-004-a-shared-node-toolchain`.
- Failed published head: `cdcbe249a2f5ed9efc50d565ae3e9b417a24a01a`. Context HEAD at launch: `8610548f9792072e2e70bb56f0d12e1783a9015e`. This commit is the new candidate.
- Binding: launch thread `mcp:launch:a8ea3b557d4313ab62e717fee1c4b0b2d6a99bc22281ef29c7499e89c0a9b1f9`, initial run ordinal 1. Coordinator thread `ae791527-bf56-41da-a7d9-30821a74cfc5`.
- Skill: `.agents/skills/braid-worker/SKILL.md` at `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`. No skill edits.
- Read index: resumed from this checkpoint, then the worker skill, T3 top-level continuation, packet frozen proof, and the Ubuntu job logs.
- Owned paths: `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`, `reports/A.md`, this file. The installer, Verify, README, and D26 are unchanged in this repair.
- Failed hosted proof for `cdcbe249a2f5ed9efc50d565ae3e9b417a24a01a`: pull request https://github.com/exones/braid/pull/22. Push run `41946952200` and pull_request run `41946958466` both completed failure. `verify (windows-latest)` passed on both. `verify (ubuntu-latest)` failed in Verify on both, jobs `126981425434` and `126981446361`. The fixture node script called `dirname` after PATH was reduced to the fixture directory.
- Repair proof before this record wording: Windows fixture exit 0. BusyBox `sh` probe of the builtin-only stub with an empty PATH printed `v26.13.0` and npm `10.9.0`, rejected `fail-npm`, and stripped a trailing CR. That shell is Docker Desktop BusyBox, not Ubuntu dash. `npm run verify` of this record set is the local gate recorded with the commit.
- PR: https://github.com/exones/braid/pull/22, base `epic/braid-004-performance-optimization`. Watch was already `watching: true` on the item thread. Frozen set unchanged: `.github/workflows/ci.yml` push and pull_request, `verify (windows-latest)` and `verify (ubuntu-latest)`, Install dependencies, Verify, Upload packed tarball, plus each tarball digest and provenance.
- Next: push this commit to the existing branch, link pull request 22 again, leave the existing watch in place, and end the turn. Do not send the coordinator result until the new head's frozen set is green. Post-push proof goes in the PR comment and that result, without another records-only commit.
