# 0053/B report

**What changed**
- Item worktrees go to `~/braid-worktrees/<project name>/` when the main checkout is in `~/.braid/projects.json`; an unlisted repository keeps its checkout's folder name. `BRAID_WORKTREES_DIR` is still the root above them. New file `src/braids/worktree-folders.ts` (`agentsDirs`, `agentsDir`).
- Worktrees made under the old `<folder name>/` folder are left in place and still found: `braid start` (already-started retry), `braid clean` (worktrees, leftover review checkouts, the "inside the worktree folder" check) and the board's T3 lookup all use both folders. Nothing is moved.
- `braid projects add` prints a `note:` naming both folders instead of the old warning.
- Docs: braids-format.md, cli.md, board.md (the worker's worktree path), decisions.md (D84).

**Why:** two listed checkouts with one folder name shared a worktrees folder and their items could collide. Names in the list are unique.

**Validation:** `npm run verify` passes (see below). New tests in test/start.test.ts: clean in one listed twin leaves the other's old-folder worktree alone; the board counts a thread in the old folder as an agent (two-folder lookup); an unreadable `projects.json` falls back to the folder name; a name differing from the folder only by case is one folder on Windows; two listed projects with one folder name get different folders; old-folder worktrees are found by start and cleaned by clean; a new item goes to the project folder and clean removes it; test/projects.test.ts checks the new note.

**Open:** two listed names that differ only by case (`App`, `app`) are different names to `projects.json`, so on Windows they would share one worktrees folder; not refused here (out of scope). An unlisted repository whose folder name equals a listed project's name still shares that folder (listing it fixes it). An unreadable `projects.json` falls back to the folder name.

For later items: none.
Needs the user: none.
