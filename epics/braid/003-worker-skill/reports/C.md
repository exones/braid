# Task C: integrate worker assignments and singular policy ownership

Status: **GREEN worker handoff**, ready for coordinator acceptance/independent review; not Done/merged/released. Date: 2026-11-04. The earlier WAITING_CI_RELAY observations below are history, superseded by final independent proof.
Backlog: [C-assignment-integration](../backlog/C-assignment-integration.md).
Actual root `C:\worktrees\agento\t3-114623ca`; retained branch `t3/114623ca`; input HEAD `af6e5d49232c3cbdf69ea5e557316483719598c5`. Current full HEAD **`6c3fcc112a344daed36b8d782426d65509ff35db`**, [PR #10](https://github.com/exones/braid/pull/10), OPEN/base `t3/fa4ebcc5`. Coordinator owns epic/current/shared gates and review scheduling; worker owns C repair/verification until green handoff. This report/checkpoint contain unstaged post-push supplements, distinct from checked Git blobs; no self-SHA evidence push.

## Outcome and changes

Normal implementation assignments now route through [braid-worker](../../../../.agents/skills/braid-worker/SKILL.md) and its [canonical packet](../../../../.agents/skills/braid-worker/assets/assignment-packet.md). A coordinator or manual operator supplies current facts rather than maintaining a second execution handbook. Goal planning, assigned execution and independent review have separate entrypoints. Assigned epic/checkpoint takes precedence over the historical global seed pointer.

The coordinator guide links worker execution/resume mechanics and specifies its own dispatch/acceptance responsibilities. Delegation retains host capability/isolation/next/cancellation mechanics, commits required isolated context and names shared dirty/index ownership. The shared delivery authority now requires independently verified green on the entire declared current-head set; waiting/failure/blocker returns retain worker ownership. Coordinator handback inspection uses the actual returned root/branch/full SHA rather than blindly checking out an occupied branch. Human merge and independent review remain separate.

Changed authorities: AGENTS routing; coordinator SKILL/delegation/delivery; handoff guide; necessary Agile packet/readiness/flow links; decisions D21 and dated adoption rationale. C backlog delivery fields/report/checkpoint hold item evidence. Report format, worker skill/packet/host reference, README, all historical evidence and coordinator-owned status remain unchanged. No product, tests, CI, package, controller/schema, publishing or infrastructure change. No new behavioral evaluation or repeat CI experiment.

## Source disposition

This reconciles every row in the approved [instruction ownership/migration inventory](planning.md#instruction-ownership-and-migration). “Moved” means the maintained operational destination is B's existing worker skill, not newly copied prose in C.

| Source and former responsibility | Disposition | Maintained destination / C action |
| --- | --- | --- |
| AGENTS required reads, provider profile, WIP, role/resource/secret authority, project constraints | retained/shared | AGENTS remains authoritative; routing added around existing policy. |
| AGENTS assigned-worker entrypoint | reference | Link worker SKILL/packet and distinguish review/planning; assigned epic override explicit. |
| Coordinator SKILL worker duties/no-builder paragraph | moved + reference | Execution/startup/proof/PR/wait/resume/checkpoint mechanics already in worker SKILL; replace embedded duties with canonical packet and worker link. |
| Coordinator SKILL goal analysis, readiness, dispatch, acceptance, shared status and user briefing | retained/shared | Keep coordinator duties/profile dispatch paragraph; add complete-packet and safe actual-returned-root acceptance boundary. |
| Delegation capability/provider/options, isolation/context, ownership, next/cancellation/review assignment | retained/shared | Host dispatch mechanics stay here; committed-context/shared-index distinctions explicit. |
| Delegation embedded worker handbook and finished-check handoff | moved + reference | Canonical packet/worker lifecycle and conditional T3 reference; no competing duties template. |
| Delivery commit/PR/history/review/merge/README invariant | retained/shared | Keep authority/location; exact head/source evidence and approved green-only invariant replace successful pass-or-fail handoff. |
| Delivery operational worker wait/repair/resume | moved + reference | Worker SKILL operational lifecycle; finite T3 reference supplies host adapter. |
| Delivery running-seed-specific C/A/B instruction | historical | Remove live assignment from reusable policy; historical seed evidence stays untouched in its epic. General explicit dependency ordering/history-preservation rule retained. |
| Handoff guide incomplete manual worker prompt | reference | Remove competing template and link the canonical packet; retain skill-selection/actual-state navigation mechanics. |
| Agile IDs/review indexing/Ready/Done/flow/provider ownership | retained/shared | Only packet/readiness/entrypoint and green-only delivery links added; no new persisted statuses or review conventions. |
| Decisions project requirements/profile rationale | retained/shared | Preserve historical rows/logs; add adopted worker routing/green decision with date and reason. |
| Report-format substantive reports/checkpoints/briefings | retained/shared + reference | No edit needed; existing links remain authoritative. |
| Task packet/backlog dependency/base/ownership/gates/output facts | retained/shared | One canonical placeholder asset; current facts remain assigned packet/backlog and coordinator-owned current status. |
| Original plan, ignored inspiration and historical reports/settings/IDs | historical | Supporting evidence only; no operational authority/imported permissions, rewrites or new reads of ignored sources. |

## Preservation evidence and boundaries

Four input user edits are preserved verbatim, including rationale: AGENTS authoritative provider paragraph; coordinator “Before each implementation assignment” dispatch paragraph; Agile “Provider/model/settings follow” paragraph; decisions D11 and dated profile-change log. The validation checks exact text equality against input Git blobs and records SHA-256 of each preserved region. No live provider/model/options are added to reusable skills/templates. The user's Sol High exception is assignment-local; global profile is unchanged.

Preserved-region SHA-256 (UTF-8, repository-normalized LF): AGENTS `a59b8710c2ec04cebf5d56f544df2ebe0f0368d3599c56fa1baf1ef2ab7a1dab`; coordinator dispatch `7fad71021d40e29e18c68bbe47448e78aca4d5cd3d887f0d4783a579e75ac58c`; Agile ownership `85afcabf010ee64e48d41a5faf1fdce0d9ad8bed75be1b4d7d5995b400c675f1`; decisions D11 `faee03667beb90e33451805e839f6b5f1157e8054c5e6151208ade25493579f4`; dated decisions rationale `ce853dc2d641ace76ef6782a0fd06485248d985c385f49b3bc6eb717a30e67b6`. Each equals its input Git region; unchanged historical files follow from the exact changed-path allowlist.

Startup batch returned root/branch/full HEAD/status/index/origin matching the packet. No existing C output/interrupted mutation. No branch inventory/fetch/history reconstruction, other-worktree edits, switch/reset/clean/rebase/force push. Exact `git ls-remote --heads origin refs/heads/t3/fa4ebcc5 refs/heads/t3/114623ca` returned B base `01838178e67e4aa7fdb382587d15527c8cd3402b` and no C remote branch. `gh pr list --repo exones/braid --head t3/114623ca --json number,url,state,headRefOid,baseRefName` returned `[]`; B PR read confirmed OPEN/no merge at that accepted head. Commands exited 0.

A accepted `c86bc3990a63a5b18d582782e54f9a3cffa18928` ([acceptance](A-acceptance.md)) and B accepted `01838178e67e4aa7fdb382587d15527c8cd3402b` ([acceptance](B-acceptance.md)) each retain no-findings independent pass 001. Both are technical acceptance, not Done/merged. C targets B branch `t3/fa4ebcc5`; human merge order #6 -> #8 -> #9 -> C. Context commit intentionally stays in C ancestry/diff. No base transition is authorized or needed.

Latest coordinator-supplied authoritative gh update supersedes the earlier merge observations: #6 MERGED `2026-11-04T11:48:57Z`, merge `762f9712bcc90f24016ce355df19943860e66d2e`; #8 MERGED `2026-11-04T11:49:29Z`, merge `a2120bfa084a32212a780a0fdc095c38d8869ef5`. #9 remains unmerged. These are supplied confirmations, not a new worker query. User requires the coordinator to stop at necessary human merge boundaries before successors; already-running C alone continues on its assigned base/checkout. No fetch/rebase/retarget/switch/merge is authorized by that notice, and none is needed here. No D dispatch is proposed by this worker.

## Local proof

Commands run from the actual root above. Input revision identifies pre-commit probes; final delivery revision will be recorded post-push separately from checked blobs. Ignored `.tools/C-validate.py` is a bounded inspection aid, not committed automation or a product regression suite.

| Check | Exact command / method | Result / scope |
| --- | --- | --- |
| Checkout/ownership | `Get-Location`; `git rev-parse --show-toplevel`; `git branch --show-current`; `git rev-parse HEAD`; `git status --short`; `git remote get-url origin`; `git diff --cached --stat` | Exit 0; clean initial tree/index, expected bound identity/origin. |
| Pins/dependencies | `pwsh -NoProfile -File ./scripts/Install-NodeToolchain.ps1`; prepend returned directory to PATH; `node --version`; `npm --version`; `npm ci` | Exit 0; archive SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a` verified against official and pinned values; Node v26.13.0/npm 11.20.0; four packages installed, zero vulnerabilities. |
| Structure/links/profile/scope/context | `python -X utf8 .tools/C-validate.py` | Exit 0 initially 17 Markdown files/90 resolving local links and heading anchors; final evidence/backlog expansion 92 links. Discovery/packet fields, five exact preserved profile regions, ten-path ownership allowlist, unchanged shared/history authority, 21 required input Git objects pass. |
| Skill validators | `python -X utf8 C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/braid-coordinate`; same command for `.agents/skills/braid-worker` | Both exit 0, `Skill is valid!`. UTF-8 mode avoids Windows decoding ambiguity. |
| Repository Verify | `pwsh -NoProfile -File ./scripts/Verify.ps1 *> .tools/C-verify.log` | Exit 0: install-policy negative/positive fixtures, typecheck/build, 40 product tests / 3 suites / 40 pass / 0 fail, external exact-tarball installed `braid.ps1` proof. Existing gates unchanged. |
| Installed artifact | `Get-Content artifacts/package/exones-braid-0.1.0.provenance.json`; `Get-FileHash -Algorithm SHA256 artifacts/package/exones-braid-0.1.0.tgz` | Probe source input `af6e5d49232c3cbdf69ea5e557316483719598c5`, dirty=true/candidate=false, installOutsideCheckout=true. Tarball SHA-256 `491f2aa7de5c303f302f92e4fa8d5b1c06fb951c8af6f86fb136cdc6f4b9adb0` matches provenance; no clean committed-candidate claim. |
| Diff/index | `git diff --check`; `git diff --cached --check`; `git diff --cached --stat`; `git diff --cached --name-only`; `git status --short` | All exit 0. Full seven-policy-file diff reviewed; exact ten owned staged paths including C backlog/report/checkpoint; no unrelated entries. Restage only updated owned evidence after merge notice. |

Versions observed: Python 3.11.9, gh 2.103.3, PowerShell 7.6.9. README has stale private/package progress statements relative to actual scripts/package; scripts/configuration govern proof. This unrelated documentation cleanup is outside C.

## Bounded consistency walkthroughs

These are authored policy traces, not fresh-agent behavioral evidence, D evaluation, new A trial or executed CI failure injection.

| Input | Traced policy path / result |
| --- | --- |
| Fresh coordinator, assigned item, independent reviewer or routine question | AGENTS selects coordinator, worker+packet, separate review conventions or neither workflow respectively. Coordinator dispatch reads authoritative profile; manual guide selects the same packet. No copied handbook/model selection. |
| Isolated checkout from exact context | Delegation verifies required committed inputs; packet supplies initial SHA/origin/base/dependencies/gates/ownership; host returns actual binding; worker performs bounded startup. Current C context object checks establish availability, not dependency merge. |
| Explicit shared checkout with staged user file and dirty worker file | Packet names owners/exclusions/allowed operations. Shared authority prohibits concurrent index/branch mutations; worker preserves mismatch and stops only affected actions. No clean/reset/stage-all requirement or inherited dirty-parent context. Reasoned trace, no destructive fixture needed. |
| Worker returns a branch occupied in its own worktree | Coordinator uses returned root with `git -C`, reconciles full SHA/PR/current evidence at safe boundary; no blind checkout or assumption about guessed path. |
| Pending/failure/infrastructure blocker or missing upload | Shared green-only rule and worker lifecycle retain repair/verification ownership; exact owner/action/impact is nonterminal escalation. Parent transports real observations via finite relay; no coordinator repair takeover, child watch/polling or empty-check success. |
| Old-head green/event, later commit or interruption during PR creation | Worker reconciles actual effects/reuses PR, rejects stale proof, requests supported transport recovery if needed; new head needs complete declared proof. No duplicate PR or assumed live subscription. |
| All declared current-head checks independently green | Reconfirm head, return actual root/branch/full SHA/PR and evidence; coordinator acceptance/new independent review/human merge remain later. No self-awarded Done/successor. |

## Acceptance and approved rules

AC1: source dispositions above preserve shared authority, replace duplicate worker lifecycle/templates and remove active failed/pending-success language. AC2: same packet covers task/skill/context/dependencies/base/branch/remote/ownership/gates/wait/outputs/return; dispatch-time AGENTS profile retained. AC3: isolated committed-context and explicit shared dirty/index distinctions documented/structurally checked. AC4: actual returned checkout/head inspection and green-only same-worker repair ownership now explicit in coordinator routes. AC5: structure/routing/link/skill validation passes; full tracked policy diff reviewed, preservation constrained by allowlist and exact-region checks. Final index review remains before commit; current C hosted proof/independent review are not yet established.

| Rules | Integration evidence |
| --- | --- |
| R01, R10 | Distinct role routes, narrow C ownership, no agent/successor/review/merge powers; shared authorities retained. |
| R02, R03 | Canonical complete packet, committed input checks, bounded actual binding verification, one generated branch and explicit owned push. |
| R04 | Read actual scripts/pins, structural/routing/link/walkthrough proof and required Verify; no prose-mirroring product tests/gate weakening. |
| R05, R06 | Shared scoped PR/head/source invariant, full frozen set and green-only handoff; worker retains repair; host transport referenced. |
| R07 | Exact nonsecret blocker owner/action/impact, nonterminal ownership rather than failing delivery. |
| R08, R09 | Worker checkpoint/read index and actual-effect reconciliation before resume; coordinator acceptance uses returned facts and safe boundary. |
| R11, R12 | Substantive shared report authority, proposed shared updates, singular execution skill/packet and maintained policy links; source inventory disposition complete. |

## Hosted contract and posted waiting boundary (historical)

Frozen per-head set: workflow **CI**, BOTH **push** and **pull_request**, EACH Windows+Ubuntu verify (four jobs), successful **Verify** and **Upload packed tarball**, all four expected artifacts. Independently inspect run/event/attempt/head/jobs/steps, authoritative ZIP SHA-256, included tarball digest/clean provenance, push source mapping and PR merge-test ordered base/head parents, then reconfirm PR head. Rollup/protection/parent READY alone never accepts checks. New commits invalidate prior proof.

No C hosted green/artifact proof, independent review, merge/release or behavioral evaluation is asserted yet. T3 continuation uses accepted finite parent relay only; parent owns registration/readiness/event transport/task lineage, worker retains diagnosis/repair/verification. No surviving subscription/task assumed. Pending/blocker return is not successful delivery.

Delivery operations all exit 0: final structural validation (17 files/92 links), scoped index/whitespace checks, `git commit -m 'docs(skills): integrate worker assignment and green handoff routing'` with `Refs: BRAID-003/C`; exact-base remote comparison; `git push origin HEAD:refs/heads/t3/114623ca`; `gh pr create --repo exones/braid --head t3/114623ca --base t3/fa4ebcc5 --title 'docs(skills): integrate worker assignment and green handoff routing' --body-file .tools/C-pr-body.md`. The **immediately next tool call** was successful host `link_pull_request({url:'https://github.com/exones/braid/pull/10'})`, `alreadyLinked:false`. Exactly ten owned paths committed; input context remains in ancestry. Initial post-push tree/index clean.

One post-link, pre-registration observation (`gh pr view 10 --repo exones/braid --json url,state,headRefName,headRefOid,baseRefName,baseRefOid,statusCheckRollup,reviews,reviewDecision`, exit 0) independently confirms actual PR head matches local full HEAD above, base is accepted B `01838178e67e4aa7fdb382587d15527c8cd3402b`, owned branch, OPEN, reviews/reviewDecision empty. Four CI jobs **IN_PROGRESS**, conclusions empty: run [41824339450](https://github.com/exones/braid/actions/runs/41824339450), Windows `126555116566`, Ubuntu `126555117253`; run [41824347885](https://github.com/exones/braid/actions/runs/41824347885), Windows `126555144738`, Ubuntu `126555145145`. Event/attempt, steps/uploads, artifact digests and source relationships have not yet been independently inspected. This snapshot is not registration/readiness, a watched event or green proof.

No worker process/watch/scheduler or task lineage/readiness generation supplied; parent registration effects are unknown and must be reconciled, not assumed. Only this report and C checkpoint are modified/unstaged as supplements, index empty. Do not commit merely to embed current SHA/PR; that would invalidate hosted proof. Required local gates already passed; do not repeat expensive Verify without a new relevant concern.

Exact next action: return **WAITING_CI_RELAY**. Parent arranges/reconciles registration plus ONE readiness reconciliation per finite protocol and transports READY/actual current-head observations/events to this SAME worker with explicit task/run lineage. Worker then independently inspects all frozen current-head checks/logs/artifacts/source mapping and reconfirms head; worker diagnoses/repairs in-scope failures and push/links/waits for new-head proof. Coordinator proposal: record C in progress/waiting only. After independently verified GREEN, coordinator acceptance/NEW `C-assignment-integration-review-001` and human merge remain later, with the user's stop-at-necessary-merge boundary before successors. Stop after C; no D.

## Final independent current-head GREEN proof

Received **PR10-ARM-001 READY**, continuing the same C item/thread/worktree after ordinal 2's WAITING_CI_RELAY return. Parent supplied its actual registration response `watching:true, wasWatching:false`, followed by exactly ONE authoritative post-registration snapshot of already-completed jobs. This establishes supplied readiness/reconciliation, **not an actual watched-success notification** and not worker artifact/head proof. Parent owns subscription/task/run transport and teardown. Fresh task lineage is allowed; the continuation supplies prior ordinal 2 but no concrete new task/run IDs, so none are invented or described as still running.

Before mutation, worker refreshed current assignment/policy/checkpoint and independently reconciled actual root `C:\worktrees\agento\t3-114623ca`, branch `t3/114623ca`, full HEAD **`6c3fcc112a344daed36b8d782426d65509ff35db`**, origin, two owned unstaged evidence supplements and empty index. Existing push/PR/link effects were complete; no repeated Git mutation, base/retarget change, polling/watch/queue or new trial was needed.

Verification command: `python -X utf8 .tools/C-hosted-verify.py` (exit 0). This ignored, bounded read-only proof aid invokes structured `gh pr view 10 --repo exones/braid --json ...` and `gh api repos/exones/braid/actions/runs/<run>`, `/jobs?per_page=100`, `/artifacts?per_page=100`; all native calls/JSON assertions pass. Actual workflow **CI**, path `.github/workflows/ci.yml`, events **push** and **pull_request**, attempt **1** each; all run/job head identities exactly C. Each job completed SUCCESS, including **Verify step 6** and **Upload packed tarball step 7**. All four actual job logs were downloaded with `gh api .../actions/jobs/<job>/logs --allow-escape-sequences`, sanitized and inspected: each shows 40 tests / pass 40 / fail 0 plus clean candidate external installed-package proof and matching source/digest.

| Event / attempt-1 run | Windows job / artifact | Ubuntu job / artifact |
| --- | --- | --- |
| [push 41824339450](https://github.com/exones/braid/actions/runs/41824339450) | [126555116566](https://github.com/exones/braid/actions/runs/41824339450/job/126555116566) / [13317644249](https://github.com/exones/braid/actions/runs/41824339450/artifacts/13317644249) | [126555117253](https://github.com/exones/braid/actions/runs/41824339450/job/126555117253) / [13319110325](https://github.com/exones/braid/actions/runs/41824339450/artifacts/13319110325) |
| [pull_request 41824347885](https://github.com/exones/braid/actions/runs/41824347885) | [126555144738](https://github.com/exones/braid/actions/runs/41824347885/job/126555144738) / [13319325240](https://github.com/exones/braid/actions/runs/41824347885/artifacts/13319325240) | [126555145145](https://github.com/exones/braid/actions/runs/41824347885/job/126555145145) / [13318029352](https://github.com/exones/braid/actions/runs/41824347885/artifacts/13318029352) |

Each run exposes exactly the two expected, non-expired named OS artifacts. Worker downloads authoritative ZIP bytes via `gh api .../actions/artifacts/<id>/zip`, hashes them against artifact-service metadata, reads their three members without generic extraction, and separately hashes the tarball against sibling provenance. All assertions pass:

| Artifact | Independently verified ZIP SHA-256 |
| --- | --- |
| push Windows 13317644249 | `de9be20938bd7ddd6afa3207d60439de7efad4868932c360623b7074055d335b` |
| push Ubuntu 13319110325 | `4fcd8c97f4c96ffe607ae05adc06efe683b61a1f819692fe6a0f24e385b11c20` |
| PR Windows 13319325240 | `d33a608f88ed0b4dc9ba5c7ab64e23fac27346a0a776b27374629dba8d8f38a9` |
| PR Ubuntu 13318029352 | `29cf8c4056fec1efca7610aebeefd0a272719973b340d0b58839011398afbe88` |

Tarball SHA-256 in both events: Windows `67f88e4866005e691af8ee774afe90b5b69650fa01fcd53abe85e70ff9127351`; Ubuntu `491f2aa7de5c303f302f92e4fa8d5b1c06fb951c8af6f86fb136cdc6f4b9adb0`. These differ from ZIP digests; observed equality within an OS is not a reproducibility guarantee. Every provenance record: `candidate:true`, `worktreeDirty:false`, `installOutsideCheckout:true`, executable `braid`, package `@exones/braid` 0.1.0, Node v26.13.0, npm 11.20.0, PowerShell 7.6.9, `released:false`, registry publication not performed.

Push provenance `sourceRevision/githubSha` equals full C head with `refs/heads/t3/114623ca` and empty PR-head field. PR provenance `sourceRevision/githubSha` equals merge-test **`0a5a63f892174d9c7a400de25b7ed9bbb777df8f`**, ref `refs/pull/10/merge`, `pullRequestHeadSha` equals full C head. `gh api repos/exones/braid/git/commits/0a5a63f892174d9c7a400de25b7ed9bbb777df8f` independently confirms ordered parents accepted B **`01838178e67e4aa7fdb382587d15527c8cd3402b`** and C **`6c3fcc112a344daed36b8d782426d65509ff35db`**. All job logs agree with their respective provenance source. PR source is kept distinct from PR head.

Ignored retained proof: `.tools/C-hosted/{push,pull_request}/` contains authoritative metadata/ZIPs/selected tarballs/provenance/sanitized job logs/PR merge-source records; `.tools/C-hosted/verified-summary.json` records assertions and identities; `pr-before.json`/`pr-after.json` confirm head/base. Actual PR head was independently reconfirmed after artifact/source verification, unchanged and matching local HEAD, expected base, OPEN, reviews/reviewDecision empty. Final post-metadata head/scope/supplement check is recorded at handback. No failure/repair/rerun/extra commit/push or expensive local gate repetition needed.

Only C report/checkpoint are dirty/unstaged post-push supplements, index empty. They are **not** the checked candidate blobs. Parent registration is supplied as active; **teardown has not been observed and must not be claimed complete**. No worker process/watch/scheduler in flight, unresolved implementation blocker or further C mutation required. Local source-disposition/preservation/packet/routing proof plus current-head hosted proof support all five C criteria at integration scope; independent review remains later.

Exact next coordinator action: retain these final supplements/identities, record the exact green C head and proposed In Review gate state, tear down/record its PR10 watch, perform coordinator acceptance and assign NEW `C-assignment-integration-review-001` against this candidate plus final supplement hashes. Human merge remains separate; #9 is still the supplied unmerged dependency and the user requires stopping at necessary human merge boundaries before successors. No D or other successor is launched. This worker stops after C.

Limits: structural checks/authored consistency walkthroughs and current-head repository CI do not prove D's fresh-agent behavior, speedup, arbitrary restart/watch durability, exactly-once messaging or cross-provider support. A's bounded transport evidence is reused, not rerun. Hosted artifacts can expire and ignored local proof can be lost; preserve portable IDs/digests and supplements. No independent approval, formal GitHub review, merge, release, publication or deployment is asserted.

Final handback check: `gh pr edit 10 --repo exones/braid --body-file .tools/C-pr-body.md` exited 0, recording final run/source proof without a head change. A bounded `python -X utf8 -` read-only assertion batch then reconfirmed local AND actual remote owned branch AND PR full head identical to C, base unchanged, four successful rollup jobs, OPEN/no reviews, exact ten-path candidate, parent=input context, only the two unstaged evidence supplements and empty index. All commands exited 0; `git diff --check` and final structural/link/profile/packet/scope validation pass. `.tools/C-hosted/handoff-observation.json` retains final metadata. Supplement SHA-256 identities are returned separately; do not embed a document's own hash or push these bytes to the checked candidate merely for self-reference. Parent teardown still not observed at worker handback.
