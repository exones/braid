# Fresh contributor documentation planning research

Status: reviewable unapproved plan; delivery not started. Date: 2026-11-03.
Assignment: research sub-agent, planning only.
Checkout: C:\worktrees\agento\t3-8a92b62a.
Branch: `t3/8a92b62a`.
Exact verified source HEAD: `da4792a485f45f54b0f0b912d3df62a2a484bdf0`.

## Outcome

Prepared a small documentation improvement plan for prerequisites, a first source-checkout run, and setup troubleshooting. The [epic](../epic.md) contains three separately reviewable stories with acceptance criteria, dependencies, ownership boundaries, Ready/Done criteria, and future review/delivery requirements. No proposed contributor documentation was implemented.

The [command audit](command-audit.md) classifies existing entries by prerequisites, side effects, and suitability. First-run probes use help/version after a build. Setup remains explicit about network and disk writes; extended verify includes packed installation, and ledger status has lock-directory effects.

## Authority and consulted workflow

Applied the user's fresh-validation exception to AGENTS/skill resume guidance: no production epic, backlog, checkpoint, dependency report, seed D1 assignment/report, or separate trusted-publish tree was opened. The assigned validation root substitutes for the normal epic root. The permitted epics/README.md index was read, but its production links were not followed. Incidental historical task references within permitted shared instructions/product docs were not used as prior task answers.

Instruction/workflow/template files actually consulted (paths relative to repository root):

- [AGENTS.md](../../../../../../AGENTS.md).
- [Coordinator SKILL.md](../../../../../../.agents/skills/agento-coordinate/SKILL.md): context, analyze/refine, planning-only stop, templates, checkpoint/report.
- [Decisions](../../../../../../docs/decisions.md), [Agile workflow](../../../../../../docs/agile-workflow.md), [roadmap](../../../../../../docs/roadmap.md), [epic index](../../../../../../epics/README.md).
- [Epic template](../../../../../../.agents/skills/agento-coordinate/assets/epic.md) and [backlog template](../../../../../../.agents/skills/agento-coordinate/assets/backlog-item.md).
- [Delivery rules](../../../../../../.agents/skills/agento-coordinate/references/delivery.md), [handoff guide](../../../../../../docs/agent-handoff.md), [report/checkpoint format](../../../../../../epics/report-format.md).

No other skill was invoked or modified. Review/delegation templates and mechanics were unnecessary: no review or worker was launched. Delivery rules describe future gates; the user's planning-only prohibitions override their normal delivery actions.

## Bounded research and decisions

Research was bounded to existing local setup documentation, package/scripts/configuration, the CLI's help/version/parser path, lock-related excerpts, and CLI test definitions. Stop once prerequisite versions, supported command names, first-run output, setup/verification side effects, and six actionable failure categories were supported. No external lookup or runtime experiment was needed; no separate research spike is left pending.

README already covers build/verify and CLI details. Proposed improvement is discovery and a coherent contributor path, not replacing supported behavior. Use README plus a future docs/contributing.md guide and three sequential stories rather than new automation or a sprawling support runbook.

The local Node requirement is >=26.13.0 <27 and pwsh minimum is 7.6.0; these are checked-in requirements, not independent claims about upstream releases. Windows downloader supports x64/Arm64, while non-Windows uses compatible Node on PATH. The dependency installer is not a harmless probe. Product help/version avoid executeCommand; status does not modify ledger contents but uses mkdir/rmdir for locking. Manual completion is not acceptance evidence.

## Exact read and write inventory

The [inventory JSON](../evidence/inventory.json) is the exhaustive set of repository file contents requested/read or searched by this exercise, generated files, and discovery-only directories. Some initial batched tool output was truncated; consequential package/toolchain/verifier/CLI/test/pack-install details were re-read or narrowed before conclusions. It does not imply a full audit of all test suites, dependencies, or every line of the large packaging script.

