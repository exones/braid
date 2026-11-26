# Provider limits

How a braid's agents stop cleanly before a provider's usage limit and start again after the reset. The running board pauses and resumes by code: it sends each working agent on a provider over its threshold its own pause text, reads the `Paused:` replies in their threads, and resumes them after the reset, early when usage drops, or on the user's Resume now. Its texts are self-contained; do what they say. A busy agent gets the text at its next turn. Coordinators and PMs keep no limits check task, schedule no resume and run no `braid pause` for a limit. `braid limits` and `braid resume --limit` are in the project's `docs/cli.md`; the board's side is `docs/board.md`, "Provider limits".

## Check before launch

Before launching a worker, reviewer, researcher, spike or coordinator, run `braid limits --role <role> --kind <kind>` (or `--tier <S|M|L>`) for that agent's model.

- Exit 0, `ok`: launch. Exit 0, `unknown` (stale cache, no numbers, `unsupported` such as `cursor`; also with a `blind since` line): launch, and say so in one line. Unknown never pauses.
- Exit 3, `pause`: launch nothing on that provider, say so once with the provider, window and resume time it prints, and end the turn. A PM-run coordinator also sends its PM `<number>: <provider> <window> over its threshold, resumes <time>; launching nothing` once per window. Don't poll or schedule anything.

## On the board's texts

- **Pause** (`Pause for <provider> …`): finish or undo the current step, commit and push, log a checkpoint, and end the turn with the `Paused:` line the text names (a worker its item id and head, a coordinator its number). Reply to no other thread. A coordinator messages no worker: the board paused them directly. Until a resume, a wake is noted, answered only as the text says, and the turn ends again.
- **The PM's summary** (`Direct pause: …`): launch nothing on that provider, note the pause in the plan file, end the turn. No reply.
- **Resume** (`Resume: …`): check the state first (your checkpoint and log; a coordinator its branches, worktrees, threads and `braid next`), then go on. Run no `braid resume`.
- **The PM's resume ask** (`… Paused braids: …`): resume each braid in your order with `braid resume <number> --limit`; it clears the board's record and sends each agent its resume text by code. `braid resume --limit --all` does every board pause of the repository.
- **A pause that didn't reach everyone** (the board's message lists the silent agents): read their threads and pause them by hand if they still run.
- **A weekly window** pauses the same way and shows the braid in Needs You until the reset. Never switch providers yourself: the user edits the role in `BRAID.md` `models` and says go, then `braid resume <number> --limit`.

## Without a running board

Nothing pauses and nothing resumes (no board, or `--no-pause`); the check before a launch still holds. When the user says go on or the reset has passed, `braid limits` exits 0: launch and go on; `braid resume <number> --limit` clears a leftover limit record (a hold stays). A user's "pause, limit close" means: send each agent on that provider a pause text like the board's, wait for the `Paused:` lines, end the turn until the user's go. A plain "hold" is a hold ([autonomy](autonomy.md), "Hold").
