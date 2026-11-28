Three shims with no data left are gone (the `.braid/requests.json` carry-over, the `braid done` alias, the second worktrees folder); old brief headings and `braid import-backlog` stay, because a project still has what they read.

**What changed**

- **Carry-over removed.** `src/braids/requests.ts` no longer looks for `.braid/requests.json` on any read or write; `migrate`, `migrateAsync`, `legacyFile` and the unused `push` option of `loadRecord` are gone. With no carry-over commit, leftover 2026-11-23-hjof (commit not pushed) is closed. An old file is left alone; a test checks that a read commits and renames nothing.
- **`braid done` removed.** It now fails as an unknown command; `braid accept` is unchanged.
- **One worktrees folder.** `agentsDirs` became `agentsDir`: `start`, `clean` and the board look only in `<worktrees>/<project name>` (a listed repository) or `<worktrees>/<repo>` (an unlisted one).
- **Kept:** the `## Acceptance` and `## Definition of done` headings (`src/commands/done.ts`), and `braid import-backlog` with its tests, fixtures and docs.

**Evidence** (2026-11-28, this machine; the linked or other machines were not searched)

Projects: `braid projects list` (agento, dctl-studio, everix4), the T3 project list, and every folder directly under `C:\code` for `.braid/`, `backlog/` and `braids/`.

| Shim | Searched | Found | Result |
| --- | --- | --- | --- |
| `.braid/requests.json` | `.braid/` of every folder under `C:\code` | only openclaw has the file, holding `[]`; agento and dctl-studio have `requests.migrated.json`; everix4 has neither | removed |
| `braid done` | tracked files at HEAD (without `braids/`, `epics/`) of agento, dctl-studio, everix4, openclaw, chinese-trainer; the installed skills under `~/.claude`, `~/.codex`, `~/.cursor` and `~/.braid` | no caller; only agento's own help, docs, test and decision history | removed |
| pre-0053 worktrees folder | `~/braid-worktrees/`, `git worktree list`, `~/.braid/projects.json` | every listed project's name equals its checkout folder's name, so the second folder never differs from the first | removed |
| Old brief headings | `braids/*brief.md` on every local and remote-tracking ref (fetched) of agento (401 refs), dctl-studio (218), everix4 (303), openclaw (68), chinese-trainer (71) | agento (49 briefs on `origin/main`, all Done) and openclaw (`braids/0001-…`) | kept |
| `backlog/` without `braids/` | the folders above, and chinese-trainer's refs | **chinese-trainer**: `backlog/` on `main`, no `braids/` on any ref, `backlog: backlog/` in its BRAID.md | `import-backlog` kept |

chinese-trainer is a T3 project but not in `braid projects`; its one Backlog.md task is Done. If it doesn't count, or once it is imported or dropped, `import-backlog` can go.

**One behavior to know**

The second folder also covered a case newer than 0053: worktrees made while a repository was unlisted, then listed under a name that differs from its folder name. After this change they are no longer found as the item's: `start` refuses ("checked out in a worktree at …"), the board doesn't count their threads, and `clean` skips them unless the strand is named. No project here is in that state. `docs/braids-format.md` ("The project list") says so.

**Validation**

- Focused suites (requests, requests record, start, start-clean, cli, board async, board start, reviews, t3) and `npm run typecheck`: pass.
- Tests removed with their code: the two carry-over tests and the board's one, the alias test, three tests of the second worktrees folder.
- Gate (`npm run verify`, Windows): exit 0; Node tests 862, 861 pass, 1 skipped, 0 fail.

**Docs updated:** `docs/cli.md`, `docs/braids-format.md`, `docs/board.md`, `docs/getting-started.md`, and dated or inline notes on D48, D84 and D96 in `docs/decisions.md`. The setup reference is unaffected, since `import-backlog` stays.

Decisions: remove the carry-over instead of caching its check; drop the second worktrees folder although it also covered a later rename (above).
For later items: remove `braid import-backlog` (about 500 lines) once chinese-trainer is off Backlog.md or the user says it doesn't count; the setup reference's "project has backlog/ and no braids/" then needs new wording (move the tasks into `braids/` by hand with `braid new`, `backlog/` left as history).
Needs the user: none
