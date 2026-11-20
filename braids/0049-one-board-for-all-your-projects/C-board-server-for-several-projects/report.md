# Report: 0049/C Board server for several projects

## What changed

- **One board, several projects.** `braid board` serves every project in `~/.braid/projects.json`, or only the one named by `--project <name>`. With no list, it serves the folder it runs in, as before. `--port` and `--host` are unchanged, and a project's own `port` isn't used. The list is read at start: a list braid can't read stops the start with exit 2. The list is read again at each refresh, so added projects appear and removed ones disappear.
- **One snapshot cycle per project** (`src/board/feed.ts`, new). The single-project read loop moved here unchanged. It adds a 60 s timeout on a project's whole read and keeps the last good snapshot with `readAt` and `failure`. A read that times out counts as failed: its late result is dropped (no snapshot, no pushes), and the project's next read waits for it to settle. Each project has its own watcher and notifier, and the projects are read in parallel.
- **API** (`src/board/combined.ts`, new, plus routing in `src/commands/board.ts`):
  - `/api/all[?projects=a,b]`: one combined board. Every card keeps its own lane and is tagged with `project`. Done is included. It also returns per-project `counts`, `problems`, `github`/`t3` states, `readAt`, `ageMs`, `failure` and `inbox`, plus `missing` for asked-for names that aren't served.
  - `/api/projects`: the per-project entries alone, without folder paths.
  - `/api/board?project=` and `/api/item?project=`: one project's board or item. Without a project they answer for the first one, so the current page keeps working.
- **Actions by project name.** The body carries `project`. The server looks it up among the projects it serves; it may be left out only when one project is served. A missing name, an unknown name or anything that looks like a path is a 400, and the action doesn't run.
- **Pushes**: one notifier per project, with its keys in that project's own `.braid/notified.json`. Titles keep the `<repo> <id>: <lane>` form.
- **Page** (`web/src/api.ts`): reads `?project=` from its address, else the project the server answered with, and sends it with every action. The page doesn't look any different.
- **Demo**: three projects, `demo` (the existing sample), `api` (small, with a question and a review) and `notes` (not ready). `--project` picks one.
- **Docs**: `docs/board.md` has a new section "Several projects", and its Refresh, Not ready and Demo sections are updated. Also updated: `docs/cli.md`, and `docs/decisions.md` with **D78**, which supersedes D40's "one project for now". It is D78 because `main` already has D76 and D77.

## What changed for security

- **The checks themselves are unchanged**: owner-only whois on Tailscale, the token, Host, Origin and `x-braid-request`. They still run before any project is looked up.
- **Wider reach of one token.** One token, and one Tailscale listener, now reach every listed project. Anyone who passes the checks can read all of them and act in any of them. Before, that was one repository per board.
- **Projects are named, never given as paths.** The server resolves the name through the list it read itself. Paths, unknown names and non-string names are refused before an action runs (tested). `/api/projects` and `/api/all` send no folder paths.
- **Pre-existing gap, now wider (not changed: the brief keeps the checks as they are).** On the local listener, GET requests (`/api/board`, `/api/all`, ...) are not checked for Host. A DNS-rebinding page could read board data, which is now the data of every listed project. Actions are not affected: they need the token. A Host check on local GETs would close this. It is a security decision for the user (see Needs the user).
- **Error text can carry paths.** The `failure` text of a project whose read failed is the error message, and it can name a file path. Before, the single board's 500 body could too. On the phone it goes only to the owner's devices.

## Failure modes

| Case | What happens | Test |
| --- | --- | --- |
| One project's read hangs | After 60 s it counts as failed and keeps its last snapshot with `failure` and `ageMs`. The other projects refresh and push. Requests wait at most the timeout. Its next read waits until the hung one settles (GitHub's own 30 s timeout) | `failure mode: one project's read hangs…` |
| One project's read throws | Its `failure` is set and `readAt` stays null (or the last good one). The other projects are served. Its own `/api/board` is an error, as for one project before | `failure mode: one project's read fails…` |
| Action names an unlisted project or carries a path | 400, nothing runs | `actions run in the project they name…` |
| Project removed from the list while the board runs | Gone at the next read, `/api/board?project=` gives 404, and a read under way stores and sends nothing | `failure mode: a project removed…` |
| Two projects with the same repository name | Items, actions and `notified.json` keys stay apart, but push titles look the same (see Open) | `failure mode: two projects with the same repository name…` |
| No list, in a project folder | Same lanes and actions as before; an action without `project` runs there | `failure mode: with no list…` and `braid board: no list serves this folder alone…` |
| List unreadable at start / while running | Exit 2 at start. While running: the projects stay as they were, with one line on standard error | Exit 2: 0049/B's reader; running: `a roster that can't be read…` |
| Snapshot then failed read (also one project) | Before: the error page. Now: the last good snapshot plus `failure` | covered by the hang and fail tests |

## Validation

- `npm run verify` passes: 417 tests, 10 of them new in `test/board-projects.test.ts`. They cover the combined board, `?projects=`, `/api/board?project=`, actions by name and the refusals, pushes for two projects with keys per project, the five failure modes, `runBoard` with no list, with a list and with `--project`, and the three demo projects, and a project list that becomes unreadable while the board runs. All 157 existing board tests pass unchanged.
- A real `braid board --demo --port`: `/api/all?projects=api,notes` returns both projects tagged in their lanes. Startup prints `Projects: demo, api, notes` and `notes: not ready: …`.

## Open

- **Same-name push titles**: two projects with the same repository name send titles that can't be told apart (`same 0001/B: Needs You`). The brief keeps the `<repo>` form; a later item could use the project name when two repositories share a name.
- **Hung read**: a project whose read hangs stays marked until the hung `gh`/`t3` call settles. GitHub calls time out after 30 s. A `t3` call hangs at most as long as its own timeouts.
- **Unused `/api/projects` fields**: the current page ignores `failure`/`readAt`. Strand D shows them.

For later items: 0049/D builds the combined page on `/api/all` and `?projects=`. Cards carry `project`, and actions need `project` in the body (`postAction` in `web/src/api.ts` already adds it). The demo has three projects for the mockups. Proposed, not built: a headless `braid board --no-open` started at login (the brief allows only a proposal); a Host check on local GETs; project names in push titles when repository names clash.

Needs the user: security: one token and one Tailscale listener now reach every listed project. Accept that wider reach, and decide whether local GET requests should get a Host check, so a DNS-rebinding page can't read the data of all your projects (not built: the brief keeps the checks unchanged). architecture: confirm the new `/api/all`, `/api/projects` and `?project=` API, the `project` field in action bodies, and D78.
