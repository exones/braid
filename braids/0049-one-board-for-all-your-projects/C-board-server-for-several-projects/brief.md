---
id: '0049/C'
title: "Board server for several projects"
status: In Progress
labels: ["kind:story", "tier:L", "ask:architecture", "ask:security"]
dependencies: ['0049/B']
order: 30
---

## Goal

After this strand, one `braid board` serves every project on the list from strand B: one port, one Tailscale listener and one token. It keeps a snapshot per project, offers one combined board of all projects, takes actions addressed by project name, and sends phone pushes for every listed project. The new page is strand D; until then the existing page keeps working for each project.

Expected size: about 900 lines in 10 files, with tests.

## Start here

- `braids/0045-working-on-several-projects-research-and/report.md`: option 3 ("What changes", "Risks") and follow-up 3.
- `src/commands/board.ts`: `Sources` (built for one root), the snapshot cycle, the actions (Start, Merge, Promote, Open) and how they resolve their repository.
- `src/board/t3.ts`, `src/board/github.ts`, `src/board/signals.ts`, `src/board/inbox.ts`: the per-project reads and their timeouts.
- `src/notify/notifier.ts` and `message.ts`: today there is one notifier per board, with its sent keys in `.braid/notified.json`.
- `src/board/tailnet.ts` and "Actions and the session token" in `docs/board.md`: the security checks, which must hold unchanged.
- Strand B's reader for `projects.json` and strand A's readiness module.

## Change

- `braid board`:
  - With a non-empty project list, it serves every listed project, or only the one named by `--project <name>`.
  - In a folder with no list, it serves that folder alone, as today.
  - `--port` and `--host tailscale` work as now. A project's own `port` in the list isn't used here.
- One `Sources` and one notifier per project. Reads run in parallel, and each project's whole read has its own timeout. Each project keeps its last good snapshot, with when it was read and what failed, so one slow or broken project doesn't hold up the rest.
- API:
  - `/api/board?project=<name>`: the existing board shape, for one project.
  - `/api/all` (optionally `?projects=<name>,<name>`): one combined board, the cards of every project (or of the named ones) in the usual lanes, Done included, each tagged with its project name, plus each project's counts, readiness, snapshot age and failures. The lanes are derived per project as today; combining only merges and orders them.
  - `/api/projects`.
  - `/api/board` with no project still answers for the single project when only one is served.
- Actions carry a project name, which the server resolves through the list. An unknown name is refused, and a folder path from the client is never accepted.
- Pushes come from one notifier per project, with keys in that project's `.braid/notified.json`. Push titles keep the `<repo> <id>: <lane>` form.
- The current page keeps working: it reads the first project, or the one in its address, until strand D adds the combined page and its filter.
- `docs/board.md` and `docs/cli.md`, and a new decision in `docs/decisions.md` that supersedes D40's "one project for now", with its reason (user, 2026-11-20, spike 0045).
- `src/board/demo.ts`: demo data for three projects, one of them not ready, for strand D's mockups.

## Already decided

- The security checks stay as they are: owner-only whois, token, Host, Origin and `x-braid-request`. Only listed projects are served.
- A project that couldn't be read keeps its last snapshot, marked as old, and sends no pushes for that read, as D70 already does after a partial read.
- GitHub reads already have a 30 s timeout (`src/board/github.ts`). What is new is the timeout on a project's whole read.
- No headless mode here. The report may propose one.

## Failure modes and required regression tests

- One project's T3 or GitHub read hangs or fails: the other projects still refresh and push, and that project shows its failure and the age of its snapshot.
- An action names an unlisted project, or carries a path: it is refused.
- A project is removed from the list while the board runs: it disappears at the next read, and its pending pushes aren't sent.
- Two projects have the same repository name: their items, actions and push keys stay apart.
- No list, run in a project folder: the same snapshot and actions as before this strand.

## Out of scope

- The combined page, the project filter and the project tags on cards (strand D).
- Pushes don't follow the page's filter: every listed project is always notified.
- Changes to how one project's lanes are derived.

## Plan

- `src/board/feed.ts` (new): one project's snapshot cycle, moved out of `startBoardWith` unchanged (reads one at a time, one queued read), plus the whole-read timeout (60 s): a read that takes longer counts as failed, its late result is dropped (no snapshot, no pushes), and the project's next read waits until it settles, so `gh`/`t3` of one project never overlap. Each feed keeps its last good snapshot, when it was read, and the failure of the latest read.
- `src/board/combined.ts` (new): the `/api/all` and `/api/projects` shapes; `combine()` tags each card with its project, keeps each project's order and adds per-project counts, readiness, age and failure.
- `src/commands/board.ts`: `startBoardWith` takes one `Sources` (as today, served under its repo name) or a roster (`() => Member[]`, re-read at each refresh: removed projects' feeds close and send nothing more). Routes `?project=` on `/api/board` and `/api/item` (no project: the first), `/api/all?projects=`, `/api/projects`. Actions resolve `project` from the body against the served names (omitted: allowed only with one project); anything else, a path included, is a 400. One watcher and one notifier per project.
- `runBoard`: the list from `readProjects()` (a corrupt list stops the start, exit 2), `--project <name>`, the list re-read at each refresh; no list: this folder alone. Startup prints the served projects and each one's problems.
- `src/board/demo.ts`: three demo projects (the current sample, a small second one, one not ready); `--demo` serves all three, the current page shows the first.
- `web/src/api.ts`: the page takes `?project=` from its address, else the board's `project`, and sends it with every action.
- Tests in `test/board-projects.test.ts` for the Completion boxes and the five failure modes; docs: `docs/board.md`, `docs/cli.md`, decision D78 (main already has D76, D77) superseding D40's "one project for now".

## Completion

- [x] With two listed projects, `/api/all` returns one combined board with both projects' cards in their lanes, tagged; `?projects=` narrows it to the named ones; `/api/board?project=` returns each project's board
- [x] Actions work by project name; an unknown name or a path is refused
- [x] Pushes for both projects come from one board, with keys per project
- [x] The five failure modes above each have a passing test
- [x] The decision superseding D40 is in `docs/decisions.md`, and `docs/board.md` describes the multi-project board
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
