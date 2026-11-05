# C: make startup and completion reproducible

- Kind: task. Tier: L. UI: no.
- Expected size: about 180–260 changed lines in seven existing files.
- Branch: `item/006-c-runtime-handoff`, from the epic tip pinned at launch.
- PR into: `epic/006-run-findings`. Result to: coordinator thread set at launch.

## Goal

Give a fresh worker enough exact facts to start and finish without shell
guessing, CI waiting in a no-CI project, silent model changes or replayed work.
Findings 6–8, 9a, 13–15, 18–19, 21–22, 25–26, 32, 37, 45 and 51.

## Start here

- Both `.agents/skills/braid-*/SKILL.md` files: launch, startup and delivery.
- Coordinator `references/workflow.md`, `assets/braid-md.md`, `assets/epic.md`:
  checks, project facts and the item/thread mapping.
- `BRAID.md` and README "Build and verify": this project's actual toolchain.
- `epics/reports/run-001-triage.md`: item C decisions and host limitations.

## Change

Edit those six skill/project files plus README's "Braid skills in other projects" section.
Add optional shell/setup/focused-test facts; populate braid's actual values.
Define `ci: none` versus `[]` and named checks consistently. Add a Thread column
for worker/reviewer links, recognizable names and bounded failure/replay recovery.
Replace loose model examples with exact IDs/options and host-default semantics.

## Already decided

Coordinator works in its own checkout; committed facts and brief precede launch.
Reuse authorization and ask only for missing authority or material decisions.
Inspect instructions and checkout before setup; setup precedes tests in a fresh
worktree, not every resume. Preserve Sol High and Grok 4.7 High/500K exactly.

Validate requested settings once before first use. Omitted settings mean host
defaults. On delivered failure or resume, inspect once; at most one safe retry
of a transient startup failure using the same configuration. Replays look up
PRs with `--state all`; merged work stops. Thread links use B's commit cadence.

## Out of scope

New tools, watchdogs, polling, changing models, fixing T3, a host-default catalog,
forcing a full reinstall, or claiming guaranteed failure notifications.

## Done when

- A fresh pwsh worktree reaches its first test with exact setup instructions;
  resuming the worker does not repeat setup or routine Git checks.
- Explicit no-CI delivery terminates on gate evidence at the delivered head;
  missing required hosted checks never count as green.
- Invalid requested options, absent optional options, repeated startup failure
  and an already-merged replay each have one clear bounded response.
- User checkout remains untouched; thread links do not force new commits.
- `npm run verify`, both skill validations and PR checks pass.

## Check with

Use existing setup from README, then `npm run verify` and both frontmatter
validators. Review the scenarios above; verify documented model/option names
against the host once. No new worker, install or provider probe is required.
