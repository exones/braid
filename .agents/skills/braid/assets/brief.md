# A braid brief

An item is a braid (`0012`) or one of its strands (`0012/A`): a folder under `braids/` with a `brief.md` (front matter, then the brief), an optional `report.md` and one log file per thread. Who creates, owns and finishes an item is in [the workflow](../references/workflow.md). The format is `braid help` and the braid repository's `docs/braids-format.md`.

## Fields

- `status`: `Outline`, `To Do`, `In Progress` or `Done` (workflow, "Items are braids").
- `labels`: `kind:story|task|spike` and `tier:S|M|L` (workflow, "Tiers"), plus `ui` for new or noticeably changed user-facing UI, and `ask:<key>` for each [stop case](../references/stop-cases.md) the plan already shows.
- `dependencies`: real prerequisites only. `order`: run order among a braid's strands, 10, 20, 30, so one can slot in between.
- `related`: braids only; set as the skill's "Plan" step 3 says. Each link also gets a line under "Already decided".
- `autonomy`: braids only, and only at the user's request: the preset the braid runs on (`braid new|edit --autonomy <name>`); without it the project default applies. Its exceptions go in a `## Autonomy` section of free text.
- `delivery`: leave the default `epic`; the strands of a braid merge into its branch, then one PR into `main`.

## Create

```sh
# coordinator, on a branch it holds; each prints the id and folder
braid new 'Title' --labels 'kind:story,tier:M' --dep 0003 --related 0025
braid strand new 0012 'Title' --labels 'kind:task,tier:S' --order 10
# then write the body below into the printed folder's brief.md, under the front matter
```

```markdown
## Goal

<one to three sentences: the outcome and who it is for; for a spike the question, the time box and the decision it feeds>

Expected size: about <N> lines in <K> files.

For a spike, or a story that includes research, add under Change: look at <how wide: how many sources, of which kinds>, read each one rather than its title, record each in `sources.md` in the item folder in the [braid-researcher](../../braid-researcher/SKILL.md) source line format, and cite source ids (`[S1]`) for claims in `report.md`; name that file in Completion.

## Start here

- `<path>`: <what to look at and why, in reading order; context, not a plan: the worker writes the plan>

## Change

- `<path>`: <what to add or change>

## Already decided

- <a fact or choice; settled, not to be re-investigated>
- Related to <id> (<title>, on `<branch>`): <what is shared>; <how the two stay apart: order, which merges first>.

## Out of scope

- <what not to touch or build>

## Completion

Only what the worker can do and prove; none for the reviewer, coordinator or user. A goal's own brief has no worker: its boxes cover the whole, and the coordinator ticks them at "Finish". The docs box goes where `docs.update` in `BRAID.md` calls for it: every brief with `strand` or `both`, a story and the docs strand with `braid` (the default), none with `on-demand`.

- [ ] <first testable outcome>
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] Research items only: `sources.md` in the item folder (per source: id, link, version, access date, how it was read (whole, part, search result only), what it says, adopted or not and why), and `report.md` cites source ids for its claims
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
```

## Work on it

```sh
# worker, on its item's branch
braid brief 0012/A Plan --file -              # the plan, before coding; or edit brief.md
'Found X; decided Y.' | braid log 0012/A --thread <your thread id> --file -
                                              # staged, not committed: commit it with the change it explains
braid report 0012/A --file <path>             # or write report.md directly (template below)
# tick the Completion boxes you proved; no CI box: braid accept checks CI

# coordinator, on plan/ or the braid branch, for items that haven't started
braid edit 0012/B --dep 0012/A --order 20     # --dep and --labels replace the list: repeat the others; `none` clears one

# coordinator: accept an item; <link>: the review comment (not for tier S); never commits on the PR's branch
braid accept 0012/A --review <link> --thread <your thread id> --log -
                                              # strand merged: on the braid branch; pulls, commits the log entry, pushes
braid accept 0012/A --head <reviewed sha> --review <link> --thread <your thread id> --merge --log -
                                              # strand on request: merges that head first; --preset: a merge under the braid's preset
braid accept 0013 --head <reviewed sha> --review <link> --thread <your thread id>
                                              # story or final PR: checks, before the handover

# the braid's log entry, on standard input of a strand's braid accept
'0012/A merged: PR #41, abc1234. Done: <short report>. For later items: <notes for later strands, and the ids of the leftovers captured, or none>. Plan changes: <since the last entry, and why, or none>. User decided: <or none>.'

# pass log and report text on standard input (--file -, --log -) whenever it may hold quotes:
# on Windows the braid.cmd shim splits an argument that holds a quoted phrase
```

`report.md`:

```markdown
<what changed, why, validation, anything open>

Decisions: <the user's answers (`braid decisions`), then your own, or none>
For later items: <for later strands: changed names or interfaces, deviations from the plan, new decisions; then gaps for a later item, each self-contained (what, where, why); or none>
Needs the user: <none, or per stop case `<key>: <what it is about, then what is needed>`>
```

## Read

```sh
braid list                 # every braid and its strands: id, status, order, title
braid view 0012/A          # fields, folder, report, logs and the brief
braid check                # after any direct edit of brief.md or report.md, and after a merge conflict in braids/; must print `braids OK`
```
