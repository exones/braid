# Task E: consistent human reports and merge stopping gates

Status: partly proven. Date: 2026-11-04.
Backlog item: [E](../backlog/E-reporting-and-merge-gates.md). Checkout: `C:\worktrees\agento\t3-61a93ffc`. Branch: `t3/61a93ffc`. Integration HEAD before this delivery commit: `087dff46001b5353700dcf282e5e459b9f1f9530`.

One reporting contract now covers item briefings and pull requests, and a later item stops until a required human merge is real. This branch also carries accepted B and C onto current main. The product, tests, CI workflows, and other epics are unchanged. Hosted proof and independent review have not happened yet.

## What changed

- `epics/report-format.md` is the only reporting procedure. Item reports and user briefings open with the current situation, then What changed, Why, Left for you, and Technical record.
- Coordinator and worker skills, delivery and delegation references, the handoff guide, assignment templates, AGENTS, Agile workflow, and decisions point at that contract instead of keeping a second briefing.
- Pull requests use the same human account plus a technical continuation record. `.github/PULL_REQUEST_TEMPLATE.md` is an authoring aid and is not required when `gh` supplies the body from a file.
- The old allowance to keep stacking on local acceptance is replaced by an explicit human merge stop.
- Pinned main, the B feature-base merge, and the C feature-base merge are integrated on this branch. Existing #9 and #10 descriptions were already in the new form; their source heads were not edited again.

## Why

People were reading hashes before they could see what an item did, and locally accepted work could pile up without a merge. One contract keeps the coordinator's user account aligned with worker reports and pull requests. Green CI and a finished review still are not a merge, so D does not start from this delivery.

## Left for you

No user action is needed for this local result. This worker owns the push, the new main pull request, and current-head CI repair. After independently verified green, the coordinator accepts the result and assigns a new review, `E-reporting-and-merge-gates-review-001`. The human merge of that pull request comes after the review. D stays stopped. Nothing is published.

## Technical record

### Read index

Read at startup, before integration: AGENTS, README, decisions, Agile workflow, epic 003, current checkpoint, E backlog, E assignment, report format, concise C acceptance and C review, A and B acceptance summaries, both skills, the assignment packet, delivery, delegation, the T3 continuation reference, and the handoff guide. Cursor skill-creator guidance was read for skill shape; the validator used below is the same `quick_validate.py` path recorded by C. CI workflow job names were read from the merged `.github/workflows/ci.yml`. Historical reports were not replayed as instructions.

### Source dispositions

| Authority | Disposition |
| --- | --- |
| `epics/report-format.md` | Replaced the old outline with the human account, four triggers, pull-request record, checkpoint role, and review handoff. |
| Coordinator skill | Removed the competing half-page procedure. It now follows the report contract, translates child evidence, and stops before a dependent item that still needs a merge. |
| `references/delivery.md` | Pull-request bodies follow the report contract. The local-acceptance stack sentence is now [Human merge stop](../../../../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop). Green-only handoff stays in Review and Done. |
| `references/delegation.md` | A substantive child return is inspected and translated. The child packet is not the user briefing. Dispatch does not cross the merge stop. |
| Worker skill and packet | Reports and pull-request bodies cite the one contract. The worker does not start a successor or treat an unmerged prerequisite as merged. |
| Backlog and review templates, handoff guide, AGENTS, Agile | Consistency links only. AGENTS provider-profile paragraph is unchanged from reviewed C. |
| `docs/decisions.md` | Added D22 and the 2026-11-04 approval log. Kept D11, D21, and main's OIDC log line. |
| `.github/PULL_REQUEST_TEMPLATE.md` | New authoring aid. |
| Epic `epic.md` and `checkpoints/current.md` | Not edited. Proposed status is below. |

### Integration

Startup matched the packet: clean tree and index, origin `https://github.com/exones/braid.git`, generated branch `t3/61a93ffc`, full HEAD `f99de9d9b9e7d27d8907315dc7a10b2bce5d7608`. No fetch, branch inventory, reset, rebase, or force-push.

