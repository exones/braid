# Getting started

How to install the braid skills and CLI, set up a repository for braid, and follow the work. The commands are in [the CLI reference](cli.md); how work moves from plan to merge is in the [workflow](../.agents/skills/braid/references/workflow.md).

## The skills

The agent skills `braid`, `braid-worker` and `braid-reviewer` are developed in this repository's `.agents/skills/` and can drive work in any repository. The three are installed together and may link to each other (the stop cases exist once, in `braid`); the docs gate fails if a skill links anywhere else outside its own folder.

- `braid` is the one skill you talk to, for work of any size: a goal, a single story, or "run 0012". It decides whether the work is a story or a goal, keeps the items as braids in the target repository's `braids/` through the `braid` CLI, and launches the workers.
- `braid-worker` and `braid-reviewer` are the skills of the worker and reviewer threads a coordinator launches. You don't start them yourself.
- Ordinary questions and small direct edits need no skill.

## Install the skills and the CLI

To make the skills available to Cursor, Codex and Claude in every project, install them from a committed ref of a checkout of this repository (without `-Ref` the installer runs `git fetch origin main` and installs `origin/main`, never a possibly stale local `main`; `-Ref origin/<branch>` fetches that branch first, other refs are installed as they are):

```powershell
pwsh -NoProfile -File .\scripts\Install-Skills.ps1               # from origin/main
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -Ref <branch>  # to try a branch
pwsh -NoProfile -File .\scripts\Install-Skills.ps1 -SkipCli       # skills only
```

The installer also installs the matching `braid` CLI, so the skills can always call it. From the same ref it runs `npm ci`, `npm run build` and `npm pack`, installs the tarball with `npm install -g`, and checks that `braid --version` prints that version, which it records as `cliVersion` in the stamp. It needs Node.js and npm on `PATH` ([development](development.md#nodejs-toolchain)) and runs before any skill is copied, so a failed build or version check leaves the installed skills as they were. `-SkipCli` leaves the CLI alone. The installer publishes nothing to npm; the current CLI isn't on npm yet (the published `0.1.0` is an older CLI, see [npm distribution](npm-distribution.md)).

The script copies `.agents/skills/braid` and `.agents/skills/braid-*` from that ref into `~/.cursor/skills`, `~/.codex/skills`, `~/.claude/skills` and `~/.braid/skills`, and writes `.braid-install.json` (ref and commit) into each installed skill. Uncommitted edits are never installed. To update after a skill change is merged, run it again.

- A folder of the same name that the script did not install is left alone unless `-Force` is given.
- Every target is checked before anything is replaced.
- An installed braid skill that is no longer in the ref (such as the old `braid-coordinate`) is removed.
- `-Target` replaces the default folders.

## BRAID.md

A target repository needs a `BRAID.md` at its root with the facts the skills read:

- the `gate` command, run before every PR;
- the `main` branch;
- the required `ci` checks (`none` if it has no hosted CI);
- `auto: allowed` to permit auto mode;
- optional `shell`, `setup` and `test` commands, and how to `run` the app;
- `models`: the provider, model and options for each role, with optional overrides per tier (`worker.L`) or kind (`worker.spike`). The tier key wins over the kind key, then the plain role. A role may name a skill, such as `braid-reviewer` for the reviewer.

Start from the [`braid` template](../.agents/skills/braid/assets/braid-md.md). This repository's own [BRAID.md](../BRAID.md) is an example. Agents keep screenshots and scratch files in `~/.braid/artifacts/`, outside every checkout.

## Set up a repository

1. Install the skills and the `braid` CLI once per machine, as above. If `braid` is missing, the `braid` skill stops and points here.
2. Create `BRAID.md` from the template and add `braids/**/temp/` to `.gitignore`.
3. A project whose work is in Backlog.md (`backlog/` and no `braids/`) runs `braid import-backlog --dry-run`, then `braid import-backlog`, once; the skill stops and asks for this until it is done.
4. Commit on `main` and push, add the repository as a T3 project and start a thread there with `braid`.

Why braid keeps items in `braids/` is decision D33 in [decisions](decisions.md); the files are described in [the braids/ format](braids-format.md).

## Merging and auto mode

You merge every PR yourself, unless you tell `braid` to merge one ("merge it" after its recap, and it merges exactly the commit it showed you) or auto mode merges a strand into its braid branch. Auto mode never merges a story or the final PR into `main`.

For a goal, you can ask for auto mode if `BRAID.md` has `auto: allowed` and real CI (`ci` not `none`). `braid` then merges each strand PR into the braid branch itself once the worker is green, an independent review found nothing blocking, CI is green and nobody flagged a stop case, and it leaves a comment on the PR saying why. It stops and asks you on any stop case, when a review is still blocking after 2 rounds of fixes, or when branch protection refuses; "stop auto" or "pause" switches it off.

A goal's plan is merged into its braid branch, so `main` gets its briefs with the final PR.

## See the board

Run `braid board` in your own checkout of `main`. It reads each item from its own branch, so a strand whose PR braid handed to you for your merge shows To Review; braid marks it Done on the braid branch after the merge (`braid accept`). The board shows where the work needs you; its Open thread button opens an item's T3 thread, and Merge asks the coordinator that handed over the PR to merge it (the board never merges itself). Ask `braid` for anything else. `braid board --demo` shows it on sample data. What the lanes mean: [the attention board](board.md).
