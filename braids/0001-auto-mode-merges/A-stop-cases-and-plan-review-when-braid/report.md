What changed:
- New `references/stop-cases.md` in `braid` and an identical copy in `braid-worker`: the 8 keys (security, dependency, architecture, data, process, outward, scope, quality) with meaning and examples; who records what (plan `ask:<key>` labels, worker `Needs the user:` line, reviewer section, coordinator diff facts as `git diff` commands for changed files, size, dependency manifests and lockfiles, process files, deleted files, skip/only markers).
- Docs gate (`scripts/Test-DocsGate.ps1`, in `npm run verify`): a file with the same path under `references/` in two skills must be byte-identical; negative fixture cases for same and differing copies.
- `braid` SKILL.md: `ask:<key>` labels in planning; the plan is created as real tasks, reviewed in local `amend` commits, squashed into `docs(backlog): plan <id>` and pushed once; parent `In Progress` in the epic's first commit; diff facts judged before the recap; recap `**Needs the user:**` line with its source; the parent's log after each merged subtask, then fixing unstarted tasks; Resuming checks unpushed local plan/item branches and reads the log; grown stories get the milestone too.
- `braid-worker` SKILL.md: final summary gets `For later items:` and `Needs the user:`; chat report gets `**Needs the user:**`.
- `assets/task.md`: `ask:<key>` label, milestone section (commands, never archive, ID collision check), parent log entry format. `workflow.md`: the log in one line, milestone in the table rows. README: "Group by milestone".

Why: one shared list of stop cases and fixed places to record them, for TASK-1.3's auto mode; plan review on real task files; the log carries each finished subtask to the next worker.

Milestone IDs: tested with backlog 1.55.3. `milestone add` numbers from this branch's files only (archived included), so two plan or epic branches can get the same ID. The task template orders it: create the parent, add the milestone, check its ID with a `git grep` over local and remote plan/ and epic/ branches (bash and pwsh; exit 1 means free; hits on your own branch ignored), and only then attach tasks, so a colliding milestone is archived and re-added before any task points at it.

Line counts before -> after: braid/SKILL.md 122 -> 124; braid-worker/SKILL.md 70 -> 71; braid/assets/task.md 94 -> 124; braid/references/workflow.md 97 -> 98; stop-cases.md new, 30 (each copy).

Review fixes (PR #47): parent status exception in ground rule 2 and the commit points; milestone check order and exit code; goal-only log step; diff facts say which output counts; final-summary example lists the new lines.

Validation: `npm run verify:full` (includes the quick gate, docs-gate negatives and Pester) passes on Windows; the stop-case commands and the milestone check were run against real repositories.

For later items: the shared-copy rule is generic (any same path under `references/` in two skills), so TASK-1.2's `braid-reviewer/references/stop-cases.md` is checked automatically. The reviewer's section is named `Needs the user` in stop-cases.md.

Needs the user: process: changes braid skills and the docs gate, as the task intends.
