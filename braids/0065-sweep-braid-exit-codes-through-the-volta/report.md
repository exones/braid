# 0065 report

## What changed

- `scripts/Install-Skills.ps1`: after `npm install -g` and the `braid --version` check, the installer runs `braid wait 9999` in a temp folder and expects exit code 2 (no such braid). If the code is lost and `braid` is a Volta launcher (a `braid` file containing `volta run`, with the package image in `<volta home>/tools/image/packages/@exones/braid`), it replaces `bin/braid` and `bin/braid.cmd` with launchers that run `node <installed>/dist/cli.js` directly, then checks again. Any other launcher that loses the code, or a failed repair, fails the install before any skill is copied.
- `test/pester/Install-Skills.Tests.ps1`: stub braid answers `wait`; two new tests (no repair possible fails the install; a temporary Volta-shaped folder gets its launchers replaced). The existing log-count test counts the new call.
- `docs/getting-started.md`: describes the exit-code check and the launcher replacement.

## Cause of the 126

`volta run` (Volta 2.0.2) turns every non-zero exit of the program it runs into 126. The Volta `bin/braid` (bash) and `bin/braid.cmd` launchers are `volta run braid ...`, so the shim loses the code. Checked:

| Launcher | pwsh | Git Bash |
|---|---|---|
| `braid` (Volta shim) | 126 | 126 |
| `volta run node -e "process.exit(3)"` | 126 | 126 |
| `node -e "process.exit(3)"` (Volta's `node` shim) | 3 | 3 |
| the package's own `braid.cmd` / `braid` in Volta's image dir | 2 | 2 |
| `node dist/cli.js wait 9999` | 2 | 2 |

So it isn't Git Bash or braid; it is `volta run`. Plain npm installs use npm's own launchers and keep the codes.

## Validation

- `pwsh scripts/Test-Pester.ps1`: Install-Skills suite 24/24 ; the gate `npm run verify` passes (471 tests).
- By hand in a temporary folder (not the real Volta install): the replacement launchers, pointed at the real package image's `cli.js`, return 2 for `braid wait 9999` in pwsh (`braid.cmd`) and in Git Bash (`braid` sh).
- The real installation was not touched. The installed `braid` still returns 126 until the user runs `Install-Skills.ps1` again (reinstalling stays the user's call). A later `volta install`/`npm install -g` of braid brings the shim back; rerun the installer then.

## Stale reviewer t3/* branches in C:\code\agento

Checked read-only (`git for-each-ref`, `git worktree list`, `git branch -r --contains`, after `git fetch`). 23 local `t3/*` branches. Safe to delete: no worktree, and the tip is contained in an origin branch (so no commit is lost). That is 19:

`t3/14ed1c0b t3/16119b6e t3/174d3da2 t3/1aaf4b8f t3/22b6c22e t3/2a69d222 t3/2a755674 t3/2b3aab2d t3/35e4f733 t3/4f7f212c t3/58aeb2c0 t3/5ba9831a t3/70a2c607 t3/7242e841 t3/a15efdf2 t3/c56f98a8 t3/ccfa8161 t3/edfca625 t3/f63a2ec1`

Command (run in `C:\code\agento`, on a branch that is none of these; `-D` because they aren't merged into the current branch, though origin holds them):

```powershell
git branch -D t3/14ed1c0b t3/16119b6e t3/174d3da2 t3/1aaf4b8f t3/22b6c22e t3/2a69d222 t3/2a755674 t3/2b3aab2d t3/35e4f733 t3/4f7f212c t3/58aeb2c0 t3/5ba9831a t3/70a2c607 t3/7242e841 t3/a15efdf2 t3/c56f98a8 t3/ccfa8161 t3/edfca625 t3/f63a2ec1
```

Left alone:

- `t3/80ceb98f`, `t3/ad40072d`, `t3/fdb448e1`: each is checked out in a worktree (`C:/worktrees/agento/t3-<id>`); git would refuse, and the threads may be live.
- `t3/ed62288c`: its tip (`9f5bf660`, "docs(checkpoint): prepare independent PR14 review", 2026-11-04) is on no origin branch; 8 commits exist only locally. Delete it only if the user confirms they're not needed.

The count is 19 + 3 + 1 = 23. The brief's "21 with their tip on origin" counted the three worktree branches; the list was rechecked now, not copied.

## Docs

`docs/getting-started.md` updated. `docs/npm-distribution.md`, `README.md`, `docs/decisions.md` (no new user decision): not affected.

## Open

- The skills still read exit codes; they need no change once the installed launcher is fixed.
- Reinstalling on this machine to get the fix: user's call.

For later items: a reinstall with a Volta-managed `npm install -g` recreates the broken shim; a post-install hook can't help, so the installer check is the guard.

Needs the user: none
