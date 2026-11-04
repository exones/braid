# A: prove worker-owned CI waiting

Kind: spike. Epic: [BRAID-003](../epic.md).
Status: in-review (green worker handoff and no-findings independent review accepted; human merge pending). Owner: Sol High worker; coordinator owns gate/merge status.
Depends on: user approval/execution request received on 2026-11-03; live PR trial additionally requires a free implementation slot.

Current result: [PR #8](https://github.com/exones/braid/pull/8) has green worker handoff at exact `c86bc3990a63a5b18d582782e54f9a3cffa18928`, after the one [controlled trial](../reports/A-trial-assignment.md). Same-worker diagnosis/repair, H2 enabled-canary proof, H3 archival cleanup and final four-job/upload/artifact proof are recorded. Parent watch teardown confirmed. Source report/checkpoint and post-push supplements remain in the worker checkout, with hashes in the shared checkpoint. Independent review and human merge remain pending; B/C/D remain unstarted, no Done claim. Original task-ID survival was not an added acceptance standard.

Latest gate: [independent pass 001](../reports/reviews/A/A-worker-ci-wait-review-001.md) has no actionable findings at exact H3 and fingerprinted supplements; coordinator [technical acceptance](../reports/A-acceptance.md) records the result. Accepted author/reviewer outputs are retained in committed B handoff context without rewriting A's checked PR head. B's viable reviewed dependency is satisfied under explicit branch ordering; A remains In Review until human merge. Prior pending-review/readiness statements above are historical.

## Read first

[AGENTS](../../../../AGENTS.md), [workflow](../../../../docs/agile-workflow.md), [decisions](../../../../docs/decisions.md), [epic](../epic.md), [current checkpoint](../checkpoints/current.md), [planning report](../reports/planning.md), proposed rules, current host tool descriptions/instructions, coordinator delegation/delivery references, and the then-current CI workflow. No implementation dependency report exists yet.

## Value and research question

Can the assigned implementation worker retain a live/resumable task, receive completion of the PR checks it created, repair a failure, and return only after green current-head proof, while obeying host restrictions on child PR watches and polling?

Bound: one research session, at most one controlled owned PR lifecycle if explicitly authorized. First inspect available contracts and existing evidence; stop the live experiment if no legal continuation exists. Required decision: viable mechanism with exact roles/tools/events, or an exact host/user blocker. Do not spend repeated sessions searching for an imaginary wait tool.

## Scope and non-goals

Map pending -> notification/continuation -> failure diagnosis -> repair/push -> new-head green -> worker handoff. Identify where the worker checkpoint survives a yield/restart, who delivers an event, and how the returned head/check set is verified. A parent may relay an event only if the supported path is demonstrated and the worker retains execution/repair/handoff ownership.

No host-rule workaround, coordinator repair takeover, silent provider/role switch, scheduler/watchdog, polling script, new product runtime, or acceptance waiver. A proposed host change is a blocker/action, not implemented scope. Do not interrupt or repurpose existing epic 002 work. Any controlled failure belongs only to the authorized disposable trial PR; preserve required checks and remove the trial failure by a real fix before delivery. Never merge a failing trial.

## Acceptance criteria

1. Given the actual host restrictions and available tool schemas, the report distinguishes supported, unsupported, and unproven continuation paths, with exact nonsecret evidence and no invented capability.
2. Given a viable path and authorized trial, the same assigned worker creates a PR, remains its owner while checks are pending, receives the result, repairs a controlled or real in-scope failure, pushes, and verifies every declared check on the resulting full head SHA before successful handoff. Record task/PR/run/head identities and the event sequence.
3. Given no viable path, report the precise missing capability and action/owner needed. Keep B/C/D unready and the spike's delivery status honest. No successful handoff, Done, or green CI claim is made for an unsupported lifecycle.
4. The report defines handling for missing triggers, cancelled/skipped checks, host restart, stale-head notification, infrastructure failure, and an unfixable scope blocker. Blocker notification is explicitly distinct from delivery handoff.
5. The spike's own deliverable follows the same current-head green delivery policy. If the mechanism blocks that delivery, retain research locally/checkpointed as blocked; no bootstrap exemption or red PR handoff.

## Tasks

- [ ] Reconcile current host/profile/check contracts and choose the authorized research role; model/settings come from AGENTS, not this plan.
- [ ] Establish viability before creating live trial resources; conduct at most the authorized lifecycle.
- [ ] Record the decision and exact resume/blocker requirements in `reports/A.md` and `checkpoints/A.md`.

## Ownership and verification

Own this epic's `reports/A.md`, `checkpoints/A.md`, and explicitly assigned disposable trial assets only. The coordinator owns shared status. Evidence includes contract inspection and, for a positive claim, observed worker continuation/repair/current-head CI. Tool-schema inspection alone does not meet positive live acceptance. Research proof does not authorize changes to product code or CI policy.

## Review and delivery

Independent parent-scoped pass `A-worker-ci-wait-review-001` checks the exact report/trial evidence and restrictions under the [review convention](../../../../docs/agile-workflow.md#review-gates-and-indexing). Conventional Commit/owned PR/applicable CI, review, and human-approved merge are needed for Done. A blocked finding is useful research but not delivery completion. No PR, candidate SHA, review, or CI result exists at planning time.

## Report and resume

Follow [report-format](../../../report-format.md). Return supported mechanism or blocker, observed lifecycle, limits, actual checkout/branch/HEAD/PR/check state, and proposed shared updates. Stop after A; do not create the skill or start B.
