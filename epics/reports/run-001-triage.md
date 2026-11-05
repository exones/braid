# Run 001: findings triage and improvement plan

Date: 2026-11-05. Status: proposed; implementation has not started.
Evidence: [run observations](run-001-chinese-trainer.md), the current skills at
`92c9feb`, and the earlier [simplification plan](simplify-rules-plan.md).
Delivery plan: [epic 006](../braid/006-run-findings/epic.md).

## Assessment

The simplification worked. Workers mostly started promptly, implemented their
briefs, reused their threads for fixes, and delivered useful changes. Reviews
caught real bugs. The run does not justify another rewrite of braid or a new
supervision layer.

The remaining overhead comes from a few specific instructions and missing
project facts. The clearest example is commit frequency: the recorded epic had
19 coordinator commits, all with non-conventional subjects, plus five merge
commits. The skill explicitly required a push for every status transition.
Changing that instruction matters more than telling the coordinator to be less
cautious.

The most consequential failure was different: a test escaped its temporary data
directory through an OS default and wrote fixture data into a real per-user
folder. That calls for actual isolation in tests and local runs, rather than
more Git checks or repeated inspections of the user's database.

Four focused items address these causes. Data isolation comes first; commit
cadence and communication follow immediately. Startup and completion rules come
next, then visual acceptance. All four change agent instructions and therefore
remain tier L under the existing workflow. Each needs independent review and
the user's merge. No implementation worker launches as part of this plan.

## Triage

P0 means a demonstrated risk to user data. P1 means an observed workflow failure
or an explicit user priority. Deferred work is deliberately outside this epic.
Repeated observations are grouped; every finding number has one primary home.

| Priority / disposition | Findings | Decision and owner |
| --- | --- | --- |
| P0: A | 53, 56, 59 | Keep worker commands in their worktree and use disposable data. Test default-path behavior with the relevant OS locations isolated as well as app settings. Explicit permission can allow a bounded read of real data; it does not authorize mutations. |
| P1: A | 64 | Require a focused independent re-review when fixes materially change tier L failure or recovery behavior. A typo or a straightforward correction does not restart the whole review pipeline. |
| Existing practice: A | 54 | Correct factual documentation errors on the same PR. The current fix-routing rule already covers this; use it in the acceptance walkthrough rather than adding another policy paragraph. |
| P1: B | 30, 31, 38, 40, 41, 66 | Batch coordinator records into meaningful commits, use Conventional Commits, append new work by default, ask before changing the approved run order, and ask clear decision questions through the host tool when available. |
| P1: C | 6, 7, 8, 9a, 13, 14, 15, 19, 22, 26, 32, 45, 51 | Define one reproducible handoff: committed project facts, an isolated coordinator checkout, exact models and settings, setup/shell/focused-test facts, explicit no-CI handling, recognizable thread names and links, and bounded recovery after a failed run or replay. |
| P1: D | 44, 46, 47, 48, 50 | User merges visible UI changes after review, regardless of tier. Put current screenshots in the merge-ready recap and retain them outside a disposable worker checkout. Define scratch/artifact storage without introducing a new evidence ledger. |
| Host issue; C mitigates | 18, 21, 25, 37 | Replayed prompts and stuck runs belong to T3/provider investigation. On an observed replay or resume, inspect the existing PR including merged PRs and continue or stop accordingly. Stop a confirmed obsolete or replaying run using the applicable host API. The proposed PR-link/merge trigger remains a hypothesis. |
| Unconfirmed; defer | 23 | The reported model-display mismatch was not established. Keep the evidence, make launch settings clear in C, and investigate only if it recurs with concrete served-model evidence. |
| Historical configuration; no change | 33 | The Bugbot-launcher observation concerns that run's configuration. Keep the current project-selected models and settings; do not add a fallback model or review skill. |
| Host behavior; no braid change | 65 | T3 checkpoint refs are not coordinator commits. Do not delete them or rewrite project history as part of this work. |
| Low priority; defer | 67 | Agent author identity is not a current user priority. A bot account, credentials and repository permissions are separate work. |
| Correction; retain | 10 | The observer's initial diagnosis of the curriculum-test failure was wrong. Preserve the correction; it requires no skill change. |
| Preserve successful behavior | 1, 2, 3, 4, 5, 9, 11, 12, 16, 17, 20, 24, 27, 28, 29, 34, 35, 36, 39, 42, 43, 49, 52, 55, 57, 58, 60, 61, 62, 63 | Keep focused planning, settled facts in briefs, ordinary engineering judgment, one writer, same-thread fixes, useful independent review, PR comments as the review record, and concise user recaps. These observations are evidence of success, not thirty new instructions. |

## What the four items change

### A: isolate user data and review material risk fixes

Add short, conditional guidance for commands and tests that resolve home,
app-data or config paths. Point relevant locations at disposable folders in the
test process; also test the fallback when app overrides are absent. Avoid a
blanket instruction to replace the agent's own home, which could break its host
or credentials. Existing product isolation fixtures remain the project's
responsibility, not a new braid framework.

For tier L work, put the actual failure modes in the brief. If blocking fixes
materially change those behaviors, request a focused independent second look at
the changed paths. Reviewers confirm suspicions with targeted checks and use
existing CI results. A known factual error is fixed through the existing worker
thread. No new review, triage or acceptance files.

### B: quieter, predictable coordination

