---
id: '0044'
title: "Notifications on your phone when braid needs you"
status: To Do
labels: ["kind:story", "tier:L"]
dependencies: []
related: ['0040']
delivery: epic
---

## Goal

The user finds out that braid needs them only by looking at the board or a chat. After this goal their phone gets an ntfy push the moment an item moves onto their side of the board: a question, a decision, a plan, a PR to merge, failed checks, or a stall, including a coordinator that stopped between strands and waits for nothing (user, 2026-11-20; 0040 counted six such nudges in three days).

Expected size: about 600 lines in 12 files across two strands.

## Working at the end

- With notifications set up, each new Needs You or To Review on the board sends one ntfy push naming the repo, the item, its title and the line the board shows; a restart of the board sends nothing twice.
- When a braid becomes Done (its final PR or story PR merged), one push says so.
- A braid with strands whose coordinator is not running, while no strand is worked on, asked about or in review and the braid has no open request, reads Needs You `stalled` after the usual ten minutes, and so is notified too.

## Strands

- A. ntfy notifications from the board (L): `braid notify` to set up, test and turn off; the running board sends.
- B. A braid whose coordinator stopped reads stalled (M): the board rule and its docs.

## Already decided

- The sender is the running `braid board` process (also with `--no-open`, and with `--host tailscale`): it already rereads GitHub, T3 and the requests every 30 seconds and derives the lanes, so the notifier compares each new board snapshot with what it already sent. No second poller, daemon or scheduled task.
- ntfy over plain HTTPS with Node's built-in `fetch`: no new npm dependency. The server defaults to `https://ntfy.sh`; a self-hosted server is a setting.
- What triggers a push is exactly what puts an item on the user's side today (docs/board.md, lane rules and broke alarms); this goal adds no reason of its own except strand B's braid-level stall. The one other event is a braid becoming Done (user, 2026-11-20).
- Related to 0040 (Autonomy presets, on `braid/0040-autonomy-presets`): 0040 cuts the questions the coordinator asks; this goal reports the ones that remain. 0040 changes skills and recaps, this goal `src/board` and a new `braid notify`; neither edits the other's files, so either may merge first.

## Out of scope

- Other channels (email, Slack, Telegram, desktop toasts) and notifications for other events (a strand merged, a PR opened).
- Detecting an agent whose thread runs but makes no progress: T3 can't tell that apart from a long run.
- Skill changes: coordinators keep asking through `braid ask` and `braid handover` as now.

## Completion

- [ ] With notifications set up and the board running, a new Needs You or To Review item reaches the phone once, and a board restart doesn't repeat it
- [ ] A braid that becomes Done while the board runs sends one push
- [ ] A braid between strands whose coordinator stopped without asking reads Needs You `stalled` and is notified
- [ ] docs/board.md, docs/cli.md and docs/decisions.md describe notifications and the braid-level stall
- [ ] The gate command from BRAID.md passes
