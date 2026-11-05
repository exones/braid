# Report and checkpoint format

This is the maintained reporting authority for item reports, coordinator briefings, and pull-request bodies. Skills, handoff guidance, assignment templates, and decisions link here. Do not keep a second reporting procedure.

Leave historical reports as they were written. Do not rewrite them onto this contract or claim that they originally followed it.

## Human account

Every item report and user delivery briefing opens with one or two plain sentences. Those sentences say what is true now and what happens next. Then use:

### What changed

Practical behavior, record, or partial work relative to the previous substantive report. Include useful incomplete work. One fact at a time.

### Why

The practical reason and the impact. Include what stays risky or unclear without the change.

### Left for you

Say whether the user needs to do anything. When the user is blocked, name the blocker, the exact decision or action, the useful options and a recommendation, and the impact of waiting. Also say what can still proceed. When the user is not blocked, say that no user action is needed and name the next owner and action. Do not leave a blocker or merge readiness to be inferred from a hash or a delegated-task status label.

### Technical record

The exact evidence needed to resume: item and context links, checkout, branch, full head, pull request, base, checks, review, limits, and the next action. Link detailed logs instead of pasting them.

Scale the account to the new information. A completion briefing is normally about half a page. Omit filler, and do not repeat raw logs as a requirement. A later substantive result uses the same sections with the changed facts and a short reminder of context. Do not add a commit whose only purpose is to record its own SHA. See [Commit boundary](../docs/agile-workflow.md#commit-boundary).

A blocked item still gets this account. Describe the partial work and the blocker honestly. Do not call that outcome a successful delivery, Done, or a merge.

The coordinator writes the user-facing account after inspecting the evidence. A worker report, review file, or child status packet does not itself discharge that briefing. A top-level worker sends one result for a head. Dedupe a later message for that same head, then still inspect the evidence before this account. See [T3 continuation](../.agents/skills/braid-worker/references/t3-continuation.md#top-level-item-thread). Findings the worker can fix stay with the worker. Ask the user only for a decision that is actually theirs.

## Report triggers

Produce one coordinator account after inspecting evidence at each of these boundaries:

| Trigger | What the user needs to understand |
| --- | --- |
| An item finishes its assigned work or reaches a delivery outcome | What was achieved, the practical effect, the actual local, CI, review, and merge state, and what happens next. Worker GREEN is ready for coordinator acceptance and independent review. It is not Done and it is not a merge. Do not wait for the epic to finish. |
| A blocker or decision requires the user's attention | What is already done, what is blocked, the exact user action or decision, options and a recommendation where useful, the impact of waiting, and what can still proceed. Report promptly. Do not wait for item closure or retry indefinitely. |
| A substantive subagent return | What an implementation delivery, completed research result, or independent review did and found, what is happening now, and the coordinator's proposed next action. |
| A meaningful milestone or human merge gate | The new state, the completed outcome, the remaining gates, the exact merge or decision requested, and the next permitted action. Examples: review disposition, ready for human merge, a merged item or phase, an epic outcome. |

Overlapping triggers from the same event produce one report. Routine nonterminal CI waiting, readiness acknowledgements, duplicate same-head notifications, unchanged pending status, and child transport or task housekeeping stay short. Use them only as progress unless they create a user-owned blocker or a meaningful milestone. They do not replace the item briefing.

Short progress may use:

```text
Done: <what this turn completed or started>
You: <None, or the exact input, decision, or action and what it affects>
Next: <one next step>
```

Distinguish implemented, locally checked, reviewed, merged, and released. Link the pull request when one exists.

## Pull request records

A pull request uses the same human account, then **Technical record** for the next session: item and context links, exact head and base, relevant checks and run, artifact, and source references, review status and findings, limits or blockers, and the next action. [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) is an authoring aid. A body passed with `gh pr create --body-file` or `gh pr edit --body-file` still has to contain that account. Editing a description does not change Git heads and does not prove a new base.

When a dependent item requires a pull request to be merged, the coordinator's user account names that exact human merge. The stopping rule is the [human merge stop](../.agents/skills/braid-coordinate/references/delivery.md#human-merge-stop). Green CI and independent review are not a merge.

## Checkpoints

`checkpoints/current.md` and `checkpoints/log.md` follow [Now and the log](../docs/agile-workflow.md#now-and-the-log). Workers own `checkpoints/<task>.md` and propose shared-status updates in their report. In standalone mode the assigned agent owns the shared handoff.

A worker checkpoint is the operational resume point for that item, not a second human briefing. Record the date, active task, actual checkout, branch, and full HEAD, controller version when one applies, completed work, in-flight commands and logs, the last check, changed files, blockers, and one next action. Say whether changes are committed or pushed. Commit that file before the push. After the push, later proof follows [Commit boundary](../docs/agile-workflow.md#commit-boundary).

Prefer a concrete action such as "inspect the returned head and assign the named review" over "continue implementation".

## Acceptance record

After the human merge, the coordinator writes `reports/<ID>-acceptance.md` in one epic commit. Copy the facts below. A link to a comment or a run is not the record. Hosted logs and artifacts expire, and comments can be edited. Who writes the file is [Record ownership](../docs/agile-workflow.md#record-ownership).

```text
Checked head: <full sha>
Base: <full sha>
Runs: <workflow> <event> run <id> attempt <n> job <id> <conclusion>
Required steps: Install dependencies, Verify, Upload packed tarball: <conclusion>
Merge: <full sha>
Review: <pass name> reviewed <full sha>; findings <none or labels>; triage <disposition>
```

## Review records

Follow the [review conventions](../docs/agile-workflow.md#review-gates-and-indexing) for names, paths, numbering, and existing records. Use the [review template](../.agents/skills/braid-coordinate/assets/review.md) for the exact checked revision, scope, findings, checks, and later triage. The coordinator translates that return into the human account above. The review file remains the technical gate record.
