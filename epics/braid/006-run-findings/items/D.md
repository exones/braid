# D: require visual acceptance with retained screenshots

- Kind: task. Tier: L. UI: no (changes the workflow, not an app UI).
- Expected size: about 100–160 changed lines in eight existing files.
- Branch: `item/006-d-visual-acceptance`, from the epic tip pinned at launch.
- PR into: `epic/006-run-findings`. Result to: coordinator thread set at launch.

## Goal

The user judges visible UI changes after review with current, usable images.
Screenshots and scratch files have a predictable home that survives the worker
checkout when needed. Findings 44, 46–48 and 50.

## Start here

- Both `.agents/skills/braid-*/SKILL.md` files: screenshots, recaps and delivery.
- Coordinator `references/workflow.md`, `assets/brief.md`, `assets/braid-md.md`:
  merge authority, UI marker and artifact facts.
- `BRAID.md`, `.gitignore`, README "Braid skills in other projects": local facts.
- `epics/reports/run-001-triage.md`: item D boundaries.

## Change

Update these eight files. Add `UI: yes/no` and the user-merge rule for new or
noticeably changed UI regardless of tier. Add an optional gitignored artifacts
location distinct from product output and ledger state, with a temporary
fallback. Explain retaining needed screenshots before worktree removal.

## Already decided

Review tier still determines independent review. After fixes and checks, show
final screenshots in the merge-ready recap and wait for the user's merge.
CLI behavior alone is not automatically a visual UI change. Use the host's
supported display method plus durable file links. Keep scratch uncommitted and
copy needed images into coordinator-owned stable storage; no automatic uploads.

## Out of scope

Building a UI, browser tooling, evidence manifests, screenshot services,
automatic worktree cleanup, or changing the user's final merge into `main`.

## Done when

- An S/M visible-UI item waits for the user after the appropriate review; an
  ordinary non-UI S/M item keeps its existing coordinator merge path.
- The merge-ready recap presents final images, not merely a reference to an
  earlier message; revised visuals replace stale evidence.
- Removing a worker worktree cannot invalidate images still needed for user
  acceptance, and no scratch enters product output or `.braid/` state.
- `npm run verify`, both skill validations and PR checks pass.

## Check with

Run `npm run verify` and both frontmatter validators. Walk through one visible
UI item and one ordinary CLI item on paper; check the ignore rule with
`git check-ignore` on the chosen artifact path. Do not build a demo application.
