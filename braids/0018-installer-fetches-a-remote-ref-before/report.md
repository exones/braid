# Report 0018

**What changed:** `scripts/Install-Skills.ps1` runs `git fetch origin <branch>` when `-Ref` is `origin/<branch>`; a failed fetch stops the install before anything is copied. Other refs (local branch, tag, commit) are installed as they are. `docs/getting-started.md` says so in one clause. Three Pester tests added.

**Why:** `-Ref origin/main` installed a stale local remote-tracking ref, because only the run without `-Ref` fetched.

**Validation:** `pwsh -NoProfile -File scripts/Test-Pester.ps1` 20/20 pass; `npm run verify` (see PR).

**Open:** nothing.

For later items: none.
Needs the user: none.
