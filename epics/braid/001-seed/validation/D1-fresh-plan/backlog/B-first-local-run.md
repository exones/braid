# B: Complete a first local CLI run

Kind: story. Epic: [VALIDATION-D1-FRESH](../epic.md). Feature: none.
Status: backlog. Owner: future documentation worker; unassigned. Depends on: A.
**Unapproved validation proposal; no execution assigned.**

## Read first

Read [AGENTS.md](../../../../../../AGENTS.md), [decisions](../../../../../../docs/decisions.md), [Agile workflow](../../../../../../docs/agile-workflow.md), this validation [epic](../epic.md), [checkpoint](../checkpoints/current.md), [research report](../reports/research.md), [command audit](../reports/command-audit.md), and [README](../../../../../../README.md).
Use only this validation plan's context; production epic/backlog/checkpoint/reports and the separate trusted-publish tree remain excluded during this exercise.

Dependency input: [A](A-find-prerequisites.md); future reports/A.md must provide its delivered guide path and validation evidence before B becomes Ready. No such delivery report exists now.

## Value or research question

A new contributor can build the source checkout and recognize a successful first invocation without creating a project ledger.

## Scope and non-goals

Future file: the first-run section of docs/contributing.md. Specify the existing Windows PowerShell sequence from repository root: invoke Install-NodeToolchain.ps1 with pwsh -NoProfile -File, capture its stdout directory, prepend it to the session PATH, probe node --version, run npm ci, npm run build, then node .\dist\cli.js --help and --version. Explain stderr progress from the installer and the local pin v26.13.0. A compatible preinstalled Node can skip the Windows download; do not promise the installer works on Linux.

Describe npm run verify as a separate extended contributor check, including automatic toolchain fallback, typecheck/build/test/pack/install writes and potential network use. First-run help/version success is distinct from passing that gate.

Do not add scripts, execute a ledger scenario, install globally, use npm link, or recommend installing the public package by name.

## Acceptance criteria

1. Given A's prerequisite section, the walkthrough has a clear working directory, shell, ordered existing commands, and no npm start/dev/doctor or other invented command.
2. Help and version use the compiled entry after build; expected version is agento 0.1.0 for the audited HEAD and is checked against package.json at future delivery. Help includes the manual-completion warning.
3. Installation/build writes and network needs are identified before those steps; help/version are described as avoiding ledger execution, not as a complete test of the product.
4. A reader sees that no global agento command is provided by a source checkout, and the first run needs no .agento initialization.
5. Extended verify has its own success/failure guidance and side effects. Nonzero native failures are not ignored; no bypass of engine-strict, checksums, or required gates is proposed.

## Implementation or research tasks

- [ ] Write a short ordered walkthrough using the audited existing commands.
- [ ] Add expected output and stop-on-failure guidance.
- [ ] Distinguish first-run probes from extended verification; validate references and obtain reader review.

## Ownership and verification

Future worker owns the first-run/extended-check sections of docs/contributing.md and its report/checkpoint. A must finish first to avoid editing the same guide concurrently.
Required evidence: compare every command against package.json/scripts and src/main.ts/help.ts; validate links/anchors, fenced snippets, quoting, prerequisites, and expected output. This exercise performs only static checks. A future authorized runtime walkthrough must use a disposable checkout with side effects recorded; it must not be silently run while reviewing this plan. Full required hosted CI remains a delivery gate.

## Review gates

No review is assigned. On future authorized delivery, use B-first-local-run-review-001 for the first parent-scoped review, record the exact candidate SHA and artifact/PR identity, findings, acceptance assessment, and triage in reports/reviews/B/B-first-local-run-review-001.md. Follow [review conventions](../../../../../../docs/agile-workflow.md#review-gates-and-indexing); review is not another backlog item.

## Delivery record

No implementation, commit, PR, CI result, independent review, or merge exists. Status remains backlog, not Done. Future scoped delivery follows [delivery rules](../../../../../../.agents/skills/agento-coordinate/references/delivery.md) and the epic's Ready/Done criteria. This planning request authorizes none of those Git or external actions.

## Report and resume

Future worker outputs would be checkpoints/B.md and reports/B.md under this assigned validation root; they are not created for unstarted work. Follow [report format](../../../../../../epics/report-format.md). Before future dispatch, read the delivered reports/A.md within this root and confirm A's dependency evidence. The coordinator owns shared epic/checkpoint status. Stop after the assigned item; do not launch another agent. Current next action is plan review only.
