# 0049: One board for all your projects

## What changed

One `braid board` now serves every project on a per-machine list, with one combined board, a project filter, and pushes for every project.

- **Project list** (0049/B, PR #197): `~/.braid/projects.json`, managed with `braid projects add|remove|list`. The format is in `docs/braids-format.md` ("The project list").
- **Readiness** (0049/A, PR #188): `readiness(folder, github)` says why a project isn't ready for braid (no BRAID.md, no `braids/`, GitHub unreadable, and so on). The board shows it in a "Not ready" banner, and `braid status` in a `not ready:` line. 0049/E (PR #193) shows an unreadable GitHub once in each place.
- **Board server for several projects** (0049/C, PR #198):
  - one port, one Tailscale listener and one token for every listed project;
  - per-project reads with their own timeout and last good snapshot;
  - `/api/all` (`?projects=`), `/api/projects`, `/api/board?project=` and `/api/item?project=`;
  - actions addressed by project name;
  - one notifier per project, with keys in that project's `.braid/notified.json`;
  - local requests must carry `Host: 127.0.0.1:<port>` or `localhost:<port>`, for reads too, against DNS rebinding.
  
  Decision D78 supersedes D40's "one project for now".
- **Combined page** (0049/D, PR #199):
  - every lane of every project, with cards, Done rows and inbox entries tagged by project;
  - a project filter kept in the address (`?projects=a,b`);
  - a Projects block, collapsed by default, that always names a failed read or a not-ready project;
  - a phone picker, and `#/p/<project>/<id>` routes, with today's `#/0003` and `#/inbox` still working.
  
  Decision D79.
- **Sweep** (0049/F, PR #195): the flaky timing check in `test/notify.test.ts`.
- **Merge of main** (0049/G, PR #200): main's `close()` and watcher filter now hold per project.

Without a list, `braid board` in a project folder serves that folder alone, as before.

## Why

The user works on several projects and wants one place to see what needs them (spike 0045, option 3, staged; user 2026-11-20). One board for all projects, with a filter for one or several, replaces one board per repository.

## Decisions by the user

- No T3 project check in readiness, and no `braid projects suggest`: the `t3` CLI has no project list.
- The sweep was done as strands 0049/E and 0049/F.
- The new file `~/.braid/projects.json` and the `braid projects` command were approved ("Merge it").
- Security and architecture of 0049/C were accepted, with the Host check added for local reads.
- The page mockups were approved, with the Projects block collapsed by default.

Each decision is logged on its strand.

## Validation

- Each strand was reviewed independently at its merged head, with re-checks after fixes, and had green CI on Ubuntu and Windows.
- `npm run verify` passes on the braid branch (432 tests at 0049/G). The braid branch's CI is green after main was merged.
- The failure modes of each strand have tests, listed in each strand's report.md. Among them:
  - one project hanging or failing while the others refresh;
  - an unlisted project or a path in an action;
  - a project removed while the board runs;
  - two projects with the same repository name;
  - no list;
  - a foreign Host;
  - `close()` waiting for every project's read.
- Screenshots of the built page from `--demo` are in `docs/design/board-screenshots/` (51–59).

## Open

All Completion boxes hold. The leftovers below are noted in the inbox:

- 2026-11-20-rxvh: two projects with the same repository name send push titles that look the same. Titles keep the `<repo> <id>` form, so the "titled with its project" box holds only while repository names differ.
- 2026-11-20-vk6w: a worktrees folder per project; today `braid projects add` only warns about a shared folder name.
- 2026-11-20-bnwt: a headless board started at login (proposed, not built).
- 2026-11-20-e625: readiness can't check that T3 knows the project until T3's CLI offers a project list.
- 2026-11-20-7pcs: the demo has no project with a failed read, so that state is shown only in the mockups.

Needs the user: the final PR into main is yours to merge. Please look over the new per-machine format in `docs/braids-format.md` ("The project list") and decisions D78 and D79 in `docs/decisions.md`.
