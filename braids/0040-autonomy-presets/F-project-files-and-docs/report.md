# 0040/F report

## What changed

- `BRAID.md`: `auto: allowed` became `autonomy: steady`. `braid autonomy 0040` (this branch's build) prints `Preset: steady`, `Name from: BRAID.md (the project default)`; `braid autonomy --list` marks `steady` as the default here.
- `AGENTS.md`, "Hard limits": agents merge on the user's explicit request or as the braid's autonomy preset allows; here that is a strand into its braid branch, and everything into `main` stays the user's.
- `README.md`: the review bullet, the stop-case bullet, a new capability bullet "Autonomy presets: you choose what braid decides" in place of "Auto mode for a goal", walk-through step 5 (`steady` merges strands and starts the next, `careful` waits), and the two pointers to getting started. Images unchanged: their text doesn't name auto mode.
- `docs/getting-started.md`: the optional `autonomy` key, and "Merging and autonomy presets" in place of "Merging and auto mode": merge on request, the three shipped presets in one line each, the evidence every preset keeps, `Decided:` lines, choosing a preset for a project and for one braid, writing your own under `autonomy/`, and hold. The planning-PR paragraph stays.
- `docs/decisions.md`: D73, autonomy presets replace auto mode, with the thread review's numbers (about 25 bare "merge"/"go"/"approve" messages, a 221-minute wait for "merge it", six nudges) and why this repository runs on `steady`. D31 is now "Merge on request" and points to D73 for its former auto mode; D28 points to D73. A dated log line.
- Two leftovers outside the brief's list that still named auto mode: `docs/board.md` (the `ask:` label note) and `docs/autonomy.md` (the `careful` line).
- `docs/roadmap.md` names neither auto mode nor an unattended mode, so it is unchanged.

## Why

0040/E moved the skills to presets; the project's own files and the docs a new user reads still described auto mode, and `BRAID.md` named no preset, so this repository fell back to `careful`.

## Validation

- `npm run verify` passed (364 tests, docs gate included, so every checked link resolves).
- `node dist/cli.js check`: braids OK. `node dist/cli.js autonomy 0040` prints `steady` from `BRAID.md`. The installed `braid` (from `main`) has no `autonomy` command yet; it arrives with the final PR.

## Open

- D47, D57 and D66 still mention auto mode in passing (the skill's references, the sweep, the question tool). They don't describe it as the way to delegate, and a decision changes only with a dated reason, so they were left for a later sweep.
- Braid 0040 still carries the `auto` label, which nothing reads now.

For later items: reword the passing mentions of auto mode in D47, D57 and D66 to "a preset that merges"; drop the `auto` label from 0040 and any other braid that has it.
Needs the user: process: this PR changes `BRAID.md` (`autonomy: steady`) and `AGENTS.md` (the merge limit), as the approved plan says; the user reviews them at the final PR into `main`.
