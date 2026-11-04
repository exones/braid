# Braid workflow directory map

Braid organizes work for any project; it does not prescribe source, architecture, toolchain or documentation layout. Discover those from the target project's instructions; carry relevant paths and decisions in the assignment brief.

```text
<target-project>/epics/<project>/<NNN>-<slug>/
  epic.md
  backlog/<ID>-<slug>.md
  assignments/
    <ID>.md
    reviews/<parent>/
  checkpoints/
    current.md
    log.md
    <ID>.md
    reviews/<parent>/
  reports/
    <ID>.md
    <ID>-coordinator-triage.md
    <ID>-acceptance.md
    reviews/<parent>/
    final.md
  retro.md
  validation/
```

New packets live under `assignments/`. Historical `reports/<ID>-assignment.md` files stay as evidence. Do not copy a live packet into both places. Who writes each file is [Record ownership](agile-workflow.md#record-ownership). `checkpoints/current.md` and `checkpoints/log.md` follow [Now and the log](agile-workflow.md#now-and-the-log).

Skills, templates and protocol references belong to the Braid skill installation; their location does not determine the target project's layout. The [assignment packet](../.agents/skills/braid-worker/assets/assignment-packet.md) binds context, checkout, ownership, checks and return boundary.

Consult only for workflow navigation. Details: [IDs, reviews and ownership](agile-workflow.md), [reports and checkpoints](../epics/report-format.md). Project knowledge stays in project documentation; Braid records link it rather than duplicating architecture guides. This map adds no runtime directories or automation.
