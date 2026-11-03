# Epic AGENTO-001: a usable seed

Created: 2026-11-03. Owner: user. Status: done for the expanded seed backlog. A/B/C/N Done in PR #1, D Done in human-merged PR #2, D1 Done in human-merged PR #4 and PR #5. Publication and stage 2 are not started.
Target: first 0.1 candidate. Controller: bootstrap `agento-coordinate` skill and manual files; no released CLI. Preferred roles: Sol High coordinator and one Grok 4.7 Extra High worker when assigned.
Repository: `https://github.com/exones/agento.git`, public, current account ADMIN. PR #1 human-merged at `afc05074a27da2cb1a3c225bc9d42d10f184e504`; original branch deleted remotely. The user's bundled A/B commit `3283807` remains in history. Final PR head `e997381` passed Windows/Ubuntu CI; details are in [delivery evidence](reports/bootstrap-delivery.md). D uses owned branch `feat/package-bootstrap` from that merge.

## Why

Build agento incrementally and use its current release to organize the next release. Begin with durable files and a manual CLI ledger, then introduce execution and coordination. TypeScript/Node.js, PowerShell automation, GitHub Actions, and npm distribution are the selected implementation/release path.

## Outcomes

1. A fresh agent can locate the next assignment and resume from files.
2. One installable Node.js package exposes a TypeScript-built `agento` executable.
3. The CLI creates an epic ledger, tracks stories, preserves state/events across processes, and renders readable status. An epic describes the outcome; a future execution run describes an attempt to deliver it.
4. A PowerShell verification entry point runs meaningful product checks locally and in Windows/Linux GitHub Actions.
5. The actual packed artifact works outside the source checkout and can track the next development stage.
6. A report distinguishes local readiness, remote CI evidence, release blockers, and proposed next-stage work.
7. A reusable coordinator skill turns a short goal into analysis, an epic/backlog, and acceptance planning; delivery/resume requests follow that plan without requiring the user to repeat a long prompt.

## Scope boundary

Include help/version, idempotent initialization, epic/story ledger creation, manual story tracking, state validation and serialization, events, status, tests, build/verification scripts, Actions, packaging proof, and operating instructions. The bootstrap coordinator skill is already authored before product implementation; its live usage will refine it.

Exclude product T3 dispatch, messaging, automated gates/merge decisions, scheduling, watchdogs, provider failover, automatic exports, dashboards, registry deployment, and parallel implementation workers. A separate manually assigned coordinator may supervise the single worker. Seed completion is an explicit manual record, not independently verified acceptance.

## Features and prioritized backlog

Feature F1: a verified CLI for manual epic/story tracking. Feature F2: an installable bootstrap release. Coordinator workflow bootstrapping supports both. The former self-hosted registry spike is cancelled after selecting npm.