Read methods: Get-Content for named files, rg content matches on the two named ledger sources and packaging script, JSON/Markdown reads in the validator, and Get-FileHash on the Git index. Discovery used rg --files only within docs, src, scripts, .github, coordinator assets, and test; filenames discovered are not claims that their contents were read. No recursive content scan of epics was used.

All writes are new validation artifacts under this assigned root. The inventory includes this report, the validator, baseline/after snapshots, and check output. No production documentation, source, configuration, skill, tracked artifact, or Git/index/branch entry was intentionally written. The absent plan root was created; no pre-existing file there was overwritten.

Git metadata read: HEAD/branch resolution, status/diff inspection, index-path resolution, and SHA-256 of that exact index file. Tool-managed Git internals were not manually edited. Generated files are read for local validation; their paths are included separately in the inventory.

## Checks actually performed

Initial local checks: Get-Location; git rev-parse HEAD; git status --porcelain=v1; git symbolic-ref --quiet --short HEAD; git rev-parse --git-path index; git status --porcelain=v1 --untracked-files=all; git diff --quiet; git diff --cached --quiet; Get-FileHash -Algorithm SHA256 on the resolved index; Test-Path on this validation root.

Final local check command (PowerShell, from repository root): `& ./epics/agento/001-seed/validation/D1-fresh-plan/Validate-Plan.ps1`.
The script checks direct relative Markdown targets and heading anchors, balanced fences/heading/whitespace formatting, required epic/backlog sections, sequential A/B/C filenames and dependencies/status, exact generated-file inventory, package script/engine/bin/private references, Node/PowerShell pins, and preservation of tracked diff/index/branch/HEAD. It uses only local text inspection and read-only Git commands. See [machine results](../evidence/checks.json) for actual outcomes and counts; a failing run must be fixed and rechecked without weakening acceptance.

The validator is an exercise-local check artifact, not a product command or installed tool. No package manager, Node/product invocation, project script, dependency installation, build, test, verify, package proof, setup/backup operation, network request, agent launch, commit/stage/branch switch/push, or PR action was performed.

Result: passed. Seven Markdown files, 111 direct relative links, and seven heading anchors checked; all 12 generated files match the write inventory. Epic/backlog sections, A/B/C sequence and dependencies, five package-script mappings, four absent shortcuts, package/toolchain requirements, and preservation assertions passed. These are static planning checks, not product acceptance.

## Before/after preservation evidence

[Before snapshot](../evidence/preservation-before.json): exact expected HEAD; branch t3/8a92b62a; clean tracked working tree and index; no untracked entries; assigned plan root absent.
Index SHA-256: `C23ABF7A58C188EDA42AEB589CD9AAAA8CB4A83F9B6F0DFDCD627E2D46593429`.
Resolved index: `C:/code/agento/.git/worktrees/t3-8a92b62a/index`.

[After snapshot](../evidence/preservation-after.json): machine-generated final HEAD/branch/index hash, tracked/index diff exit codes, and complete porcelain status. Validator requires the same HEAD, branch, and index hash; no tracked/index diff; every new path exactly within the recorded write inventory. This demonstrates Git-visible tracked-content/index preservation and bounded additions. It does not claim file access times or all ignored filesystem contents were independently snapshotted.

Observed result: HEAD and branch match the baseline, the index SHA-256 is unchanged, tracked/index diff checks return 0, and status contains exactly the 12 new untracked inventory paths under this validation root.

## Limits and delivery state

Static source reasoning and local plan integrity only. Nothing proves that this machine can install the toolchain, reach a registry, run the candidate, reproduce failures, or pass hosted CI. CLI tests were read, not executed. No independent review, user approval, PR, merge, release, or publication exists for this plan; A/B/C remain backlog proposals. No production status was changed.

## Resume

Stop after handing back actual artifact paths. The requester can review [the epic](../epic.md) and outcomes A/B/C, with this report and command audit as evidence. Any future use requires a separately authorized assignment and refreshed source facts; the plan does not itself dispatch work.
