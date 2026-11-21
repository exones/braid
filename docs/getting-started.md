# Getting started

How to install the braid skills and CLI, set up a repository for braid, and follow the work. The commands are in [the CLI reference](cli.md); how work moves from plan to merge is in the [workflow](../.agents/skills/braid/references/workflow.md).

## The skills

The agent skills `braid`, `braid-pm`, `braid-worker`, `braid-reviewer`, `braid-researcher` and `braid-idea` are developed in this repository's `.agents/skills/` and can drive work in any repository. They are installed together and may link to each other (the stop cases exist once, in `braid`); the docs gate fails if a skill links anywhere else outside its own folder.

- `braid` is the one skill you talk to, for work of any size: a goal, a single story, or "run 0012". It decides whether the work is a story or a goal, keeps the items as braids in the target repository's `braids/` through the `braid` CLI, and launches the workers.
- `braid-pm` is a project manager for one project: give it a goal in a few lines (`$braid-pm <goal>`) and it plans the braids, settles the product-shaping questions with you, then runs the braids through their own coordinator threads, two at a time by default. It keeps its plan in `pm/<slug>.md` on the branch `pm/<slug>`, answers the coordinators for you, checks each result live before and after it merges, and asks you only about what is expensive to reverse (the platform, the form of the product, contracts between braids, security, data, anything outside the repository); the rest reaches you in a periodic digest. Its braids run on the `free` preset with an exception line that sends those cases to it ([autonomy](autonomy.md)).
- `braid-worker` and `braid-reviewer` are the skills of the worker and reviewer threads a coordinator launches. You don't start them yourself. In T3 a worker is a top-level thread in the sidebar; a reviewer is a subagent of the coordinator and shows inside the coordinator's thread.
- `braid-researcher` answers one research question with checked evidence: what it read, ran or inferred, the evidence against, what stays unknown, and its sources. A coordinator while planning, or a worker for a side question, launches it as a subagent that reports once and changes nothing; a spike worker follows its method. Its sources go into the item's `sources.md`.
- `braid-idea` writes down an idea for later: start a thread with `$braid-idea <a sentence>`, and it restates the idea cleanly in the project's inbox (`braid note --idea`), asking only if it can't state it without guessing.
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
- optional `autonomy`: the [autonomy preset](autonomy.md) braids run on unless a braid names its own (`careful` if absent);
- optional `shell`, `setup` and `test` commands, and how to `run` the app;
- `models`: the provider, model and options for each role, with optional overrides per tier (`worker.L`) or kind (`worker.spike`). The tier key wins over the kind key, then the plain role. A role may name a skill, such as `braid-reviewer` for the reviewer and `braid-researcher` for the researcher.

Start from the [`braid` template](../.agents/skills/braid/assets/braid-md.md). This repository's own [BRAID.md](../BRAID.md) is an example. Agents keep screenshots and scratch files in `~/.braid/artifacts/`, outside every checkout.

## Set up a repository

1. Install the skills and the `braid` CLI once per machine, as above. If `braid` is missing, the `braid` skill stops and points here.
2. Create `BRAID.md` from the template and add `braids/**/temp/` to `.gitignore`.
3. A project whose work is in Backlog.md (`backlog/` and no `braids/`) runs `braid import-backlog --dry-run`, then `braid import-backlog`, once; the skill stops and asks for this until it is done.
4. Commit on `main` and push, add the repository as a T3 project and start a thread there with `braid`.

Why braid keeps items in `braids/` is decision D33 in [decisions](decisions.md); the files are described in [the braids/ format](braids-format.md).

## Merging and autonomy presets

You merge every PR yourself, unless you tell `braid` to merge one ("merge it" after its recap, and it merges exactly the commit it showed you) or the braid's autonomy preset lets the coordinator merge it; a goal's planning PR `braid` merges under your approval of the plan (below).

A preset is a short Markdown file that says what the coordinator merges by itself (`merge`: `none`, `strands` or `all`), whether it starts the next item without your go (`continue`), and, for each [stop case](../.agents/skills/braid/references/stop-cases.md), when it decides by itself and when it asks you. braid ships three ([autonomy presets](autonomy.md) has them in full):

- `careful`, the default: the coordinator merges nothing and asks you about every stop case.
- `steady`: it merges strands into the braid branch, starts the next one and decides the small cases; the big decisions and the final PR into `main` are yours.
- `free`: it merges everything, `main` included, and decides every case, logging each.

Whatever the preset, a merge by the coordinator needs green CI (`ci` not `none`), an independent review with nothing blocking and the reviewed head commit. Each decision it makes is logged as `Decided: <what>, because <why>, instead of <alternative>`, and you read them together in the recap (`braid decisions <number>` lists them).

**For a project,** set `autonomy: <name>` in `BRAID.md`. Every braid without its own preset runs on it.

**For one braid,** ask for it in the plan or later in chat ("run 0031 on careful"); the coordinator sets it with `braid edit <number> --autonomy <name>`, and a line or two in the brief's `## Autonomy` section holds the braid's exceptions ("architecture: ask for everything in 0031/B"). `braid autonomy <number>` prints the preset a braid runs on and where it comes from. A braid's preset changes only at your request.

**To write your own,** copy one of the shipped presets (print it with `braid autonomy <number>` on a braid that runs on it) to `autonomy/<name>.md` at the repository root, rename it in its front matter and heading, and write each row in your own words; a file with a shipped name replaces that preset in the project. `braid check` checks the file's shape and warns, without refusing, when a preset lets the agents decide `security`, `data` or `outward`. An agent's change to a preset is always a `process` stop case, so it reaches you.

"Hold", "pause" or "stop" lets the running item finish and then merges and starts nothing until you say go.

A goal's plan is merged into its braid branch, so `main` gets its briefs with the final PR. Approving the plan is the only answer it needs: `braid` then merges the planning PR itself once its checks are green, exactly the commit you approved, and starts the first strand (unless you asked only for a plan). If that PR changed after your approval, `braid` shows you what changed and asks again. The plan, and the first message after you ask to start or resume a braid, open with the braid's number and title, so you can catch a wrong number at once.

## See the board

Run `braid board` in your own checkout of `main`. It reads each item from its own branch, so a strand whose PR braid handed to you for your merge shows To Review; braid marks it Done on the braid branch after the merge (`braid accept`). The board shows where the work needs you; it can also act: Start launches a braid's coordinator, Open thread opens an item's T3 thread, and Merge asks the coordinator that handed over the PR to merge it (the board never merges itself). Ask `braid` for anything else. `braid board --demo` shows it on sample data. What the lanes mean: [the attention board](board.md).