| ID | Kind | Feature | Backlog item | Depends on | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| A | spike | F1 | [Preflight and contract](backlog/A-preflight.md) | None | done | [Local acceptance](reports/A-review.md); [PR #1 delivery/CI/review/merge](reports/bootstrap-delivery.md), merge `afc0507` |
| B | enabler task | F1 | [Foundation and CI](backlog/B-foundation.md) | A | done | [Local acceptance](reports/B-review.md); [PR #1 delivery/CI/review/merge](reports/bootstrap-delivery.md), merge `afc0507` |
| C | story | F1 | [Manual ledger](backlog/C-ledger.md) | B | done | [Worker evidence](reports/C.md), [review fixes](reports/bootstrap-review.md); [PR #1 delivery](reports/bootstrap-delivery.md), merge `afc0507` |
| N | task | F1 | [Use agento for storage naming](backlog/N-storage-name.md) | C | done | [Worker evidence](reports/N.md), [local review](reports/N-review.md); [PR #1 delivery](reports/bootstrap-delivery.md), merge `afc0507` |
| D | story | F2 | [Package and bootstrap proof](backlog/D-package.md) | C and N merged | done | [Candidate report](reports/final.md), [proof/fixes, CI and merge](reports/D-review.md), [review pass 02](reports/reviews/AGENTO-001/02.md); [PR #2](https://github.com/exones/agento/pull/2), final head `147a4bd` CI passed, merge `d81f4a5` |
| D1 | story | coordinator follow-up | [Sequential backlog IDs](backlog/D1-sequential-backlog-ids.md) | D merged | done | [Worker report](reports/D1.md), [planning proof and closeout](reports/D1-validation.md), [review](reports/reviews/D1/D1-sequential-backlog-ids-review-001.md); policy [PR #4](https://github.com/exones/agento/pull/4) merge `3a46c9e`; proof [PR #5](https://github.com/exones/agento/pull/5) head `d22b4bb`, CI passed, merge `ecf0d7c` |
| I | spike | superseded infrastructure | [Registry discovery](backlog/I-registry-discovery.md) | None | cancelled | User selected npm; no Forgejo deployment |

A -> B -> C -> N -> D -> D1 is sequential, with reviews as gates of those items and the seed epic. N applies the storage naming correction at C's safe handoff boundary. D1 is the user-requested next story after D; delivery resumed after D's merge. Review findings remain bound to their parent and are triaged before closure. I is documentation/discovery only, outside seed acceptance. No worker launches another agent from a backlog item.

## Review gates

| Review | Parent and scope | Status | Evidence |
| --- | --- | --- | --- |
| `AGENTO-001/review-01` | AGENTO-001, fresh-context full seed candidate including D packaging | findings, resolved | [Two original P2 findings and triage](reports/reviews/AGENTO-001/01.md), exact candidate `848d4d5`; fix `f61772a`, rechecked by pass 02; [legacy assignment](backlog/R-review.md) preserved |
| `AGENTO-001/review-02` | AGENTO-001, bounded fixes and updated workflow/reporting conventions | no-findings | [Independent report](reports/reviews/AGENTO-001/02.md) on exact `2cf2bf2`; not a formal GitHub approval or merge decision |
| `D1-sequential-backlog-ids-review-001` | D1, backlog naming guidance and retained fresh planning proof | no-findings | [Independent report](reports/reviews/D1/D1-sequential-backlog-ids-review-001.md) on exact `d22b4bb`; returned after PR #5 was merged; not a formal GitHub approval |

R is retained as a legacy reference, not a new independent backlog deliverable. Its completed report/checkpoint are filed under the parent-scoped paths with `reports/R.md` and `checkpoints/R.md` pointers. Original finding labels R1/R2 remain stable. Future assignments follow the authoritative [review conventions](../../../docs/agile-workflow.md#review-gates-and-indexing). See [naming update](reports/review-naming.md).

In coordinated mode Sol owns this backlog table and `checkpoints/current.md`; Grok owns its item checkpoint and report. The coordinator skill assembles assignments from these files. Without a separate coordinator, the standalone agent maintains shared status.

Local readiness can advance while GitHub target information is missing. The milestone must not claim remote CI passed or a release exists without evidence.

## Seed CLI contract to settle in A

Keep the surface small: `--help`, `--version`, `init`, `new`, `status`, and `story add/start/block/complete`. `new` creates the manual epic ledger; it does not start agents. Specify exact arguments, epic selection, story states, exits, and evidence notes in `docs/seed-contract.md` during A. Unsupported commands fail clearly. Avoid a generic mutable state setter. The coordinator's backlog may also contain tasks/spikes; A should specify how the seed's minimal ledger represents them without introducing extra command families.

## Definition of Ready and Definition of Done

Use [the project workflow](../../../docs/agile-workflow.md). Ready requires clear outcome/scope, satisfied dependencies, explicit ownership, and testable acceptance/evidence. A worker submits evidence for review; the coordinator confirms Done. A completed spike records its decision, not necessarily code. Item-level Done and epic release readiness are separate.

Updated delivery rule: each story/spike goes through scoped Conventional Commits, a PR, applicable hosted CI, review, and human-approved merge before Done. Earlier A/B local acceptance is retained, with outstanding PR/CI gates visible above. A/B were bundled in a user commit before this rule; preserve that history and group their delivery with C/N in the bootstrap PR. Supporting reviews/tasks attach to that PR. README contains capabilities/setup/usage, while this epic and checkpoints own progress.

Local state lives under `.agento/` and is excluded from Git. Task N supersedes the pre-release `.crew/` implementation. The CLI owns state; work-item notes/checkpoints stay human readable. Document schema version, write serialization, interrupted-write handling, and state/event consistency. Test the guarantees actually implemented; defer automatic crash recovery to its roadmap stage.

## Stage gates

- [x] Bootstrap skill: structural validation plus [fresh short-goal planning proof](reports/skill-proof.md) on `2cf2bf2` through AGENTS routing in Codex/T3. No claim of invisible UI selection, every host, or all workflow branches.
- [x] A: environment facts and exact seed contract recorded; unknown T3 behavior deferred explicitly. Coordinator corrections accepted in `reports/A-review.md`.
- [x] B: typecheck/build/tests run through PowerShell; basic CLI works; Actions workflow prepared. Local acceptance in `reports/B-review.md`.
- [x] C: epic/story ledger creation, transitions, validation, non-overwrite behavior, persistence, and serialized updates proven; corrected candidate passed 40 tests, CI, review, and human merge in PR #1.
- [x] N: `.agento/` is consistent across runtime, help/errors, tests, ignore rules, and current documentation; preservation check, CI, review, and human merge in PR #1.
- [x] D: clean installed proof, independent review, Windows/Ubuntu CI on final head `147a4bd`, and human merge `d81f4a5` recorded in `reports/D-review.md`.
- [x] Windows and Linux GitHub Actions pass on D's final PR head; PR run 41692089275.
- [x] Original A/B/C/N/D delivery has honest PR/CI/review/merge evidence; existing user commits preserved.
- [x] D1 follow-up has centralized naming guidance, bounded fresh planning proof, no-findings review of `d22b4bb`, Windows/Ubuntu CI on that head, and human merge `ecf0d7c`.
- [x] Review passes 01/02: original R1/R2 fixed and independently rechecked; current product CI supports Linux execution. No unresolved actionable P1/P2/P3 finding in the reviewed scope.
- [x] [Candidate report](reports/final.md) and [retrospective](retro.md) written; pinned outside-checkout installation instructions recorded. No controller promotion or stage 2 start claimed.
- [x] Release status explicit: technically validated private candidate, not released. Version/artifact/digest recorded; publication requires separate npm identity/setup and authorization.

## Decisions

- 2026-11-03: independent review `D1-sequential-backlog-ids-review-001` reports no actionable findings on exact `d22b4bbccd4f38f6fb66c1e03c4cc56570060036`. The user had already merged that head in PR #5 at `ecf0d7c0f4cb717e63b469ce0bd9625c12d2ee74`. The reviewed seed tree matches the merge. No fix or rollback. Copied the review report and checkpoint unchanged and marked D1 Done. This is not a release, publication, or stage 2 start.
- 2026-11-03, user: requested further work. Verified PR #2 human merge `d81f4a5765b6b34e686d3827a15aaaf726e76f01` at 18:20:40Z, final head `147a4bd` Windows/Ubuntu success. D is Done. Fast-forwarded local main to actual remote tip `709de20`, preserving newer commits without editing the separate epic, and prepared `feat/sequential-backlog-ids`. Assign only D1; the coordinator arranges independent planning proof/review after a committed candidate exists.
- 2026-11-03, user: requested a story immediately after D because a separate epic used title-derived backlog IDs instead of sequential letters. Added D1 with acceptance for centralized planning guidance, consistent filenames/references, stable existing IDs, and a fresh bounded planning exercise. The screenshot is supplied evidence; the separate tree is outside scope. No implementation or dispatch in this planning turn. D1 must be delivered before closing this epic's expanded backlog; existing seed product evidence remains valid within its original scope.
- 2026-11-03: independent pass 02 reports no actionable findings on `2cf2bf25957869dc94fec0718a6dbc67e905f8d7`; copied its exact report/checkpoint and reconciled them with coordinator-observed Windows/Ubuntu CI/uploads and accepted short-goal skill proof. Candidate report/retro now reflect actual capabilities, fixes, evidence, limits, and remaining human authority. Commit this evidence-only update, require latest-head CI, then hand back PR #2 without another metadata-only evidence loop. D is not Done until human merge; no registry upload or stage 2 authorization.
- 2026-11-03: accepted the bounded fresh-session planning exercise after reading its actual files and preservation evidence. The child found/read the coordinator skill via AGENTS from a short goal, produced a durable plan/story/checkpoint/report, and stopped before implementation. Retained four explicitly unapproved validation artifacts; DOC1 is not production backlog. Bootstrap behavioral proof is scoped to the observed Codex/T3 route; independent pass 02 remains pending.
- 2026-11-03: epic review pass 01 returned two P2 findings, no P1. Fixed POSIX bin-target verification and made package proof/metadata tests follow the selected manifest identity/version/private flag. Normal Windows Verify passed 40 tests plus package proof; a temporary scoped public-mode/version-change fixture passed CLI tests and full package proof, then restored the manifest byte-for-byte. Keep actual package private/unpublished. Require clean committed-candidate proof, hosted Linux success, and independent fix review. Arrange the declared short-goal skill exercise before claiming outcome 7 complete.
- 2026-11-03, user: routine reviews belong to their parent item/epic, without a new backlog letter. Adopted parent-scoped passes; the already-running R assignment maps to `AGENTO-001/review-01` because it spans the seed. Preserve its output paths until return, then reconcile with legacy pointers. Expanded persistent report and completion-briefing guidance to include introduced capabilities, important changes, validation, limits, and next action; short progress updates remain available. Product candidate and review assignment are unchanged.
- 2026-11-03: D returned PR #2 at `10ff911294a72957fe7fc689757bb33d3c72b38d`. Independently reran clean packed-install proof outside checkout; digest matches worker evidence. D stays In Review while hosted CI and separately assigned R run. npm owner/scope/name selection is a publication prerequisite; unscoped `agento` is already occupied, so no registry upload is authorized or needed for this review.
- 2026-11-03, user: merged PR #1 and deleted its remote branch, then requested continuation. Verified merge `afc05074a27da2cb1a3c225bc9d42d10f184e504`, final-head CI success, and unchanged tree across merge. Marked A/B/C/N Done, fast-forwarded local `main` without rewriting user history, and prepared D on `feat/package-bootstrap`. D's worker may now use normal scoped commit/push/PR delivery; no publication or merge authorization is included. R follows a concrete D candidate.
- 2026-11-03: bounded fix review reports no findings on `af0b69fa4c6ea8d2216d133c6d46a99981a1cbd9`; Windows/Ubuntu PR-triggered CI run 41663657936 passes on that head. Commit the evidence-only update, require latest-head CI, then hand back for the human merge decision without another product change or redundant review cycle. D/R remain backlog.
- 2026-11-03: fresh bootstrap review found a long-reason generated-default bug (P1) and an incorrect POSIX rename expectation (P2). Corrected the bounded generated default while preserving the full 2000-character reason and explicit 500-character next action. Preserved pre-commit failure coverage; the corrected read-only-destination test asserts each platform's actual semantics. Initial Ubuntu CI confirmed the original test failure. Forty local tests now pass; final hosted CI and fix review remain required.
- 2026-11-03: N returned and its local gate passed independently (39 tests). README now contains supported capabilities/usage and stable contributor links, with live progress removed. Reconcile A/B/C/N through one bootstrap PR because A/B already share the user's `3283807` commit; preserve it without rewriting history. Fresh review and hosted CI must examine the actual candidate head.
- 2026-11-03, user: storage must also use the selected tool name. `.agento/` supersedes `.crew/`; added bounded task N after C and before D to avoid concurrent worker edits. Historical reports/original reference material retain the names actually observed.
- 2026-11-03: user requires commit/PR/CI/review delivery (including spikes), Conventional Commits, and no work-progress dashboard in README. A/B are locally accepted but In Review pending delivery gates. Preserve user's existing `3283807` bootstrap commit; reconcile real PR coverage after C returns. Keep C running unchanged and defer README/index/branch changes until then.
- 2026-11-03: accepted B after independent verification and an installer preservation fix. Remote CI remains unrun. Proceeding to C within resumed delivery scope, with one Grok worker and no additional human approval gate.
- 2026-11-03: user confirmed npm and requested continuation. Cancelled spike I and marked the Forgejo design superseded; npm account/scope/trust setup will be surfaced when release work needs the user. B starts with one Grok worker in the shared checkout so it can read uncommitted handoff files. No publishing or remote write is included in the worker assignment.
- 2026-11-03: accepted A after correcting state replacement and incomplete-event handling. Node 26.x (`>=26.13.0 <27`) and pwsh 7.6+ are the seed baseline; local Node is still 24.19.0. B is ready and unassigned. Scope for this initial handoff stops after A's review.
- 2026-11-03: user asked to start. Coordinator verified A's readiness and is assigning only spike A to Grok 4.7 Extra High through Cursor in the existing checkout. Review A's evidence before starting B; this assignment does not authorize product implementation or publication.
- 2026-11-03, user: use Agile epic/story/task/spike organization. Renamed active files to `epics/.../epic.md` and `backlog/`; preserved IDs and historical reference material. Authored coordinator skill in stage 0 so analysis/refinement precedes implementation.
- 2026-11-03: public npm is proposed for simpler distribution if public visibility is selected; Forgejo is optional. No registry is required to start A or build the seed tarball.
- 2026-11-03, user preference: Sol High coordinates and Grok 4.7 Extra High implements; retain one implementation worker at a time. Added role-specific status ownership to avoid shared-file races.
- 2026-11-03, user: CLI executable is `agento`, in full. Current implementation backlog items and examples follow this name.
- 2026-11-03: follow `docs/decisions.md`; the original full MVP is a reference, not the seed implementation checklist.
- 2026-11-03: work files now, product implementation only through assigned backlog items. Next is A.
- 2026-11-03: self-hosted Forgejo is the intended registry; private connectivity follows `docs/forgejo-tailscale.md`; deployment awaits host discovery.

## Open setup items

See `docs/decisions.md` and `docs/npm-distribution.md` for npm identity, publishing setup, and any GitHub access prerequisites. No Forgejo host or tailnet publishing setup is needed. Do not copy identities or authorizations from inspiration examples.

## Closure

Use [report format](../../report-format.md). Write `reports/final.md` against outcomes 1-7 and complete `retro.md`. The accepted 0.1 artifact becomes stage 2's pinned controller; starting stage 2 requires its own refined epic/backlog.
