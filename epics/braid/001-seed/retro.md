# Seed retrospective

Updated: 2026-11-03. Status: original seed candidate review, fixes, final-head CI, and human merge completed in PR #2 at `d81f4a5`. D1, the user-requested sequential-ID follow-up, is Done after its own proof, CI, no-findings review, and human merge. No release or stage 2 start is implied.

## Outcome against the seed goals

The candidate implements the manual ledger, meaningful verification, installed-tarball proof, Windows/Ubuntu CI artifacts, and durable coordinator workflow. A/B/C/N/D are merged. Exact revisions, artifact digest, outcome assessment, review disposition, and release limits are in [the candidate report](reports/final.md). A fresh short-goal planning exercise supplies the bounded skill behavior proof. D1's separate fresh planning check produced sequential A/B/C names, and its review found nothing to change. The expanded seed backlog is closed.

## Observations and resulting changes

- **File-based handoffs worked across roles/providers.** Explicit AGENTS/context paths, worker reports/checkpoints, and coordinator-owned shared status let Sol/Grok assignments and fresh reviews proceed from files. The short-goal planning child independently found/read the skill through AGENTS and produced a resumable plan. This demonstrates the observed route, not every provider or autonomous recovery.
- **Independent review caught a real ledger-validity defect.** A long accepted block reason generated a next action exceeding the stored limit. The fix retains the full reason and uses a bounded default; 491/492/2000-character process regressions verify readability and resume. See bootstrap review evidence.
- **Windows-only assumptions reached Linux CI twice.** The initial read-only-destination test expected Windows rename behavior on POSIX; D's package proof then expected Windows wrapper text inside a POSIX bin symlink. Corrected platform assertions/target resolution preserve the intended guarantees and every installed scenario. The initial failures remain linked in review records; required gates were not skipped to pass.
- **The real installed artifact was worth checking.** Pack/install proof exercises the npm-generated executable in an external consumer, not source imports or npm link. Clean-candidate flags, source SHA, digest, and retained baselines keep dirty probes distinct from reproducible identity claims. A checksum identifies a pack; it does not establish hardware durability or universal byte equality.
- **Provisional publishing policy must stay separate from the executable contract.** Hardcoded name/version/private checks would have blocked later authorized publication configuration. Manifest-driven verification plus a scoped public-mode/version-change fixture fixes that path while today's actual package remains private. Package ownership and release authority stay explicit user decisions.
- **Reviews should remain attached to their parent.** The user requested parent/pass indexing rather than new backlog letters. `AGENTO-001/review-01` preserves legacy R and original R1/R2 labels; pass 02 independently validates the fixes and convention changes. Future routine item reviews use IDs such as `D/review-01`, within the same delivery PR.
- **Useful completion reports need more than status.** The user requested release-note detail. Root guidance, skill/templates, and report format now distinguish concise progress updates from substantive item delivery briefings, and keep README/reusable handoff guides free of live progress duplication.
- **Registry setup did not block local delivery.** npm name/account/trust setup is explicitly deferred while local tarball and CI/review proof proceed. The observed unscoped name collision is documented; no npm identity is inferred from GitHub and no credentials, publish, tag, or release action was needed.
- **Bootstrap history was reconciled honestly.** The user's bundled A/B commit was preserved inside PR #1 instead of rewritten into artificial earlier PRs. D proceeds as a scoped PR, with review/evidence attached to the same deliverable.

No reliable intervention count, elapsed-effort total, cost, velocity, or recovery-success metric was collected. This retrospective does not invent one. The exercise tested durable explicit handoffs and bounded planning, not the later watchdog/retry/scheduling stages.

## Follow-ups and scope

Prefer platform-native assertions and installed-artifact proof whenever package/runtime paths differ across supported OSes. Keep failure injection where real permissions cannot reliably produce the same pre-commit boundary. These observations inform future tests; they do not authorize broader hardening or later product stages.

The retained backup-guide plan under `validation/ledger-backup-plan/` is a test artifact, not an approved production story. Adopt it only through an explicit later goal/refinement. Keep current review and reporting conventions in the canonical workflow/skill instead of copying live assignment tables into guides.

No new product scope is required to close the reviewed findings. Original delivery CI and merge are complete, and D1's workflow follow-up is merged and reviewed. The review of `d22b4bb` returned after PR #5 was merged; it had no findings, so the merged guidance stayed as it was. Any release/controller promotion remains separately authorized. Package ownership/setup and release publishing must not become hidden prerequisites for unrelated local work.

## Next-stage readiness

A fixed, reviewed `agento@0.1.0` private tarball is installable outside the checkout; clean proof at `2cf2bf2` has SHA-256 `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb`. Preserve it with its provenance, or use a separately verified current CI artifact and that artifact's identity. No permanent accepted controller installation, registry publication, remote tag/GitHub Release, or stage 2 ledger is recorded.

After human merge and an authorized promotion decision, install the pinned accepted controller outside candidate development output using README. Before stage 2, refine/approve its own epic/backlog and record controller/schema/artifact identity. Dispatch, messages, automated gates, scheduling, failover, and crash recovery remain later-stage work.
