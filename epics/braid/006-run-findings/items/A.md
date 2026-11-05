# A: isolate user data and review material risk fixes

- Kind: task. Tier: L. UI: no.
- Expected size: about 60–100 changed lines in four existing files.
- Branch: `item/006-a-data-isolation`, from the epic tip pinned at launch.
- PR into: `epic/006-run-findings`. Result to: coordinator thread set at launch.

## Goal

Keep tests and local commands off real user data, including when app-specific
overrides are absent. Ensure substantial fixes to risky behavior receive a
focused independent second look. Findings 53, 54, 56, 59 and 64.

## Start here

- `.agents/skills/braid-worker/SKILL.md`: work and local verification guidance.
- `.agents/skills/braid-coordinate/SKILL.md`: brief preparation and acceptance.
- `.agents/skills/braid-coordinate/assets/braid-md.md`: project-specific facts.
- `.agents/skills/braid-coordinate/assets/review.md`: independent review scope.
- `epics/reports/run-001-triage.md`: item A rationale and reading limits.

## Change

Update those four skill files with conditional data-isolation guidance and
focused re-review after material tier L failure/recovery fixes. Put specific
failure modes and checks in affected briefs rather than a universal checklist.

## Already decided

Use disposable fixtures and worktree-local commands. Isolate relevant OS path
defaults inside test/run processes, preserving the agent host's environment.
Explicitly authorized, bounded real-data reads remain possible. Existing review
and fix routing already cover factual documentation corrections.

## Out of scope

Trainer changes, sandbox infrastructure, universal HOME replacement, new policy
tests, routine re-review after every edit, or extra review files.

## Done when

- A default-path test cannot silently fall through to real app-data after an
  app override is cleared; the instructions explain where isolation belongs.
- A migration/recovery rewrite after blocking review gets a focused independent
  re-review; a doc typo uses the same worker without restarting the pipeline.
- Guidance never requires probing real user folders to prove every ordinary
  test safe, and keeps the existing CI evidence reusable.
- `npm run verify`, edited-skill validation and PR checks pass.

## Check with

Run `npm run verify` and the installed skill-creator frontmatter validator on
both edited skills. Review the two scenarios above against the resulting text;
do not add executable tests that merely mirror prose.
