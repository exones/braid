# Braid workflow directory map

Braid organizes work for any project; it does not prescribe source, architecture, toolchain or documentation layout. Discover those from the target project's instructions; carry relevant paths and decisions in the assignment brief.

```text
<target-project>/epics/<project>/<NNN>-<slug>/
  epic.md                         # outcome, backlog index, gates; coordinator
  backlog/<ID>-<slug>.md           # scope, dependencies, acceptance
  assignments/
    <ID>.md                       # committed packet before item launch
    reviews/<parent>/             # review assignment, when written
  checkpoints/
    current.md                    # coordinator/standalone resume point
    <ID>.md                       # assigned worker resume point
    reviews/<parent>/             # reviewer-owned resume points
  reports/
    <ID>.md                       # item result and evidence
    reviews/<parent>/             # exact-revision review passes
    final.md                      # epic outcome and remaining gates
  retro.md                        # lessons and follow-ups
  validation/                     # retained exercises, when needed
```

New packets live under `assignments/`. Historical `reports/<ID>-assignment.md` files stay as evidence. Do not copy a live packet into both places. Worker outcomes stay in `reports/` and `checkpoints/`. The blank packet asset stays in the worker skill.

Skills, templates and protocol references belong to the Braid skill installation; their location does not determine the target project's layout. The [assignment packet](../.agents/skills/braid-worker/assets/assignment-packet.md) binds context, checkout, ownership, checks and return boundary; the shared checkpoint identifies active work.

Consult only for workflow navigation. Details: [IDs, reviews and ownership](agile-workflow.md), [reports and checkpoints](../epics/report-format.md). Project knowledge stays in project documentation; Braid records link it rather than duplicating architecture guides. This map adds no runtime directories or automation.
