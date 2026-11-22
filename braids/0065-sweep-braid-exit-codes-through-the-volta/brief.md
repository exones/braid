---
id: '0065'
title: "Sweep: braid exit codes through the Volta shim; stale reviewer branches"
status: Done
labels: ["kind:task", "tier:S", "sweep"]
dependencies: []
related: ['0064', '0063']
delivery: epic
---
## Goal

Clear two leftovers from braid 0063 ("braid wait past cancelled runs; braid clean drops reviewer branches", [PR #235](https://github.com/exones/braid/pull/235), report `braids/0063-braid-wait-past-cancelled-runs-braid/report.md` on `main`). First, make the installed `braid` give its real exit codes, so coordinators can rely on `braid wait` and `braid limits`. Second, clear the stale reviewer `t3/*` branches from the main checkout safely.

Expected size: about 60 lines in 3 to 5 files.

## Leftovers taken

### 2026-11-22-04cz: The installed braid launcher hides braid's exit codes (126)

From 0063, ref https://github.com/exones/braid/pull/235.

What: on this machine `braid` is a Volta shim (`volta run braid`); under Git Bash every non-zero exit of braid comes back as 126, including braid wait's 1 (CI failed), 2 (no answer) and 3 (still running). `node dist/cli.js` gives the real codes.
Where: the npm/Volta install path (docs/npm-distribution.md, docs/getting-started.md), and every skill step that reads braid wait's or braid limits' exit code.
Why: braid wait and braid limits answer through the exit code; a coordinator reading 126 can't tell failed from still running, which is how a coordinator in another project reported a false failure. Fix the install (or the shim), or have skills read the stdout verdict line as well.

Rechecked at planning (2026-11-22): `braid wait 9999` exits 126 through the shim and 2 through `node dist/cli.js` directly. PowerShell gives 126 too, so the problem isn't specific to Git Bash. `braid` resolves to `C:\Users\exon\AppData\Local\Volta\bin\braid` (a bash script `volta run "$(basename $0)" "$@"`, next to `braid.cmd`), with Volta 2.0.2.

### 2026-11-22-hm3m: Old reviewer t3/* branches left in the main checkout

From 0063, ref https://github.com/exones/braid/pull/235.

What: 22 local t3/* branches piled up in C:\code\agento before 0063 (21 with their tip on origin); their review records are gone, so braid clean no longer touches them.
Where: the main checkout's local branches; braid clean (src/commands/clean.ts).
Why: 0063 fixes new reviews only. A one-off cleanup, or a braid clean option for t3/* branches with no worktree whose tip is on origin, would clear them; other t3/* branches may belong to the user's own T3 threads, so it needs care.

Rechecked at planning (2026-11-22): 23 local `t3/*` branches in `C:\code\agento`, 3 with a worktree, all but one with their tip on origin.

## Start here

- `scripts/Install-Skills.ps1`: how the CLI is installed (`npm pack`, `npm install -g`, the `braid --version` check). Under Volta, `npm install -g` makes a Volta shim.
- `docs/npm-distribution.md`, `docs/getting-started.md`, `docs/development.md` (Node.js toolchain): the documented install path.
- `src/commands/clean.ts`: what `braid clean` removes since 0063, for the second leftover.

## Change

- Find out where the 126 comes from (Volta's `volta run`, the bash shim or `braid.cmd`, and which shells are affected). Fix it on the install side so `braid` returns braid's own exit codes in pwsh and Git Bash, for example by installing or linking a launcher that runs `node <installed>/dist/cli.js` directly. Have the installer check one known non-zero exit code after install (as it checks `braid --version` now) and fail clearly if the code is lost. Document it in the install docs.
- Stale `t3/*` branches: don't delete branches in the user's checkout yourself (one writer per checkout). In `report.md`, list the local `t3/*` branches of `C:\code\agento` that have no worktree and whose tip is on origin, and give the exact command the user can run to delete only those. Name the ones that don't qualify, and say why.

## Already decided

- The user chose this sweep ("Sweep as proposed") in 0063's coordinator thread, after asking for a recheck; both leftovers still held. 0062's leftovers (fbjx, kt83, m3pg) are not part of this sweep.
- Fix 04cz without editing `.agents/skills/`. A change to the skills needs the user's request and their merge (AGENTS.md), and raises the tier to L. If the exit codes can't be fixed on the install side, stop and propose the skill change (reading the stdout verdict line) instead of making it.
- No new `braid clean` option for `t3/*` branches: other `t3/*` branches may belong to the user's own T3 threads.
- Related to 0064 (The board watches provider limits, on `braid/0064-the-board-watches-provider-limits`): 0064/D changes the skills' `braid limits` steps; this story doesn't touch skills, so the two stay apart. Whichever merges second rebases nothing: there are no shared files.
- Related to 0063: the source of both leftovers.

## Out of scope

- Publishing to npm, and installing the CLI on the user's machine (the installed braid is 0.2.0; reinstalling from main stays the user's call).
- Deleting branches or worktrees in `C:\code\agento`.
- Skill, `AGENTS.md`, `CLAUDE.md` and `BRAID.md` edits.

## Completion

- [x] The cause of the 126 is named in report.md, with the shells checked
- [x] An install made by `scripts/Install-Skills.ps1` returns braid's own non-zero exit codes in pwsh and Git Bash (checked with a temporary install destination, never the real installation), and the installer fails if it doesn't
- [x] report.md lists the stale `t3/*` branches that are safe to delete (no worktree, tip on origin), with the exact delete command for the user, and the ones left and why
- [x] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open
