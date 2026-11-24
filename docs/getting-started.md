# Getting started

How to install the braid skills and CLI, set up a repository for braid, and follow the work. The commands are in [the CLI reference](cli.md); how work moves from plan to merge is in the [workflow](../.agents/skills/braid/references/workflow.md).

## The skills

The agent skills `braid`, `braid-pm`, `braid-worker`, `braid-reviewer`, `braid-researcher` and `braid-idea` are developed in this repository's `.agents/skills/` and can drive work in any repository. They are installed together and may link to each other (the stop cases exist once, in `braid`); the docs gate fails if a skill links anywhere else outside its own folder.

- `braid` is the one skill you talk to, for work of any size: a goal, a single story, or "run 0012". It decides whether the work is a story or a goal, keeps the items as braids in the target repository's `braids/` through the `braid` CLI, and launches the workers.
- `braid-pm` is a programme manager for one project: give it a goal in a few lines (`$braid-pm <goal>`) and it plans the braids, settles the product-shaping questions with you, then runs the braids through their own coordinator threads, two at a time by default. It keeps its plan in `pm/<slug>.md` on the branch `pm/<slug>`, answers the coordinators for you, checks each result live before and after it merges, and asks you only about what is expensive to reverse (the platform, the form of the product, contracts between braids, security, data, anything outside the repository); the rest reaches you in a periodic digest. Its braids run on the `free` preset with an exception line that sends those cases to it ([autonomy](autonomy.md)). On the board its programme has a card in the programmes panel left of the lanes (its goal, braids, next step, hold and open question, and a button to the PM thread); its coordinators' requests go to the PM first and show as "The PM is handling", off your side and off your phone, and reach your side only when the PM forwards them (a forward is the PM asking you: it shows in the programme's Needs you and pushes as the PM's, opening the PM's thread; the merges waiting for you are one push), hasn't answered in 20 minutes (60 for a handover, which then goes to To Review), or its thread is gone (archived, failed or unknown to T3). Its own questions to you are board requests, pushed at high priority, and a programme whose PM and braids all stopped reads stalled ([the board](board.md#programmes)).
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

