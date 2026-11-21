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

- **The existing checks are unchanged**: owner-only whois on Tailscale, the token, Host, Origin and `x-braid-request`. They still run before any project is looked up.
- **New: a Host check on every local request, reads included** (user, 2026-11-20). The local listener answers only `Host: 127.0.0.1:<port>` or `localhost:<port>` with its own port; anything else gets 403 before anything is read. This closes the DNS-rebinding read of board data, which existed before for one project and would have covered every listed project. Actions keep their stricter check (only `127.0.0.1:<port>` plus the token). Tested for `/api/all`, `/api/projects`, `/api/board`, `/` and `/api/events`.
- **Wider reach of one token** (accepted by the user, 2026-11-20). One token, and one Tailscale listener, now reach every listed project. Anyone who passes the checks can read all of them and act in any of them. Before, that was one repository per board. Another Tailscale user, a tagged node or a failed whois gets 403 for `/api/all` and `/api/projects` too (tested).
- **Projects are named, never given as paths.** The server resolves the name through the list it read itself. Paths, unknown names and non-string names are refused before an action runs (tested). `/api/projects` and `/api/all` send no folder paths.
- **Error text can carry paths.** The `failure` text of a project whose read failed is the error message, and it can name a file path. Before, the single board's 500 body could too. On the phone it goes only to the owner's devices.

## Failure modes

| Case | What happens | Test |
| --- | --- | --- |
| One project's read hangs | After 60 s it counts as failed and keeps its last snapshot with `failure` and `ageMs`. The other projects refresh and push. Requests wait at most the timeout. Its next read waits until the hung one settles (GitHub's own 30 s timeout) | `failure mode: one project's read hangs…` |
| The hung read finishes after the timeout | Its result is dropped: the snapshot shown, its `readAt` and the failure stay, and no push is sent. The next read stores as usual | `failure mode: a read that finishes after the timeout is dropped…` |
| One project's read throws | Its `failure` is set and `readAt` stays null (or the last good one). The other projects are served. Its own `/api/board` is an error, as for one project before | `failure mode: one project's read fails…` |
| Action names an unlisted project or carries a path | 400, nothing runs | `actions run in the project they name…` |
| Project removed from the list while the board runs | Gone at the next read, `/api/board?project=` gives 404, and a read under way stores and sends nothing | `failure mode: a project removed…` |
| Two projects with the same repository name | Items, actions and `notified.json` keys stay apart, but push titles look the same (see Open) | `failure mode: two projects with the same repository name…` |
| No list, in a project folder | Same lanes and actions as before; an action without `project` runs there | `failure mode: with no list…` and `braid board: no list serves this folder alone…` |
| List unreadable at start / while running | Exit 2 at start. While running: the projects stay as they were, with one line on standard error | Exit 2: 0049/B's reader; running: `a roster that can't be read…` |
| Snapshot then failed read (also one project) | Before: the error page. Now: the last good snapshot plus `failure` (accepted by the user) | covered by the hang and fail tests |
| A request on the local listener with a foreign Host (DNS rebinding) | 403 before anything is read | `the local listener answers only Host 127.0.0.1:<port> or localhost:<port>…` |

## Validation

- `npm run verify` passes: 419 tests, 12 of them new in `test/board-projects.test.ts`, and whois refusals for `/api/all` and `/api/projects` added to `test/board-tailnet.test.ts`. They cover the combined board, `?projects=`, `/api/board?project=`, actions by name and the refusals, pushes for two projects with keys per project, the five failure modes, `runBoard` with no list, with a list and with `--project`, and the three demo projects, a project list that becomes unreadable while the board runs, a late read that is dropped, and the local Host check. All 157 existing board tests pass unchanged.
- A real `braid board --demo --port`: `/api/all?projects=api,notes` returns both projects tagged in their lanes. Startup prints `Projects: demo, api, notes` and `notes: not ready: …`.

## Open

- **Same-name push titles**: two projects with the same repository name send titles that can't be told apart (`same 0001/B: Needs You`). The brief keeps the `<repo>` form; a later item could use the project name when two repositories share a name.
- **Hung read**: a project whose read hangs stays marked until the hung `gh`/`t3` call settles. GitHub calls time out after 30 s. A `t3` call hangs at most as long as its own timeouts.

For later items: 0049/D builds the combined page on `/api/all` and `?projects=`. Cards carry `project`, and actions need `project` in the body (`postAction` in `web/src/api.ts` already adds it). The demo has three projects for the mockups. The page must show a project's failed read (review S1): `failure` and `readAt` (with `ageMs` in `/api/all`) say the snapshot shown is old and why; the current page ignores them. Proposed, not built: a headless `braid board --no-open` started at login (the brief allows only a proposal); project names in push titles when repository names clash.

Needs the user: none. The user decided security and architecture on 2026-11-20 (log-2026-11-20-user.md).
