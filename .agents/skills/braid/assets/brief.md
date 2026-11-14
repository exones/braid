# A braid brief

An item is a braid (`0012`) or one of its strands (`0012/A`), a folder under `braids/` with a
`brief.md` (front matter, then the brief), an optional `report.md` and one log file per thread. The
coordinator creates it; its worker owns it from then on. `braid` holds the logic (numbers, letters,
logs); edit `brief.md` and `report.md` directly like any Markdown file, then run `braid check`, which
must print `braids OK`. The format is `braid help` and the braid repository's `docs/braids-format.md`.

## Fields

- `status`: `Outline`, `To Do`, `In Progress` or `Done`. An Outline holds only the goal, what works at
  the end, strand titles and open questions; it is detailed into a full brief when its turn comes.
- `labels`: `kind:story|task|spike` and `tier:S|M|L`, plus `ui` for new or noticeably changed
  user-facing UI, and `ask:<key>` for each [stop case](../references/stop-cases.md) the plan already shows.
- `dependencies`: real prerequisites only. `order`: run order among a braid's strands, 10, 20, 30, so
  one can slot in between.
- `delivery`: leave the default `epic`; the strands of a braid merge into its branch, then one PR into `main`.

## Create (coordinator, on a branch it holds)

```sh
braid new 'Title' --labels 'kind:story,tier:M' --dep 0003    # prints the id and folder
braid strand new 0012 'Title' --labels 'kind:task,tier:S' --order 10
```

Then write the body into the printed folder's `brief.md`, below the front matter:

```markdown
## Goal

<one to three sentences: the outcome and who it is for; for a spike the question, the time box and the decision it feeds>

Expected size: about <N> lines in <K> files.

## Start here

- `<path>`: <what to look at and why, in reading order>

## Change

- `<path>`: <what to add or change>

## Already decided

- <a fact or choice; don't re-investigate>

## Out of scope

- <what not to touch or build>

## Acceptance

- [ ] <first testable outcome>
- [ ] CI green on Windows and Ubuntu

## Definition of done

- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
```

A spike's answer, evidence and proposed follow-ups are its `report.md`; the worker proposes
follow-ups, the coordinator creates them.

## Work on it

```sh
# worker, on its strand branch
braid edit 0012/A --status 'In Progress'                 # first commit
braid brief 0012/A Plan --file -                         # before coding; or edit brief.md
braid log 0012/A --thread <your thread id> 'Found X; decided Y.'   # with the commit it explains; staged, not committed
# tick the boxes you proved in brief.md; write report.md (or braid report 0012/A --file <path>)
braid edit 0012/A --status Done                          # last commit, after CI is green

# coordinator, on plan/ or the braid branch, for items that haven't started
braid edit 0012/B --dep 0012/A --order 20                # --dep and --labels replace the list: repeat the others
```

`report.md`: what changed, why, validation, anything open, then `For later items:` (changed names or
interfaces, deviations from the plan, new decisions, or `none`) and `Needs the user:` (`none`, or
`<key>: <one sentence>` per case). It describes the PR as it stands: after a fix round the worker
rewrites it; the history is in the log.

The braid's log: after each strand merges into the braid branch, and before the next strand's branch
is cut, the coordinator adds one entry on the braid branch:

```sh
braid log 0012 --thread <your thread id> '0012/A merged: PR #41, abc1234. Done: <short report>. For later items: <or none>. Plan changes: <since the last entry, and why, or none>. User decided: <or none>.'
```

## Read

```sh
braid list                 # every braid and its strands: id, status, order, title
braid view 0012/A          # fields, folder, report, logs and the brief
braid check                # after any direct edit, and after a merge conflict in braids/
```
