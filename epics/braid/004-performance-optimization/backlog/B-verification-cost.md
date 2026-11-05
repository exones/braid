# B: Measure remaining setup and verification overhead

Kind: spike. Epic: [BRAID-004](../epic.md). Owner: research worker.
Depends on: A's reviewed human merge into this epic, verified from Git/GitHub before dispatch.
Item status lives only in the epic backlog table.

## Read first

Read [AGENTS.md](../../../../AGENTS.md), the filled assignment packet, epic analysis/decisions, [current checkpoint](../checkpoints/current.md), and A's accepted report and acceptance record supplied by the coordinator after merge. Inspect [Verify.ps1](../../../../scripts/Verify.ps1), [docs gate](../../../../scripts/Test-DocsGate.ps1), [package proof](../../../../scripts/Test-Package.ps1), [CI](../../../../.github/workflows/ci.yml), and [commit boundary](../../../../docs/agile-workflow.md#commit-boundary). Do not repeat A's toolchain design discovery.

## Research question and bound

After shared toolchain reuse, what setup and verification steps still cost meaningful time, and is a narrower local check set worth proposing? Limit investigation to two hours of active work plus required delivery gates. Produce a concise observation table, reproducible harness/commands, recommendation and limits; stop measurement when the bound is reached and record incomplete observations.

## Scope and procedure

Use one declared Windows machine and the exact accepted revision for comparisons. Record OS, PowerShell/Node/npm versions, cache states, commands, exit codes and wall-clock durations. Keep raw logs and distinguish preexisting network caches from cold extraction. Never delete a real user's caches to simulate cold setup.

1. Record one cold resolution using an isolated `BRAID_TOOLCHAIN_DIR`, then three warm resolutions from that store. Reuse A's exact-revision cold observation if it remains applicable, identifying its revision and limits. Capture download/extraction counts and disk usage where measurable.
2. Measure per-checkout `npm ci` separately using a disposable dependency root or the worker's owned checkout. Keep the normal user npm cache; label it accurately. Do not share `node_modules` across worktrees or clear the shared npm cache.
3. Run three warm `npm run verify` trials. Capture total time and per-step observations for docs/negative fixtures, OIDC guard, install-policy guard, typecheck, build, tests, and packed-install proof. Use a measurement harness under `validation/B/` if needed; retain commands and ordering, return native failures, and do not modify the production gate to skip work. Distinguish separately timed component runs from instrumentation of the full command.
4. Inspect up to 12 relevant recent CI runs with `gh run list`/`gh run view`; separate push and pull_request, queue and job duration when available, operating systems and final conclusions. Record run/head IDs and retrieval date. Do not infer per-step timings from overall created/updated timestamps or claim these are a controlled local/hosted comparison.
5. Compare observations to the prior checkout-local installer using inherited source or A's recorded baseline where practical. If no controlled before/after exists, report that limit instead of fabricating a speedup. Identify duplicated work only when its acceptance purpose is preserved.

Suggested table columns: revision, environment, case, cache state, command/step, trial, seconds, exit code, download/extraction count, evidence path. Derive the recommendation after recording observations.

## Acceptance criteria

1. Another agent can reproduce the observations from committed commands/harness and environment descriptions. Report all trials, failures and unavailable measurements; do not report only the fastest trial.
2. Separate setup from verification, and useful fixture/tarball installs from bootstrap duplication. Report warm timing ranges/medians where enough trials exist, with no unmeasured performance claim.
3. Recommend retaining current gates or propose a concrete future check split, with expected savings, coverage tradeoffs, failure/repair costs and exact policy files affected. A proposal does not change the current standard. No guarantee about agent turns, watch survival or CI latency is inferred from wall time alone.
4. State whether dependency-install caching deserves a later item. Do not implement a skip based solely on matching lockfiles: package contents, runtime/platform and install policy also matter.
5. Leave all existing local and hosted gates intact. Deliver the spike through PR, applicable CI, independent review and human merge, with any user-owned policy decision clearly separated from completed research.

## Ownership, verification and review

Own `validation/B/`, `reports/B.md` and `checkpoints/B.md`; no product or policy change. Check harness syntax and exercise the recorded commands, then `npm run verify` before the PR. Record applicable full current-head Windows/Linux CI with successful install, Verify and tarball upload; green is not independent review or human merge.

Use `item/braid-004-b-verification-cost`, based on the accepted epic tip, with one PR into the epic. Independent review follows [review conventions](../../../../docs/agile-workflow.md#review-gates-and-indexing), checking raw observations, reproducibility, limits and recommendations. A local research result alone is not Done.

## Report and resume

Follow [report format](../../../report-format.md). Commit observations and candidate records before push, keep post-push proof in the PR comment/result, return the recommendation and proposed status to the coordinator, then stop. Any gate-policy change is a separately authorized future item, not an incidental part of B.
