# 0053/B report

**What changed**
- Item worktrees go to `~/braid-worktrees/<project name>/` when the main checkout is in `~/.braid/projects.json`; an unlisted repository keeps its checkout's folder name. `BRAID_WORKTREES_DIR` is still the root above them. New file `src/braids/worktree-folders.ts` (`agentsDirs`, `agentsDir`).
- Worktrees made under the old `<folder name>/` folder are left in place and still found: `braid start` (already-started retry), `braid clean` (worktrees, leftover review checkouts, the "inside the worktree folder" check) and the board's T3 lookup all use both folders. Nothing is moved.
- `braid projects add` prints a `note:` naming both folders instead of the old warning.
- Docs: braids-format.md, cli.md, decisions.md (D81).

**Why:** two listed checkouts with one folder name shared a worktrees folder and their items could collide. Names in the list are unique.

**Validation:** `npm run verify` passes (438 tests). New tests in test/start.test.ts: two listed projects with one folder name get different folders; old-folder worktrees are found by start and cleaned by clean; a new item goes to the project folder and clean removes it; test/projects.test.ts checks the new note.

**Open:** an unlisted repository whose folder name equals a listed project's name still shares that folder (listing it fixes it). An unreadable `projects.json` falls back to the folder name.

For later items: none.
Needs the user: none.
