# E coordinator assignment and prepared integration inputs

Date: 2026-11-04. User explicitly approved `$braid-coordinate go BRAID-003 / E` after clarifying report triggers. This is the committed coordinator packet, not the worker's E delivery report.

## Task and context

Execute only [E](../backlog/E-reporting-and-merge-gates.md) using [braid-worker](../../../../.agents/skills/braid-worker/SKILL.md) and its canonical packet. Implement shared human report triggers/form, human-plus-technical PR bodies/template and required human merge stopping gates. E's backlog contains the exact approved scope, examples and acceptance criteria. No D or agent launch.

Read AGENTS/README/decisions/Agile, assigned epic/current/E, current report guidance, relevant worker/coordinator skills/packet/delivery/delegation/T3 reference; concise [C acceptance](C-acceptance.md) and [independent review](reviews/C/C-assignment-integration-review-001.md), plus A/B acceptance as dependency summaries. Current coordinator input initially predates C's policy commit; C's exact reviewed policy is committed at `6c3fcc112a344daed36b8d782426d65509ff35db`. Integrate the named commits below before implementing E, then refresh affected actual policy files. Use final retained reports/checkpoints from committed coordinator context, not older incoming candidate blobs. No parent transcript, dirty parent or ignored inspiration dependency. Record a small read index; load detailed history only to resolve a specific mismatch.

## Exact Git contract

T3 creates/binds one isolated checkout from the full coordinator context SHA supplied in the dispatch. Expected initial tree/index clean, origin `https://github.com/exones/braid.git`. Keep the generated owned branch; record actual root/branch/full HEAD in one bounded startup batch. No shell-created worktree or guessed path. Explicit push `git push origin HEAD:refs/heads/<actual-owned-branch>`. New E PR base `main`; no existing E PR.

All integration inputs were fetched explicitly by coordinator and are available as Git objects; no routine fetch/branch inventory/history discovery is needed:

| Input | Full commit | Actual role |
| --- | --- | --- |
| current main | `a2120bfa084a32212a780a0fdc095c38d8869ef5` | Preserve all accepted main content, including unrelated product/CI/epic002 history absent from the old worker branch. |
| B reviewed head | `01838178e67e4aa7fdb382587d15527c8cd3402b` | Already an ancestor of input context; not merged to main. |
| B actual human merge | `71071ef4bbf380213a5f5cd1b74eb458016b14e3` | PR #9, 2026-11-04T12:21:39Z, parents A `c86bc3990a63a5b18d582782e54f9a3cffa18928` and B reviewed head; target `t3/85fcb290`. |
| C reviewed head | `6c3fcc112a344daed36b8d782426d65509ff35db` | Exact C policies and independent accepted scope. |
| C actual human merge | `4e7e976a4030f23d63b846f156a307a7b70fc870` | PR #10, 2026-11-04T12:22:05Z, parents B reviewed head and C reviewed head; target `t3/fa4ebcc5`. |

Authorized preparation in the generated branch: merge pinned main, then B merge, then C merge (non-rewriting local integration commits, e.g. `git merge --no-ff --no-edit <full-SHA>` after inspecting the previous result). Skip an already-contained input only with actual ancestry evidence. This permission is limited to local integration; human PR merge authority is unchanged. Main and C diverge from A; do not assume a fast-forward or substitute the latest branch tip without reconciliation.

Resolve policy conflicts within E's allowed files while preserving newer main decisions, the authoritative provider profile and reviewed C behavior. Coordinator context files may overlap incoming historical epic/status/report blobs: retain the newer committed coordinator epic/current/E assignment and exact final supplements/reviews; do not discard their contents for older waiting observations. Record resolutions/proposed status updates; do not run a coordinator loop. Preserve all main product/test/CI/package/README/other-epic bytes. Unexpected conflict or a remote-main change needing another base transition is a scoped blocker to the coordinator; no product repair, force-push or unassigned base update.

