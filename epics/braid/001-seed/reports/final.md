# AGENTO-001 seed candidate report

Updated: 2026-11-03. Status: original seed delivery merged in PR #2 at `d81f4a5765b6b34e686d3827a15aaaf726e76f01` (18:20:40Z); final head `147a4bd` passed Windows/Ubuntu CI. D is Done. D1 is Done: policy merge `3a46c9e` in PR #4, proof head `d22b4bb` CI-green and human-merged in PR #5 at `ecf0d7c`, with a no-findings review of that head. This is not a release declaration.

[PR #2](https://github.com/exones/agento/pull/2). Reviewed and product-verified revision: `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`. Bootstrap A/B/C/N merged in PR #1 at `afc05074a27da2cb1a3c225bc9d42d10f184e504`. The final evidence-only successor adds reports/checkpoints/validation artifacts without changing runtime, tests, package inputs, verification scripts, or workflows. GitHub owns latest-head check results; this report does not recursively require another evidence commit to copy those results.

## Capabilities introduced

The seed provides a TypeScript-built Node.js `agento` executable and a schema 1 manual epic/work-item ledger. Operators can initialize a root, create epics, add stories/tasks/spikes, start or resume work, record blockers, record manual completion evidence, and read text or JSON status across processes. State lives under `.agento/`; existing old-name directories are preserved without migration or aliasing. Completion explicitly records manual progress and does not independently verify acceptance gates.

Writes are serialized with a bounded directory lock. The authoritative state is replaced through a synced same-directory temporary file; an append-only contiguous event prefix records accepted mutations. Validation and focused failure checks cover invalid inputs/state, transitions, repeat initialization, links, concurrent writers, timeouts, pre-commit preservation, and post-commit event errors. Repair/replay and kill/power-loss guarantees are not delivered.

Packaging now has a PowerShell proof that builds, packs, installs the exact tarball in a clean consumer outside the checkout, and runs the installed executable through separate processes on paths containing spaces. The normal verification gate combines typecheck/build, 40 product tests, and this installed-package proof. Windows/Ubuntu CI runs the same gate and uploads versioned tarball/provenance artifacts. A fixed controller installation procedure is documented in [README](../../../../README.md); no persistent accepted controller has yet been installed for stage 2.

Package verification follows the selected manifest name/version/privacy, including scoped installation paths and artifact metadata, while the CLI executable remains `agento`. A local scoped public-mode/version-change fixture verifies that transition without publication. The actual package remains `agento@0.1.0`, `private: true`. A guarded manual release workflow and [npm setup instructions](../../../../docs/npm-distribution.md) are prepared but have not been dispatched.

The bootstrap coordinator skill supports goal analysis, durable epic/backlog planning, scoped delivery, reviews, and checkpoints. Routine reviews are indexed by their parent/pass, with exact checked revisions and stable findings, rather than a new backlog letter. Written item reports and completion briefings now describe capabilities, important changes, evidence, and limits. Short progress reports remain available.

## Outcome assessment

| Epic outcome | Evidence and result | Limit |
| --- | --- | --- |
| 1. Fresh agents locate work and resume from files | Real A/B/C/N/D handoffs, fresh seed reviews, and the retained short-goal plan/checkpoint demonstrate file-based context loading. | Not every provider/session-recovery branch or invisible UI selection. |
| 2. Installable TypeScript-built executable | Exact private tarball installed outside checkout by worker, coordinator, and independent reviewer; installed executable and manifest identity checked. | Not registry publication or permanent controller promotion. |
| 3. Persistent manual ledger | Merged bootstrap, 40 product tests, installed lifecycle/preservation checks, and independent review support declared schema 1 behavior. | Manual evidence only; no dispatch, messaging, automated acceptance, repair/replay, or crash-durability claim. |
| 4. PowerShell/local and Windows/Linux gate | Shared Verify entry point and successful current product-head CI verification plus uploads on both OSes. | Final evidence-only successor must pass current-head CI as usual. |
| 5. Packed artifact independent of source checkout | Clean exact-revision package proof, matching digest/provenance, separate installed processes and external consumer; hosted Ubuntu package path passes. | No real stage 2 run or universal byte reproducibility claim. |
| 6. Honest readiness/release handoff | This report, D review, D1 review, canonical review records, artifact identity, and retrospective separate local/remote/review/merge/release states. | D and D1 human merges are recorded. npm identity/release setup remains separate. |
| 7. Reusable short-goal planning workflow | [Fresh planning proof](skill-proof.md) at `2cf2bf2` found/read the skill via AGENTS, wrote a plan/story/checkpoint/report, and stopped after planning. | Codex/T3 documented routing only; validation proposal remains unapproved production work. |

## Validation and findings

- Normal Windows gate after corrections: typecheck/build, 40 tests, and full installed-package proof passed. Independent clean package confirmation at `2cf2bf2` exited 0 with `candidate: true`, `worktreeDirty: false`, and matching source SHA; lock timeout 5427 ms.
- Scoped fixture: `@agento-proof-fixture/agento@0.1.1`, private false, passed 8 CLI tests and full installed-package proof. Manifest restored byte-for-byte. This dirty probe is not the project's npm identity or a release candidate; logs/artifacts are retained locally under `artifacts/fixtures/scoped-identity/`.
- [PR CI run 41674990291](https://github.com/exones/agento/actions/runs/41674990291) succeeds on exact head `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`; [Windows verification/upload](https://github.com/exones/agento/actions/runs/41674990291/job/126053095370) and [Ubuntu verification/upload](https://github.com/exones/agento/actions/runs/41674990291/job/126053095962) pass. Non-expired package artifacts were observed for both OSes. Push-triggered CI also passes.
- [Review pass 01](reviews/AGENTO-001/01.md) found two P2 defects: a Windows-wrapper assumption rejected valid POSIX bin symlinks, and hardcoded provisional metadata blocked the documented publication transition. Fix `f61772a3758516c60971b962b57e65a09fa09b53` resolves both without skipping installed scenarios or changing actual package privacy.
- [Independent pass 02](reviews/AGENTO-001/02.md) reports no actionable P1/P2/P3 findings on `2cf2bf2`; targeted wrapper/link probes, evidence integrity, unchanged scenario body, and workflow/reporting conventions checked. Its Windows probes do not claim Linux execution; coordinator-observed hosted Ubuntu CI supplies that separate evidence. Neither agent report is a formal GitHub approval.
- Skill structure, documentation links, formatting, and exact copied validation/review artifacts are checked before the evidence commit. No full gate is rerun solely for report changes; current-head hosted CI still runs normally.

Earlier failures remain recorded rather than replaced with retrospective pass claims. The retained raw worker and review reports describe their actual checked revisions and limits; this report reconciles their later disposition.

## Candidate identity and use

| Field | Value |
| --- | --- |
| Package / schema | `agento@0.1.0`, `private: true`; ledger schema 1 |
| Clean local proof source | `2cf2bf25957869dc94fec0718a6dbc67e905f8d7` |
| Local tarball | `artifacts/package/agento-0.1.0.tgz` (gitignored) |
| SHA-256 | `e40abb72422dacfc27a5f2d7a1f46dfda200640bc4f11c2640e936b4f809f3fb` |
| Provenance | `artifacts/package/agento-0.1.0.provenance.json`; actual source/dirty/candidate flags and tool versions |
| Hosted fallback | CI artifacts `agento-package-windows-latest` and `agento-package-ubuntu-latest` on the linked run |
| Earlier retained baseline | `artifacts/baselines/10ff9112/`, preserving original source identity |
| Registry/tag/GitHub Release | None published or created |

Keep a verified tarball with its own sidecar; do not relabel old provenance as a new source revision. Use the README's version-pinned outside-checkout installation procedure and verify the digest/version before adoption. Candidate development output and an accepted controller installation must stay separate. The disposable DEMO examples and retained DOC1 validation plan do not start stage 2.

## Remaining authority and next action

PR #2's final-head CI and human merge are recorded in [D acceptance evidence](D-review.md). D is Done. [D1](../backlog/D1-sequential-backlog-ids.md) is Done: the naming guidance and retained planning proof are merged, CI passed on reviewed head `d22b4bb`, and [the independent review](reviews/D1/D1-sequential-backlog-ids-review-001.md) found nothing to fix. The expanded seed backlog is closed. Publication is still a separate decision.

Before npm publication, the user selects an npm account/organization and an available name/scope; unscoped `agento` belongs to another project. Complete required account/2FA, first-package and trusted-publisher setup, then explicitly authorize a verified release identity/artifact. Changing name/version/privacy requires fresh verification and a new clean artifact. No raw secret is requested and no publication action is performed here.

After merge, reconcile status and decide how to promote/install the accepted fixed artifact. Stage 2 still requires its own authorized refined epic/backlog and pinned-controller setup; it is not started by this report. See [retrospective](../retro.md) for observed lessons and bounded follow-ups.
