---
gate: <command that must pass before every PR, run from the repository root>
main: main
ci: []
merge-gate: "<optional: command braid runs before the merges it makes, with <pr> and <sha> filled in; exit 0 merges, anything else refuses; for example: python gate.py --pr <pr> --sha <sha>>"
merge-gate-on: "<optional: [strand, main] (the default), [main] or [strand]: which merges run the gate>"
autonomy: "<optional: the preset braids run on; careful if absent>"
shell: "pwsh 7 or bash; <optional: other shell facts>"
setup: "<optional: run first in a new worktree, for example npm ci>"
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
    L: <provider / model / options; optional tier key, also S: or M:; wins over the kind keys>
  reviewer: <provider / model / options>; skill braid-reviewer
  researcher: <provider / model / options>; skill braid-researcher
  steering:
    first: <provider / model / options>; the board's pause thread, cheap and low effort
    fallback: <provider / model / options>; another provider, for when `first`'s is over its threshold
---

# <project> for braid agents

Facts agents need and can't guess. Keep it short; general engineering practice doesn't belong here.

- Items are braids in `braids/`, kept with the `braid` CLI that the braid skills' installer installs. Edit briefs and reports directly, then run `braid check`. `.gitignore` holds `braids/**/temp/`.
- `ci`: which checks must be green. A list of names (`[verify (ubuntu-latest), verify (windows-latest)]`) means exactly those checks. `all` means every check reported on the commit, whatever its name, for projects whose checks depend on the paths a PR changes: `braid wait` waits for each of them, and calls it green only after a 2-minute start grace in which no new check appeared; `braid accept`, `braid handover` and `braid recap` read once and need at least one reported check and all of them passed. `[]` and `none` name no check: `braid wait` ends at once with nothing to wait for, `braid accept`, `braid handover` and `braid recap` still require every check that is reported on the PR head to pass (none reported passes), and a merge under an autonomy preset is refused. Write `none` when the project has no hosted CI: the gate run before the PR is the evidence.
- `merge-gate`: one command, run from the repository root through the shell, that `braid accept --merge` runs after its own checks and before each merge it makes (nine minutes at most), under every preset and on the user's request alike. Exit code 0 merges; anything else, or running out of time, refuses the merge and shows the command's output. `<pr>` and `<sha>` (the reviewed head) are filled in. It runs before anything is changed, so a refusal leaves nothing behind: run `braid accept` again. `merge-gate-on` names the merges: `strand` (a strand's PR into its braid branch) and `main` (a PR into `main`); both if absent.
- `autonomy`: the [autonomy preset](../references/autonomy.md) a braid runs on unless its brief names one: `careful` (the default: the coordinator merges and decides nothing by itself), `steady`, `free`, or the project's `autonomy/<name>.md`; `braid autonomy --list` names them. A preset that merges needs real CI (`ci` a list or `all`, not `[]` or `none`).
- `docs`: the docs braid keeps true, `public` (for users) and `internal` (for developers); without the lists, `README.md` and `docs/`. `update` says when: `strand` (every item's PR keeps the docs it touches true), `braid` (the default: a story's PR does, and every goal ends with a docs strand that brings them up to date as a whole), `both`, or `on-demand` (only when a brief or the user asks; what the user decided is still documented).
- `run`: how agents start the app to try it or take screenshots. Leave it out if there is nothing to run.
- `models`: `provider / model-id / key=value, ...`, with the exact IDs and option names the host lists (in T3: `orchestrator_capabilities`). Options left out mean host defaults. `<role>.<tier>` (tier: S, M, L) is the model for items of that tier, `<role>.<kind>` (kind: story, task, spike) for that kind of item, and a plain `<role>` for every item; the tier key wins over the kind key, so a tier L spike uses `L`. `skill <name>` after the options names a skill the agent must use.
- Real user data: <where the app keeps it>. Agents never touch it; a brief may allow a read-only look.
- Hard limits: <anything agents must never do here, for example publish, touch production, edit generated files>
- Conventions: <commit style, code layout, test location, anything project-specific>