| Input | Full commit | Action |
| --- | --- | --- |
| Coordinator context | `f99de9d9b9e7d27d8907315dc7a10b2bce5d7608` | Starting HEAD. |
| B reviewed head | `01838178e67e4aa7fdb382587d15527c8cd3402b` | Already an ancestor. Not merged again. |
| Current main | `a2120bfa084a32212a780a0fdc095c38d8869ef5` | `git merge --no-ff --no-edit`. Result `b83ef41a0c68115604a93d52e67155cd438f0aff`. `docs/decisions.md` auto-merged. |
| B human merge | `71071ef4bbf380213a5f5cd1b74eb458016b14e3` | `git merge --no-ff --no-edit`. Result `7783cdacf90510589b940f9ce2705250c4044486`. No file changes; B content was already present. |
| C human merge | `4e7e976a4030f23d63b846f156a307a7b70fc870` | `git merge --no-ff --no-edit`. Result `087dff46001b5353700dcf282e5e459b9f1f9530`. |

C merge conflicts were add/add on `reports/C.md` and `checkpoints/C.md` only. Kept the coordinator-context bytes. SHA-256 still matches the retained supplements: report `29487ccfb1bf4865c230d0a53a93a6b25a0428738254c4ce95b80fb31d75caf4`, checkpoint `b1d3ce7e81be16627e259cd597c59ea004278929734a9138babcd05b5a38e527`. Review report and checkpoint remain `f851b25a3b8293fd30f1d0142125741933ea71a26002fd99c57e4dca3154e6e0` and `17d6b15dadc9bbfa8abb50fbaa494cec351487c4472131ac83900e3cdf4f73b1`. Epic, current checkpoint, and E assignment bytes match `f99de9d9`. The C backlog auto-merge kept the newer coordinator status line and C's completed checklist.

Policy files match reviewed C `6c3fcc112a344daed36b8d782426d65509ff35db` except `docs/decisions.md`, which also keeps main's trusted-publishing log line, and the E edits in this commit. `git diff a2120bfa084a32212a780a0fdc095c38d8869ef5 -- README.md package.json package-lock.json scripts test src .github/workflows epics/braid/001-seed epics/braid/002-trusted-publish` is empty. The new pull-request template is the only `.github` addition and is not a workflow change.

### Existing pull requests

Read once. No description edit.

| PR | State | Head | Merge |
| --- | --- | --- | --- |
| https://github.com/exones/braid/pull/9 | MERGED 2026-11-04T12:21:39Z into `t3/85fcb290` | `01838178e67e4aa7fdb382587d15527c8cd3402b` | `71071ef4bbf380213a5f5cd1b74eb458016b14e3` |
| https://github.com/exones/braid/pull/10 | MERGED 2026-11-04T12:22:05Z into `t3/fa4ebcc5` | `6c3fcc112a344daed36b8d782426d65509ff35db` | `4e7e976a4030f23d63b846f156a307a7b70fc870` |

Both bodies have the opening, What changed, Why, Left for you, and Technical record, and they say the feature-base merges are not merges to main. Those old runs remain old-base evidence.

### Local proof

Dirty probe at integration `087dff46`. Not a clean committed-candidate claim. Commands from `C:\worktrees\agento\t3-61a93ffc`.

| Check | Command | Result |
| --- | --- | --- |
| Skill validators | `python -X utf8 C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py` on `braid-coordinate` and `braid-worker` | Both exit 0, `Skill is valid!` |
| Links and anchors | Python check of markdown links and heading anchors in the 16 changed Markdown files | 103 local links, 0 missing |
| Whitespace | `git diff --check` | Exit 0 |
| Main bytes | `git diff --stat` of product, workflow, seed, and trusted-publish paths against `a2120bf` | Empty |
| Repository Verify | `pwsh -NoProfile -File .\scripts\Verify.ps1` after pinned Node install and `npm ci` | Exit 0. Node v26.13.0, npm 11.20.0, pwsh 7.6.9. OIDC and install-policy fixtures passed. 40 tests, 3 suites, 40 pass, 0 fail. |
| Packed install | Same Verify run | Dirty probe, `candidate False`, source revision `087dff46001b5353700dcf282e5e459b9f1f9530`, tarball SHA-256 `3f35c881253ed9e651bce8c591d61fb11024495ac757d6612682a8d12930fc04` |

