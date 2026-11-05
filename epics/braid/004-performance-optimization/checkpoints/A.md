# A checkpoint

- Task: BRAID-004/A shared Node.js toolchain. Implementation and local proof are in this commit. Hosted current-head proof is still the worker's job after the pull request exists.
- Root: `C:/worktrees/agento/item-braid-004-a-shared-node-toolchain`
- Branch: `item/braid-004-a-shared-node-toolchain`. No upstream before the first push. Push with `git push --set-upstream origin item/braid-004-a-shared-node-toolchain`.
- Context HEAD at launch: `8610548f9792072e2e70bb56f0d12e1783a9015e`. This commit is the candidate; use `git rev-parse HEAD` after it.
- Binding: launch thread `mcp:launch:a8ea3b557d4313ab62e717fee1c4b0b2d6a99bc22281ef29c7499e89c0a9b1f9`, initial run ordinal 1. Coordinator thread `ae791527-bf56-41da-a7d9-30821a74cfc5`.
- Skill: `.agents/skills/braid-worker/SKILL.md` at `7e7ea5a9cb60fa3f56c79bf44ff389e1e7442bf8`. No skill edits.
- Read index: packet `assignments/A.md`, backlog A, epic analysis/scope/outcomes/decisions/gates, `checkpoints/current.md`, README build and CI, decisions D02/D03/D15/D24/D25, installer, Verify, CI workflow, report format, commit boundary, T3 top-level continuation.
- Owned paths: `scripts/Install-NodeToolchain.ps1`, `scripts/Verify.ps1`, `test/fixtures/node-toolchain/Test-NodeToolchain.ps1`, `README.md`, `docs/decisions.md` D26, `validation/A/observation.md`, `reports/A.md`, this file. Epic, backlog, assignment, and `checkpoints/current.md` are untouched.
- Proof: fixture exit 0. `npm ci` exit 0 with Node `v26.13.0` and npm `11.20.0`. Dirty `npm run verify` exit 0 twice (implementation probe, then this record set); both `candidate false`. Cold install and warm proxy reuse recorded in `validation/A/observation.md`. `win-arm64` was not executed. No controller run.
- PR: not opened yet. Target `epic/braid-004-performance-optimization`. Frozen hosted set: `.github/workflows/ci.yml` push and pull_request, `verify (windows-latest)` and `verify (ubuntu-latest)`, steps Install dependencies, Verify, Upload packed tarball, plus tarball digest and provenance.
- Next: push this commit, open one pull request into the epic, link it, watch it, and take the one catch-up snapshot. Pending CI stays on this worker. Post-push proof goes in the PR comment and the result, without another records-only commit.
