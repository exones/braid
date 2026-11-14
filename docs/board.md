# The attention board

`braid board` serves a local, read-only page that shows where the work needs you. It listens on `127.0.0.1` at a free port, prints the address and opens the browser (`--no-open` only prints it). Stop it with Ctrl+C. The files it reads are described in [the braids/ format](braids-format.md); why it is an attention board is decision D32 in [decisions](decisions.md).

## Lanes

The lanes say what a braid asks of you, not the braid's own status. A braid with strands sits in the lane of its **most urgent** strand: Needs You, then To Review, then Working, then To Do. It is Done only when every strand is. A braid without strands follows its own state. The card's progress bar counts done strands, so it still shows how far the braid really is.

| Lane | In code | Means | Colour |
| --- | --- | --- | --- |
| To Do | `To Do` | not started; `Outline` items show here with a badge | light grey |
| Working | `In Progress` | started, or an agent is running; nothing needs you | blue |
| To Review | `In Review` | an open PR waits for your review or merge | purple |
| Needs You | `Waiting` | it can't go on without you; the icon says why | amber |
| Done | `Done` | finished | green |

The labels live in one place, `LANE_LABEL` in `src/board/marks.ts`. Stored statuses in `brief.md` keep their names (`Outline`, `To Do`, `In Progress`, `Done`).

## How an item's lane is chosen

For each braid and strand, the first rule that matches wins (`derive` in `src/board/model.ts`):

1. Stored status `Done`: Done.
2. An `ask:<key>` label, unless its PR is merged: Needs You, reason `<key>`.
3. A merged PR: Done.
4. A running T3 thread: Working, or Needs You with reason `question` when the thread has a pending request. Failing checks don't count while an agent works.
5. An open PR: To Review, or Needs You with reason `checks failed` when its checks fail.
6. T3 threads that stopped (interrupted or cancelled) and no PR: Needs You, reason `agent stopped`.
7. Otherwise the stored status: `Outline` and `To Do` show in To Do, `In Progress` in Working.

## Where the states come from

- **Files:** each item's `brief.md`, read from its own branch when it has one ([Branches](braids-format.md#branches)).
- **GitHub:** one `gh pr list` per refresh; a PR belongs to the item named by its head branch (`braid/0006-slug` or `braid/0006/A-slug`). Merged PRs are cached.
- **T3:** `t3 thread list --project <main checkout>`, plus `t3 thread show` where needed (cached per thread). A thread belongs to an item by its linked PR; else by its `pullRequests` only when it lists exactly one, since a coordinator thread lists many; else by its worktree path, matched to `git worktree list`; else by its branch.
- Without `gh` or T3 the board still works on the stored states and its header says why.

## Icons

Cards and strand rows show no lane text. Icons carry the detail, with the exact text on hover (also the `aria-label`). A card shows each distinct icon of its strands once.

| Icon | Means | Hover |
| --- | --- | --- |
| amber `?` | an agent asked a question | Agent asked a question: waiting for your answer |
| red circle with a cross | checks failed | Checks failed: names of the failing checks |
| red circle with a stop square | an agent stopped with no PR | Agent stopped: no running thread and no PR |
| amber flag | an `ask:<key>` label | Needs your decision: `<key>` |
| purple eye | a PR to review | PR #N to review |
| blue wrench | an agent is running now | agent running |
| green tick | Done | Done |

Red appears only where something went wrong. Green means Done.

## Refresh

The page updates every 30 s while it is open, 200 ms after a file under `braids/` changes, and by its Refresh button (a fresh read, `?fresh=1`). Updates are pushed over `/api/events`.

## Demo

`braid board --demo` serves built-in sample braids (`src/board/demo.ts`) with faked GitHub and T3 states, so every lane and icon shows. It reads no repository, `gh` or `t3`, and writes nothing. `--demo-t3-down` shows the note for T3 not running. The screenshots in `docs/design/board-screenshots/` come from it ([the board](design/board-screenshots/09-demo-expanded.png)); the mockups the user approved are in `docs/design/board-mockups/` ([legend](design/board-mockups/14-live-legend.png)).

## Changing the board

Visible changes start with mockups on the demo data, which the user approves before the build. The PR that changes the board's behaviour or look also updates this page.
