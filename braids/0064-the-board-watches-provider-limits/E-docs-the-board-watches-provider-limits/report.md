# Report: 0064/E Docs: the board watches provider limits

**What changed:** read the whole braid diff against `main` and each doc in `BRAID.md` `docs`. C and D had already updated most of them. Left over and fixed:
- `docs/board.md` "Paused" still said a pause opens no Needs You; it now names the weekly-window exception (0064/C review suggestion 2).
- `docs/roadmap.md`: a status line for 0064 (built).
- `docs/design/board-screenshots/110`, `111` and `112` retaken from `braid board --demo`: the paused chip's session bar is no longer red (B's finding), and 110 shows the steering-thread line.

**Docs, one by one:**
- README.md: unchanged (C/D wording is true: the board pauses, coordinators launch nothing meanwhile).
- docs/getting-started.md, docs/autonomy.md, docs/cli.md, docs/braids-format.md: unchanged (already say the board pauses and resumes; the `coordinator`/`pm` records are described as older).
- docs/board.md: updated (Paused paragraph, screenshots).
- CLI help text (`src/cli.ts`, `src/commands/pauses.ts`): unchanged; it already has `--no-pause`, `--by ...|board`.
- docs/decisions.md: unchanged (D90 and the log entry replace D87's pauser).
- docs/roadmap.md: updated. docs/development.md, docs/npm-distribution.md: unchanged, unaffected.

**Validation:** `npm run verify` passes (545 tests, docs gate and links). Screenshots from `node dist/cli.js board --demo`.

**Open:** none.

For later items: none.
Needs the user: none.