Commit the plan; then normally commit once per completed item, combining its
completion with newly ready work and the next start. Also persist a real block,
cancellation or settled scope/decision change when needed. Batch related user
answers before committing; commit a changed brief before a worker needs it.
Use subjects such as `docs(epic): complete A and start B`.

An intermediate `in-review` transition, PR link or "ready for your merge"
message does not create its own commit. GitHub and the thread show interim
activity; `epic.md` is a durable snapshot at these boundaries. Add thread links
at the same boundaries rather than creating one commit per launch. This changes
the current instruction that every status is immediately committed and pushed.
The target is approximately one routine coordinator commit per item, with
legitimate decision or blocker commits as exceptions. Do not rewrite old commits
or treat GitHub-generated merge subjects as the finding being fixed.

New work goes at the end. Explain a dependency or ordering problem and ask
before moving it ahead of approved work. Use a question tool when offered;
otherwise give short numbered questions, lettered options and a recommendation.
An option needing a path must say where that path will be stored. Continue
independent work while waiting for an answer.

### C: reliable startup and completion

The coordinator uses its own checkout and leaves the user's branch alone.
Before dispatch, workers must be able to read committed project facts and their
brief. Use existing authorization to commit those facts; ask only when authority
or required scope is missing. An existing coordinator in the user's checkout
must arrange isolation without resetting, switching or moving their work.

Document optional `shell`, `setup` and `test` facts in the project template and
provide braid's actual values. Inspect the checkout and instructions before
running setup; run the documented setup when the fresh worktree needs it,
before builds or tests. Do not turn setup into an unconditional reinstall on
every resumed turn.

Use exact provider/model IDs and `target.options` keys. Validate requested
settings against the host before its first launch; omitted settings mean host
defaults, not another clarification question. State the launch configuration
and relevant exposed defaults once. Keep Sol High and Grok 4.7 High/500K for
this repository. No silent model substitution or alternate orchestration route.

Define `ci: none` as an intentional no-hosted-CI mode: passing local gate
evidence tied to the delivered head plus review is sufficient, and the worker
does not watch for absent checks. Preserve `ci: []` as all reported checks and
a non-empty list as named required checks. Unexpectedly absent required checks
do not imply success. The gate still runs before every PR.

Name threads `<repo> <epic>/<item> <role>: <title>` and store worker/reviewer links
in the epic table at its next normal commit. On a delivered failure or a resume,
inspect that run once. Retry a plausibly transient startup failure at most once
with the same model/settings; report a repeated or non-retryable failure with
its exact error and ask for the needed decision. Never rerun delivered work as
a generic retry. A replay checks existing PRs with `--state all`; a merged item
is finished. No recurring Git queries, liveness polling or new watchdog.

Host failure notifications remain a limitation if T3 does not deliver them.
Record that honestly rather than claiming a skill can guarantee wake-ups.

### D: human visual acceptance with durable evidence

Add `UI: yes/no` to briefs. A new or noticeably changed user-facing UI requires
the user's merge into the epic branch after review, regardless of S/M/L tier.
CLI behavior alone is not automatically a visual UI change. The coordinator
shows screenshots of the final reviewed state in the merge-ready recap and
waits. The existing review tier still decides whether an independent reviewer
is needed.

Define an optional gitignored `artifacts` location, separate from product output
and `.braid/` state, with a disposable temporary fallback. Scratch files stay
uncommitted. Copy screenshots needed for handback into stable coordinator-owned
storage before deleting a worker checkout. The plan does not introduce automatic
worktree cleanup or upload screenshots to a third party. Use the host's supported
visual display mechanism and include a durable file link.

## Limits and validation

These are edits to the existing two skills, templates and their short public
usage instructions. Product code, the ledger, CI, release tooling, repository
settings, models and the trainer repository are outside scope. Do not create
generic setup tools, launch registries, monitoring daemons or policy-test suites.

Each worker runs `npm run verify` and the existing skill frontmatter validator
for edited skills before its PR. Reviewers walk through the relevant scenarios
in the briefs and look for contradictions across both skills, templates and
workflow. `verify:full` is only needed if implementation unexpectedly changes
the tools or packaging covered by it; such scope expansion needs replanning.

Keep the current reading footprint approximately flat by replacing old wording.
At planning time the coordinator skill has 1,258 words, the worker 735, the
workflow 783, the brief template 205 and review template 155. Report the final
counts once; they are a review aid, not a new gate. Target coordinator at most
about 1,300 words, worker 800, workflow 850, brief 250 and review 200. If the
behavior needs much more prose, simplify the design before expanding the rules.

After the user merges the finished epic, reinstall the committed skills using
the existing installer. Use the next ordinary product run to check a handful of
outcomes: routine commits are conventional and batched; setup succeeds without
shell guessing; no-CI workers finish; tests use disposable data; a UI item waits
for the user's merge with usable images. Observe existing timestamps for
dispatch-to-PR and PR-to-merge-ready, excluding human waiting when interpreting
delays. No dedicated benchmark epic, new telemetry or timing SLA. Revisit only a
specific failed outcome.

This direction remains consistent with the primary guidance already used in
the diagnosis: Anthropic recommends explicit delegation boundaries and effort
proportional to task complexity in its [multi-agent research report](https://www.anthropic.com/research/multi-agent-research-system),
and keeping prompts to the smallest sufficient set of high-signal instructions
in its [context engineering guidance](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents).
Applying those principles here favors four bounded corrections and one ordinary
product run over another orchestration framework.