The resulting E PR is one main-targeted delivery of accepted B/C integration, preserved evidence and new E instructions. Document grouping because earlier human merges targeted feature branches. Prior B/C proofs remain evidence for their old base/head pairs, not proof of the new integrated E head. No additional unmerged dependent stack or silent promotion to main. Check exact net diff against pinned main before delivery; product/CI/other-epic paths must have no net changes.

## Ownership and provider

Worker owns the E policy/template paths and report/checkpoint defined in the backlog; coordinator owns epic/current/shared scheduling/gates. Integration-only resolution of coordinator context is allowed as retention, not new status authorship. No live implementation/reviewer shares the checkout; WIP one. Parent has unrelated dirty seed/epic002 files; they are excluded from committed input and must remain untouched.

Requested explicit override: T3 `cursor`, model `grok-4.7`, options `reasoning_effort: xhigh`, `contextWindow: 500k`. Capability-verified; leave global AGENTS Grok High profile unchanged. No substitution, subordinate agents, merge/publish/deploy/secret/account authority.

## Proof and CI continuation

Use relevant skill-authoring guidance and validators, links/anchors, scoped whitespace/diff, PR-template completeness and bounded report-trigger/merge-gate walkthroughs. Run current repository Verify from actual merged scripts/pin. No new product tests for prose or repeated expensive gates without a relevant change/concern. Record actual commands/revisions/results and main-content preservation; distinguish authored walkthroughs from D behavior.

Frozen hosted set for each E head: workflow CI, both push and pull_request events, Windows/Ubuntu verify jobs (four total), successful Verify and Upload packed tarball steps, required artifact ZIP/tarball digests and clean provenance/source mapping. Verify PR merge-test source/base/head relationship and reconfirm current head before GREEN. Protection/rollup cannot reduce this set. New head/base requires relevant new proof.

Follow finite [T3 parent relay](../../../../.agents/skills/braid-worker/references/t3-continuation.md). Parent thread `8a3c206a-9192-498f-b90a-19b5bf807c8c` owns registration/event transport, not repairs. Worker commits/pushes/creates PR and calls host link tool immediately next, checkpoints full facts/check set and returns nonterminal WAITING_CI_RELAY. Parent queues one post-registration readiness reconciliation, registers watch/yields, confirms actual registration and relays observations to the same worker thread. Worker independently verifies evidence or diagnoses/repairs real in-scope failures, push/links/waits through current-head GREEN. No child watches, polling loops, schedulers, failure injection or repeated A trial. Missing transport is a precise nonterminal blocker, not abandonment. Reconcile interrupted effects before mutation.

## Existing PR descriptions already updated

Coordinator rewrote #9/#10 bodies under this user approval: current human opening, What changed, Why, Left for you, followed by Technical record with original head/base/run/job/artifact/source/review/supplement references. Both now state actual feature-base merges and pending E integration into main. Each edit succeeded via `gh pr edit --body-file`; immediate next call linked the PR successfully (`alreadyLinked:true`). Neither source head changed. Ignored before/after metadata retained in parent `.tools/coord003/PR{9,10}-before-E.json` and `PR{9,10}-E-body.md`; authoritative current bodies can be read once via gh. No worker repetition needed. These merged PRs require no watch.

## Outputs, stop and next action

Write `reports/E.md` and `checkpoints/E.md` under this epic, with the approved human form and explicit state/blocker/user action/next owner, technical source dispositions, integration decisions, local/hosted proof and limits. PR body uses the same human account plus technical continuation evidence. Preserve exact roots/branch/head/PR and post-push supplements/index distinction. Propose shared updates; successful return requires independently verified current-head GREEN, then coordinator inspection/NEW independent E review/human merge remain. No Done from green alone, no D or successor. Pending/blocker returns retain ownership.

Next coordinator action before dispatch: validate and commit this complete context; supply its actual full SHA, not a self-referential placeholder. Next worker action: bounded startup, pinned integration preparation, then E implementation/delivery. No user input is currently needed for the approved routine work; eventual main merge remains the user's gate.