The installer also installs the matching `braid` CLI, so the skills can always call it. From the same ref it runs `npm ci`, `npm run build` and `npm pack`, installs the tarball with `npm install -g`, and checks that `braid --version` prints that version, which it records as `cliVersion` in the stamp. It also checks that `braid wait 9999` exits 2: under Volta the `braid` launcher runs `volta run`, which turns every non-zero exit into 126, so `braid wait` and `braid limits` would look failed. On a Volta launcher the installer replaces `bin/braid` and `bin/braid.cmd` with ones that run `node` on the installed `dist/cli.js` (Git Bash and PowerShell then see the real codes); any other launcher that loses the code fails the install. A later Volta reinstall brings the shim back, so run the installer again. It needs Node.js and npm on `PATH` ([development](development.md#nodejs-toolchain)) and runs before any skill is copied, so a failed build or version check leaves the installed skills as they were. `-SkipCli` leaves the CLI alone. The installer publishes nothing to npm; the current CLI isn't on npm yet (the published `0.1.0` is an older CLI, see [npm distribution](npm-distribution.md)).

The script copies `.agents/skills/braid` and `.agents/skills/braid-*` from that ref into `~/.cursor/skills`, `~/.codex/skills`, `~/.claude/skills` and `~/.braid/skills`, and writes `.braid-install.json` (ref and commit) into each installed skill. Uncommitted edits are never installed. To update after a skill change is merged, run it again. A board installed with `braid board service install` (Windows) is restarted at the end on the new code, on the same port; the script prints one line then ([run the board at login](board.md#run-the-board-at-login)).

- A folder of the same name that the script did not install is left alone unless `-Force` is given.
- Every target is checked before anything is replaced.
- An installed braid skill that is no longer in the ref (such as the old `braid-coordinate`) is removed.
- `-Target` replaces the default folders.

**Updating from a braid before the request record** (braid 0070). Requests opened with an older `braid` sit in `.braid/requests.json` of the main checkout. The first command that reads or writes requests (`braid requests`, `braid ask`, `braid answer`, the board) carries them over once onto the branch `braid-requests`, each with a new code and its original time, and renames the file `requests.migrated.json`. A read commits the carry-over locally; the next write pushes it. Nothing else is needed.

## BRAID.md

A target repository needs a `BRAID.md` at its root with the facts the skills read:

- the `gate` command, run before every PR;
- the `main` branch;
- the required `ci` checks: a list of names means exactly those; `all` means every check reported on the commit (checks that vary with the paths a PR changes); `[]` and `none` name none, so there is nothing to wait for, reported checks must still pass, and no preset merges; `none` also says there is no hosted CI, so the gate is the evidence;
- optional `merge-gate` and `merge-gate-on`: a command `braid accept --merge` runs before each merge it makes, under every preset, with `<pr>` and `<sha>` (the reviewed head) filled in, for nine minutes at most; it refuses the merge unless it exits 0, and a script that reports failure only in its output needs a wrapper or an exit-code flag; `merge-gate-on` says which merges run it (strands into the braid branch, PRs into `main`, or both, the default);
- optional `review-bots` and `reviewer-with-bots`: the bots that review PRs (by check name or comment author), whose comments the worker answers and resolves, and whether the braid reviewer still reviews (`always`, the default) or only tier L items (`L-only`);
- optional `autonomy`: the [autonomy preset](autonomy.md) braids run on unless a braid names its own (`careful` if absent);
- optional `shell`, `setup` and `test` commands, and how to `run` the app;
- optional `docs`: the project's docs in two lists, `public` (for its users: README, guides, help text) and `internal` (for its developers: development notes, the decisions record, format references), and `update`, when braid keeps them true (below). Without the lists, agents take `README.md` and `docs/`;
- `models`: the provider, model and options for each role, with optional overrides per tier (`worker.L`) or kind (`worker.spike`). The tier key wins over the kind key, then the plain role. A role may name a skill, such as `braid-reviewer` for the reviewer and `braid-researcher` for the researcher.
- `limits`: optional usage thresholds for `braid limits`: `session` (default 97, percent), `weekly` (95), `buffer` (5, minutes added to a window's reset for the resume time) and `stale` (10, minutes after which a provider's cache counts as unknown). See [the CLI](cli.md#provider-limits).

`docs.update` takes one of four values:

- `strand`: every item's PR, strand or story, updates the docs its change makes untrue. Its brief has a Completion box for it, and the reviewer blocks a PR that leaves a doc untrue.
- `braid` (the default): a story's PR does the same, and every goal ends with a docs strand (`Docs: <braid title>`), planned last, that reads everything the braid changed, from its first strand, and brings the docs up to date as a whole before the final PR; it lists each doc it checked as updated or unchanged. Other strands carry no docs box; the docs strand does.
- `both`: the two together; this repository uses it.
- `on-demand`: docs change only when a brief or you ask for it. What you decided is still documented, in the doc that describes it and the decisions record.

Docs that need your go (`AGENTS.md`, `CLAUDE.md`, `BRAID.md`, the skills) are proposed in the report, not edited, unless the brief allows it.

Start from the [`braid` template](../.agents/skills/braid/assets/braid-md.md). This repository's own [BRAID.md](../BRAID.md) is an example. Agents keep screenshots and scratch files in `~/.braid/artifacts/`, outside every checkout.

## braid on a large repo

A large polyglot monorepo, where a merge into `main` builds everything and deploys shared environments, needs a few more lines. Only the merge gate and `ci: all` are code; the rest are lines in `BRAID.md` and `AGENTS.md` that the agents read. An example:

```yaml
gate: pwsh -File build/gate.ps1 -local
ci: all
review-bots: [coderabbitai]
reviewer-with-bots: always
merge-gate: python -I ci/gate.py --pr <pr> --sha <sha>
merge-gate-on: [main]
setup: "git submodule update --init; set NUGET_PACKAGES to a folder in the worktree (shared caches are cleaned by other builds); pnpm install --frozen-lockfile"
```

- **CI that differs per PR.** When the checks a PR gets depend on its paths, `ci: all` makes `braid wait`, `braid accept`, `braid handover` and `braid recap` require every check reported on the commit. Only `braid wait` adds a 2-minute start grace for checks that start late; the others read once. A list of names would wait for a check that never runs or miss one that did.
- **Partial CI on braid branches.** When the full build runs only for PRs into `main`, say so in the body of `BRAID.md`: "Strand PRs into a `braid/*` branch get only the path checks and the review bots; the full build runs on the final PR into `main`." The worker's local gate is then a strand's full evidence, and its report gives the gate's output summary and duration. The final PR's CI covers everything before it reaches `main`.
- **Review bots.** List the bots' checks in `ci`, or use `ci: all`, so that green CI means the bots have reviewed. With `review-bots`, the worker reads the bots' threads once at green CI, fixes each comment, answers why not, or marks it a nit; it pushes the fixes in one push, replies on each comment, resolves each thread itself, and lists them in its report, then waits for CI on the new head as usual. A named bot that posted nothing by then is `<bot>: no review` in the report: the worker never waits for a bot. `reviewer-with-bots: always` keeps the braid reviewer, which also reads the bots' threads and the worker's replies; `L-only` gives tier S and M items the bots reviewed no braid reviewer, and the bots' resolved review counts as the independent review for a merge under a preset.
- **A merge gate for `main`.** `merge-gate` names one command whose exit code decides: 0 merges, anything else refuses with its output and changes nothing, under every preset and when you ask for the merge. It holds the rules braid can't know: a minimum test count, no merge while a run uses the shared staging environment, a required run for a risky path. A script that reports failure only in its output and exits 0 needs a wrapper or an exit-code flag. `merge-gate-on: [main]` runs it only on PRs into `main`, for a gate that reads the full build only those PRs get. `braid facts <pr>` names the gate and whether it runs on that PR's merge.
- **Path stops.** A rule for certain paths goes in `AGENTS.md`, where every agent reads it:

  ```markdown
  - `billing/**`: a change that can move prices needs the non-regression run first; ask before merging.
  ```

  The coordinator treats such a change as a stop case, and the merge gate can refuse a PR into `main` that touches those paths without the run. Path-scoped gates, narrower checks for a PR that touches only docs or the frontend, belong in the project's gate script, which picks the checks from the changed paths; `BRAID.md` lists them for the worker.
- **Caches and disk.** A shared cache that other builds clean (NuGet, Gradle, a package store) breaks a worktree's build halfway; give each worktree its own folder in `setup`. A large repository's worktrees fill a disk quickly: `braid clean` removes the worktrees of merged items.

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

Whatever the preset, a merge by the coordinator needs green CI (`ci` a list or `all`, not `none`), an independent review with nothing blocking (with `reviewer-with-bots: L-only`, the review bots' resolved review for tier S and M) and the reviewed head commit. Each decision it makes is logged as `Decided: <what>, because <why>, instead of <alternative>`; your answers, and the PM's with its reason, are on the request record (below). You read them together in the recap (`braid decisions <number>` lists them).

**For a project,** set `autonomy: <name>` in `BRAID.md`. Every braid without its own preset runs on it.

**For one braid,** ask for it in the plan or later in chat ("run 0031 on careful"); the coordinator sets it with `braid edit <number> --autonomy <name>`, and a line or two in the brief's `## Autonomy` section holds the braid's exceptions ("architecture: ask for everything in 0031/B"). `braid autonomy <number>` prints the preset a braid runs on and where it comes from. A braid's preset changes only at your request.

**To write your own,** copy one of the shipped presets (print it with `braid autonomy <number>` on a braid that runs on it) to `autonomy/<name>.md` at the repository root, rename it in its front matter and heading, and write each row in your own words; a file with a shipped name replaces that preset in the project. `braid check` checks the file's shape and warns, without refusing, when a preset lets the agents decide `security`, `data` or `outward`. An agent's change to a preset is always a `process` stop case, so it reaches you.

"Hold", "pause" or "stop" lets the running item finish and then merges and starts nothing until you say go.

**Provider usage limits.** Before each launch the coordinator (or PM) runs `braid limits`, which reads the usage T3 caches for each provider in `BRAID.md` `models`; at or over a threshold (session 97%, weekly 95%; change them with `limits:` in `BRAID.md`) it launches nothing on that provider and says so. Pausing and resuming is the board's job: a running `braid board` with a `steering` role in `BRAID.md` `models` (a `first` and a `fallback` line) pauses every agent on a provider over its threshold through a 🚦 steering thread, so the board shows a pause mark instead of a stall, and resumes them after the reset plus a buffer ([the board](board.md#the-board-pauses-and-resumes)). Coordinators and PMs keep no check task and schedule no resume; they answer the board's pause and resume messages. Unknown usage never pauses. A weekly limit shows in Needs You; moving the role to another provider is your edit of `BRAID.md`. Without a running board (or with `braid board --no-pause`, or no `steering` role) nothing pauses and you say go on. A pause is not a hold: it needs no go from you. See [the CLI](cli.md#provider-limits) and [the board](board.md#paused).

A goal's plan is merged into its braid branch, so `main` gets its briefs with the final PR. Approving the plan is the only answer it needs: `braid` then merges the planning PR itself once its checks are green, exactly the commit you approved, and starts the first strand (unless you asked only for a plan). If that PR changed after your approval, `braid` shows you what changed and asks again. The plan, and the first message after you ask to start or resume a braid, open with the braid's number and title, so you can catch a wrong number at once.

## Questions and answers

When a coordinator or the PM needs you, it opens a request with `braid ask` and then asks in chat, in its turn's last message: the question, the request's code (`q-7f3k`) and the options as lettered answers, the recommended one first. No dialog blocks the thread. The request lives on the branch `braid-requests` with its whole history: who asked and for whom, when it was answered, withdrawn with a reason, or met (its "done when" held, such as a PR merged), the answer, and who answered, you or the PM with its reason. Reply in the asking thread, or name the code in any thread; the agent records your reply with `braid answer <code>`. `braid requests` lists the open ones, `braid requests <code>` one with its history, `--closed` the closed ones; the board shows each with its code and a link to the asking thread, and the item's Requests tab lists the closed ones ([the board](board.md#requests), D96 to D99 in [decisions](decisions.md)). A coordinator that waits for another braid or for a time opens its request with `--to <braid number>` or `--done-when braid:<n>|time:<iso>` and ends its turn: the running board wakes it once when the condition holds, reminds the one it waits for hourly (that coordinator can say when it expects to get to it with `braid eta <code> 2h "<why>"`; the request's details then show "expected by") and nudges a coordinator that stopped with nothing open ([wakes, reminders and nudges](board.md#wakes)). The request's text is the short line the board shows; the chat message carries the full question. Every coordinator and PM message to you ends with one marker: `✋ <what is needed>`, `⏳ Waiting for <what>` or `🟢`.

## See the board

Run `braid board` in your own checkout of `main`. It reads each item from its own branch, so a strand whose PR braid handed to you for your merge shows To Review; braid marks it Done on the braid branch after the merge (`braid accept`). The board shows where the work needs you; it can also act: Start launches a braid's coordinator, Open thread opens an item's T3 thread, and Merge asks the coordinator that handed over the PR to merge it (the board never merges itself). Ask `braid` for anything else. `braid board --demo` shows it on sample data. What the lanes mean: [the attention board](board.md). With `braid notify setup` the running board pushes to your phone over ntfy only what someone asks of you (a request to you, the PM's forward or question, a merge that is yours), each push opening the thread that asks; a lane moving alone never pushes (a programme's stall, and a braid Done that no PM runs, still do); to get the pushes without a board window open, [run the board at login](board.md#run-the-board-at-login).
