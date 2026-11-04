# E: efficient skill execution

The skills now direct workers to use approved briefs and investigate incrementally toward verified results. This documentation candidate goes to the user for PR review; CI, independent review and merge remain separate.

## What changed

- Coordinator records architecture once and supplies paths, decisions, constraints and verification; interventions focus on dependencies, blockers, contradictions and meaningful failures.
- Worker starts with a small meaningful action after required startup checks; reasoning scales to risk, and further investigation needs a concrete question.
- Both prefer targeted searches, independent-operation batching, reused context and relevant output. Assignment packet gains an implementation brief field. One shared workflow map covers epic records, assignments and ownership for any target project; source architecture/toolchains stay in project context.

## Why

Repeated planning and repository discovery consume context without improving proof. Efficiency includes completing all required verification.

Counts include frontmatter/blank lines; words are whitespace-delimited against base `7707524`.

| File | Lines before / after | Words before / after |
| --- | --- | --- |
| Coordinator SKILL.md | 75 / 52 | 1449 / 856 |
| Worker SKILL.md | 57 / 58 | 1163 / 1183 |
| Assignment packet | 13 / 14 | 319 / 350 |

Original files were already below 100 lines, with dense paragraphs. Main skill words remain lower overall; added portability guidance separates workflow from project facts. Worker size stays nearly flat because execution guidance replaces repeated setup rules while detailed proof/recovery instructions remain intact.

Consolidated mode selection, report triggers, README boundaries and shared-checkout warnings. Removed explanations duplicated by existing AGENTS/delivery/report authorities, retaining links. No relocated bulk. The user follow-up adds one concise shared directory map, linked by both skills only for unfamiliar paths and from README. Existing delegation and T3 relay protocols remain unchanged and conditional on dispatch/wait.

Static before/after scenarios:

- Known option change: implicit approach becomes an explicit approved plan; inspect named function, edit and verify without another architecture plan.
- Specified CLI command: packet now carries patterns and settled decisions; a short implementation plan replaces repeated discovery.
- Crash/recovery change: investigate alternatives/failure modes before edits; exact-head proof, repair ownership, interruption recovery and merge gates still apply.

## Left for you

Review the PR and decide on merge after applicable checks/review. No live agent benchmark was run; scenarios are static inspection, not measured speedup. No release or merge is included.

## Technical record

- User task, AGENTS, README, decisions, workflow, seed epic/checkpoint and skill/reference context read. No prerequisite dependency report required for E.
- Base: `7707524a0b5a007794f22fab6ae1439d93458bb6`, remote main. Branch: `docs/skill-execution-efficiency`; origin exones/braid. Candidate SHA/PR supplied by Git/PR records, avoiding self-SHA commits.
- Both `python -X utf8 C:/Users/exon/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-dir>` commands passed (exit 0). Default Windows locale attempts failed decoding Unicode; UTF-8 mode corrected invocation.
- Scoped link/anchor checks and `git diff --check` pass. Static consistency inspection preserves Ready/Done, ownership, full current-head checks, nonterminal waits, security, checkpoint/resume and merge stops.
- No product tests for prose-only changes. Applicable Windows/Linux CI and independent review remain pending; no hosted success claimed.
- Next: user reviews PR; author handles scoped fixes. E remains in-review pending CI/review/human merge.

Directory-map follow-up: 26 scoped outbound links/anchors and both skill validators passed (exit 0), plus formatting. The initial map was 31 lines; the corrected workflow-only map is 24 lines, loaded only when needed. README and skill links resolve; required CI/review state must be checked on the new pushed head.

Portability correction: the user clarified these skills serve any target project. Removed Braid source/build/runtime directories from the shared map and replaced the fixed `braid/` epic namespace with `<project>`. Both skills distinguish installation-relative workflow guidance from target-checkout context; coordinator reads target-named decisions/roadmap rather than requiring Braid filenames, and uses the target authorized provider profile. No provider settings, gates or transport protocols changed.

Static portability scenario: an unrelated Python project with `app/` and project-named architecture notes uses its own instructions and check commands; Braid records live under `epics/<project>/...`. Neither the map nor startup requires TypeScript, npm, Braid CLI storage, or Braid development roadmap files. This is inspection proof, not an executed cross-project trial.

### Author-review fixes

Review of exact `f072a322fcda68e97c4661cb08e60da33ae41d3f` confirmed backlog paths, acceptance/dependency references and delivery/recovery gates remain present. Windows/Linux checks passed on that head. This is author review, not independent approval.

- Aligned epic, backlog-item and review templates: workflow links resolve from the Braid installation and are rewritten for generated files; project/work-item links resolve in the target checkout. This includes report-format links, not only ID/review policy links.
- Refreshed the checkpoint to review/CI as next action and labeled prior-head evidence explicitly. The new candidate is identified by PR metadata, avoiding a commit to record its own SHA.
- Rechecked template targets/anchors, isolated-target link rewriting, both skill validators and formatting. No product tests for prose-only fixes; the new head needs its own hosted proof.
