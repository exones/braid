---
gate: <command that must pass before every PR, run from the repository root>
main: main
ci: []
review-bots: "<optional: review bots, for example [coderabbitai]>"
reviewer-with-bots: "<optional: always (the default) or L-only>"
merge-gate: "<optional: for example python gate.py --pr <pr> --sha <sha>>"
merge-gate-on: "<optional: [strand, main] (default), [main] or [strand]>"
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

- Items are braids in `braids/`, kept with the `braid` CLI. Edit briefs and reports, then run `braid check`. `.gitignore` holds `braids/**/temp/`.
- `ci`: the checks that must be green: a list of names, `all` (every reported check) or `none` (no hosted CI; the gate is the evidence). Details: braid's `docs/getting-started.md`.
- Partial CI: say if braid-branch PRs get fewer checks, for example "Strand PRs get only path checks."
- `review-bots`: their checks go in `ci`; the worker answers and resolves their comments once at green and never waits for a bot. `reviewer-with-bots`: `always` or `L-only`.
- `merge-gate`: a command `braid accept --merge` runs before each merge (`<pr>`, `<sha>`); exit 0 merges. `merge-gate-on`: where it runs.
- Caches other builds clean (NuGet, Gradle): a per-worktree folder in `setup`.
- Path stops go in `AGENTS.md`, for example "`billing/**`: ask before merging".
- `autonomy`: the [preset](../references/autonomy.md) braids run on: `careful` (the default), `steady`, `free` or the project's own; a merging preset needs `ci` a list or `all`.
- `docs`: the docs braid keeps true, `public` and `internal` (default `README.md`, `docs/`); `update`: `strand`, `braid` (default), `both` or `on-demand`.
- `run`: how agents start the app; leave it out if there is none.
- `models`: `provider / model-id / key=value, ...`, with the IDs and options the host lists (in T3: `orchestrator_capabilities`). A tier key (`S`, `M`, `L`) wins over a kind key (`story`, `task`, `spike`), then the plain `<role>`. `skill <name>` names a skill to use.
- Real user data: <where the app keeps it>; agents never touch it.
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
