# Task B: a focused worker execution skill

Status: partly proven; local candidate prepared, hosted delivery pending. Date: 2026-11-04.
Backlog: [B-worker-skill](../backlog/B-worker-skill.md). Root: `C:\worktrees\agento\t3-fa4ebcc5`; branch: `t3/fa4ebcc5`.
Initial/source HEAD: `16239f5f45685c568705c8f4aa43b8357135bb35`. Candidate head/PR are recorded after creation in the worker checkpoint and handoff, avoiding a self-SHA evidence push.

## Outcome

Introduced [braid-worker](../../../../.agents/skills/braid-worker/SKILL.md), a normally discoverable skill for one assigned implementation story, task, documentation change, bounded research spike or scoped fix, including resume. An assigned worker can establish its checkout, implement/prove its item, create its PR and retain ownership until every declared current-head check passes. Waiting/blocked returns can end a turn without becoming successful delivery. Epic planning, orchestration, successors, subagents and independent review are excluded.

This is B's explicitly usable skill, before C integrates routing and removes conflicting shared prose. No existing policy, README, product, CI, package, storage, release or other-epic change is included. No controller/runtime/schema is introduced; this remains the manual Markdown bootstrap.

## Changes and decisions

- `SKILL.md`: 57-line progressive entrypoint covering approved R01-R12, with maintained AGENTS/provider, Agile Ready/Done/review, delivery and reporting links. It explicitly preserves the user's green-only requirement over legacy pass-or-fail wording without editing C's policy files.
- `agents/openai.yaml`: ordinary UI metadata with implicit invocation enabled and a description/default prompt focused on assigned execution. No provider/model/options or live assignment facts are embedded.
- `assets/assignment-packet.md`: one compact template for task/context/dependencies/Git/ownership/proof/continuation/output facts and resume additions. It supplies current facts without duplicating policy or requiring parent history.
- `references/t3-continuation.md`: only the A-justified host adapter. Parent alone watches/transports events and retains task lineage/teardown; worker diagnoses/repairs/verifies current-head evidence and returns green. It distinguishes one readiness snapshot, real notifications, one new-head reconciliation, stale/duplicate results and interrupted transport. Fresh task IDs under the same item/thread/worktree are allowed; universal durability/cross-provider claims are excluded.
- This item's delivery fields, B report and B checkpoint carry progress; coordinator-owned epic/current checkpoint remain untouched.

Retained the generated branch and assigned stacked base `t3/85fcb290`. Read-only `gh pr view` checks still show plan #6 and A #8 OPEN with null merge identities; `git ls-remote --heads origin refs/heads/t3/85fcb290 refs/heads/t3/fa4ebcc5` resolves the A base to `c86bc3990a63a5b18d582782e54f9a3cffa18928` and no pre-existing B remote branch. Order remains #6 -> #8 -> B. Context commit `16239f5` intentionally belongs to B's ancestry/diff. No fetch, reset, clean, rebase, force push, branch transition, worktree creation, predecessor mutation or merge was performed.

## Local evidence

All local checks below apply to the four new skill files at the initial source HEAD with an uncommitted B candidate. They are structural/authored walkthrough proof, not independent behavioral evaluation or hosted proof.

| Check | Exact command or method | Result |
| --- | --- | --- |
| Prepared checkout | `Get-Location`; `git status --short`; `git diff --cached --name-status`; `git rev-parse --show-toplevel`; `git rev-parse HEAD`; `git branch --show-current`; `git remote get-url origin`, one startup batch | Expected root, full source SHA, generated branch, clean tree/index and `https://github.com/exones/braid.git`; batch exit 0. No routine inventory/fetch/history walk. |
| Skill validator | `python -X utf8 C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/braid-worker` | Exit 0, `Skill is valid!`. Initial invocation without UTF-8 mode failed decoding smart punctuation under Windows cp1252; corrected invocation passed, validator unchanged. |
| Links/metadata/format | `python -X utf8 -` with a bounded pathlib/re/yaml check over the skill directory | Exit 0: exactly four files, 11 local links/anchors resolve, implicit discovery true, UI length/default prompt valid, final newlines and no trailing whitespace. Target anchors checked against actual headings. |
| Matching/mismatch fixture | `python -X utf8 -`, temporary local Git repository created with `git init --initial-branch=t3/fixture`; local-only commit with command-scoped fixture identity; no network | Exit 0. Matching one-batch root/status/index/head/branch/remote observed. Then wrong expected remote plus user-staged file/owned dirty file diagnosed. Before/after full HEAD, branch, status, binary staged/unstaged diffs, actual index and both file bytes identical. Fixture removed by Python TemporaryDirectory within its verified generated temp root. |
| Whitespace/scope | `git diff --check`, followed by explicit candidate/index inspection before commit | Initial check exit 0; untracked skill bytes also covered by explicit checker above. Final staged scope/check results recorded at candidate boundary. |
| Versions | `python --version`; `pwsh -NoProfile -Command '$PSVersionTable.PSVersion.ToString()'`; `gh --version` | Python 3.11.9; PowerShell 7.6.9; gh 2.103.3. No runtime toolchain/dependency change. |
| Dependency/base observation | `gh pr view 8 --repo exones/braid --json url,state,headRefOid,headRefName,baseRefName,mergedAt,mergeCommit`; analogous #6 read; exact-ref `git ls-remote` above | Each exit 0; predecessor OPEN and base retained at accepted A head. No prior CI result counts for B. |

