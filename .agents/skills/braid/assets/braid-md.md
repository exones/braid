---
gate: <command that must pass before every PR, run from the repository root>
main: main
ci: []
review-bots: "<optional: bots that review PRs, by check name or comment author, for example [coderabbitai]>"
reviewer-with-bots: "<optional: always (the default) or L-only>"
merge-gate: "<optional: run before braid's merges; for example python gate.py --pr <pr> --sha <sha>>"
merge-gate-on: "<optional: [strand, main] (the default), [main] or [strand]>"
autonomy: "<optional: the preset braids run on; careful if absent>"
shell: "pwsh 7 or bash; <optional: other shell facts>"
setup: "<optional: run first in a new worktree, for example npm ci; set NUGET_PACKAGES to a folder in the worktree>"
test: "<optional: focused test command, for example npx vitest run <file>>"
run: <optional: command that starts the app locally for manual or UI checks, and its URL if it serves one>
docs:
  update: <optional: strand, braid, both or on-demand; braid if absent>
  public:
    - README.md
    - <docs for the project's users, for example docs/getting-started.md, help text>
  internal:
    - <docs for its developers, for example docs/development.md, the decisions record>
models:
  coordinator: <provider / model / options>
  worker:
    story: <provider / model / options>
    task: <provider / model / options>
    spike: <provider / model / options>
    L: <provider / model / options; optional tier key, also S: or M:>
  reviewer: <provider / model / options>; skill braid-reviewer
  researcher: <provider / model / options>; skill braid-researcher
  steering:
    first: <provider / model / options>; the board's pause thread, cheap and low effort
    fallback: <provider / model / options>; another provider, for when `first`'s is over its threshold
---

# <project> for braid agents

Facts agents need and can't guess; keep it short.

- Items are braids in `braids/`, kept with the `braid` CLI. Edit briefs and reports directly, then run `braid check`. `.gitignore` holds `braids/**/temp/`.
- `ci`: the checks that must be green. A list of names means exactly those. `all` means every check reported on the commit, for checks that vary by path; `braid wait` waits for each after a 2-minute start grace. `[]` and `none` name none: nothing to wait for, reported checks must still pass, and no preset merges; `none` means no hosted CI, so the gate is the evidence.
- Partial CI: say when PRs into a braid branch get fewer checks, for example "Strand PRs get only path checks; the full build runs for `main`." A strand's evidence is then the worker's gate: its report gives the gate's output summary and duration.
- `review-bots`: list their checks in `ci` (or use `ci: all`) so green CI means reviewed; at green the worker reads their threads once, fixes, answers or marks as a nit and resolves each comment, and never waits for a bot. `reviewer-with-bots`: `always` (the braid reviewer reads them too) or `L-only` (S and M items the bots reviewed get none).
- `merge-gate`: a command `braid accept --merge` runs from the repository root before each merge it makes, under every preset, with `<pr>` and `<sha>` (the reviewed head) filled in; nine minutes at most. Exit 0 merges; anything else refuses with its output and changes nothing, so a script that reports failure only in its output needs a wrapper or an exit-code flag. `merge-gate-on`: `strand`, `main` or both (the default); `[main]` for a gate that reads a full build only PRs into `main` get.
- Caches other builds clean (NuGet, Gradle) get a per-worktree folder in `setup`.
- Path stops go in `AGENTS.md`, for example "`billing/**`: ask before merging"; a `merge-gate` can refuse such paths for `main`. Path-scoped checks (narrower ones for docs-only PRs) belong in the gate script.
- `autonomy`: the [preset](../references/autonomy.md) braids run on unless a brief names one: `careful` (the default), `steady`, `free` or the project's `autonomy/<name>.md` (`braid autonomy --list`). A preset that merges needs `ci` a list or `all`.
- `docs`: the docs braid keeps true, `public` (for users) and `internal` (for developers); without them, `README.md` and `docs/`. `update`: `strand` (each item's PR keeps the docs it touches true), `braid` (the default: a story's PR does, and a goal ends with a docs strand), `both`, or `on-demand` (only when asked; the user's decisions are still documented).
- `run`: how agents start the app to try it or take screenshots; leave it out if there is none.
- `models`: `provider / model-id / key=value, ...`, with the IDs and option names the host lists (in T3: `orchestrator_capabilities`); options left out mean host defaults. A tier key (`S`, `M`, `L`) wins over a kind key (`story`, `task`, `spike`), which wins over a plain `<role>`. `skill <name>` names a skill the agent must use.
- Real user data: <where the app keeps it>. Agents never touch it; a brief may allow a read-only look.
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