Toolchain archive SHA-256 `dcc60d59a0746999f99064a01c020445d54d84228c691cdbf25b49ac3b59150a`. No gate was weakened. No new product test was added.

### Bounded scenario traces

These are authored consistency checks against the edited policy. They are not D's fresh-agent proof, a live failure injection, or automatic enforcement.

| Situation | Expected account | State and action |
| --- | --- | --- |
| Worker returns GREEN while review is pending | One item-outcome report: what landed, CI is green, review has not started. | Left for you: no user action. Next owner is the coordinator, who assigns the named review. Not Done and not a merge. |
| Review returns with no findings | One report combining the child return and the review milestone. | Say no findings. User action starts only when the coordinator has triaged and the remaining gate is the human merge. Not Done. |
| Review returns with findings | One translated report of what was found. | Worker-fixable findings stay with the worker. Left for you names a decision only when the user actually owns it. Not Done. |
| User-owned blocker mid-item, with partial work | One blocker report. What changed includes the partial work. | Left for you names the decision, the impact of waiting, a recommendation, and what can continue. Not a successful delivery. |
| Ordinary CI waiting or a duplicate same-head notice | Short Done / You / Next only. | Ownership stays with the worker. Not an item briefing, not green, and not Done. |
| Overlapping triggers, such as a no-findings review that also opens the merge gate | One report, not two. | The opening says the new state. Left for you contains the single requested merge. |
| Green and reviewed, but unmerged, and a dependent item is next | One milestone report naming the exact human merge. | Checkpoint and stop. Do not dispatch the dependent item. Do not call CI or review a merge. |
| The required merge is verified | One resumption report after the merge commit and dependency facts are checked. | Dispatch only then. A changed base gets a safe revalidation first. Old proof stays old-base evidence. |
| Head or base changes after a green run | Do not reuse the old conclusion. | The worker proves the new head. The coordinator does not accept stale evidence or take over the repair. |
| A person and a later agent read the same PR | The human sections support the merge decision. Technical record has item links, head, base, checks, artifacts, source, review, limits, and next action. | `--body-file` still includes that account. A description edit does not change heads or prove a new base. |

### Proposed shared status

Coordinator owns `epic.md` and `checkpoints/current.md`. Proposed updates, not applied here:

- E is in progress through current-head CI. After green, status is in review, ready for coordinator acceptance and new independent pass `E-reporting-and-merge-gates-review-001`. Do not mark Done.
- Record this pull request, its full head, and the distinction that #9 and #10 merged into feature branches. This pull request is the main delivery of that accepted work plus E.
- Leave D in backlog until E's human merge is verified.
- The dispatch checklist item is already satisfied by this assignment. The worker checklist stays open on the checked blob until green; a follow-up commit only to tick it would replace the proved head.

### Limits and next action

This commit does not contain the pull request URL. The post-push supplement records the URL, full head, and frozen check set without another commit. Frozen hosted set for that head: workflow CI on push and pull_request, Windows and Ubuntu verify jobs (four), successful Verify and Upload packed tarball steps, required artifact ZIP and tarball digests, clean provenance, and the pull-request merge-test source mapped to this head and `main`. Branch protection cannot shrink that set. Prior B and C runs do not prove it.

No measured speedup, fresh-agent adherence, restart durability, or exactly-once delivery is claimed. No release, publication, or remote merge was performed.

Exact next action at this blob: push `origin HEAD:refs/heads/t3/61a93ffc`, open one pull request against `main`, and link it on the next host call. Then return nonterminal `WAITING_CI_RELAY`.