Read current `.github/workflows/ci.yml`, `scripts/Verify.ps1`, `scripts/Install-NodeToolchain.ps1` and package provenance fields in `scripts/Test-Package.ps1`. Relevant local proof is skill/metadata/link/scenario validation. No product behavior changed and no prose-mirroring tests or duplicate full local product suite was added/run. Actual repository CI still must run both events and both OS jobs through upload; documentation is no exemption.

Final candidate validation: seven owned files and 28 local links/anchors pass the expanded checker; quick_validate passes. Explicit staged diff inspection covers all seven paths; `git diff --cached --check` exits 0. Only the four skill files and allowed B item/report/checkpoint are staged, with no predecessor or shared-policy changes.

## Bounded walkthroughs

These are author-run, no-external-mutation scenario walkthroughs of the instructions, not fresh-agent execution or new CI transport experiments. The Git cases additionally used the real disposable fixture described above; the CI/resume cases use synthetic observations and trace the prescribed actions.

| Scenario/input | Traced result and exact next action |
| --- | --- |
| Matching bound checkout/full packet | One batch matches; retain owned generated branch, record read index and begin only assigned work. Actual B startup and the fixture exercised this path. |
| Wrong remote/base/branch or unexpected user index | Fixture wrong-remote observation and staged `user.md` are retained byte-for-byte. Stop affected mutation, report expected versus observed identity/index and ask coordinator to reconcile; no reset/clean/switch or unrelated staging. A wrong base/branch follows the same compare-before-edit boundary, not a new branch inventory. |
| Old-head green and late old failure after new head | Synthetic current H-new versus event H-old: neither old success nor failure clears or re-repairs H-new. Dedupe by PR/head/run/attempt; inspect the declared H-new evidence only on supported event/reconciliation; any extra commit needs new proof. Reconfirm actual head after verification. |
| Missing Windows job, skipped upload, cancelled/neutral/inaccessible evidence | Synthetic partial check set cannot become an empty/green set even if parent says required checks passed. Record absent/unsuccessful identity and repository/workflow/access owner action; keep item owned waiting/blocked. No repeated snapshot, blind retry or handoff. |
| Ordinary failure versus infrastructure/scope blocker | Read exact logs before an in-scope repair, pass relevant local checks, push/link and re-enter the relay for the new SHA. For runner outage or out-of-scope CI change, preserve diagnostics, name owner/action/impact and continue independent work; no gate waiver or coordinator repair takeover. |
| Interrupted push/PR creation; checkpoint lacks final URL but actual PR exists | Compare actual branch/remote head and existing PR before any mutation; reuse observed PR, link if needed, update checkpoint. Do not repeat commit/push/create-PR just because the checkpoint's prior command was interrupted. No real duplicate PR was created in this walkthrough. |
| Waiting task ended; duplicate event or lost subscription on resume | Same item/thread/worktree can resume with explicit fresh-task lineage. Read actual state; consume an already-processed event once. Parent confirms actual watch readiness via one queue/register/yield/reconcile sequence only if re-arm is needed. Unknown subscription/delivery is a precise transport blocker; no assumed durability, scheduler or child watch. |

## Acceptance mapping and limits

R01/R10: entrypoint role/resource/secret boundaries and ordinary in-scope autonomy. R02/R03: complete packet, mandatory-once reads/relevant refresh, single prepared-checkout/branch policy and explicit push. R04: current scripts/pinned toolchain and relevant local/hosted proof distinctions. R05/R06/R07: scoped PR, current-head green-only ownership/repair, finite supported relay, nonterminal blockers. R08/R09: compact checkpoint and observed-side-effect reconciliation before resume. R11/R12: substantive evidence return and linked single authorities; no reusable model/live progress copies. C owns existing-policy/routing cleanup; D owns later independent behavioral evaluation.

Metadata/link checks do not prove that a fresh worker follows the skill, host restart recovery, durable/exactly-once messaging, universal T3/provider support or speedup. No independent review, human merge, release, package publication or deployment is asserted. A's reviewed mechanism supplies the bounded dependency; B does not repeat its controlled failure trial. B deliberately injects no failing test.

## Hosted contract and resume

Frozen set: **CI push AND pull_request**, EACH `verify (windows-latest)` and `verify (ubuntu-latest)` SUCCESS through `Verify` and `Upload packed tarball`, regardless of branch protection. Worker must inspect actual current PR head, workflow/event/run/attempt/job/step identities and required artifact/source mapping. PR merge-test source and PR-head identity stay distinct. Missing, pending, failed, skipped, cancelled, neutral, inaccessible or stale proof never passes.

Next worker action at this pre-push boundary: final owned scope/diff validation, conventional commit, explicit push to `origin HEAD:refs/heads/t3/fa4ebcc5`, create one B PR against `t3/85fcb290`, immediately link as the next tool call, then checkpoint actual full HEAD/PR and yield **WAITING_CI_RELAY**, not successful delivery. Parent next queues one readiness reconciliation, registers its watch and immediately yields; it relays readiness/current observations and subsequent actual events to this same worker. Worker independently verifies/repairs and returns green only after all declared current-head proof. Coordinator acceptance/review and human merge remain separate. Stop after B.
