# 0032 report

## What changed

- `README.md` reworked (95 to 140 lines): a pitch with the board as hero, **What it can do**, **Why braid**, a walk-through of "braid: add dark mode", the parts, then the quick start, CLI, docs table, contributing and licence as before.
- `docs/images/`: new `board.png` (hero), `item-page.png`, `board-phone.png`, `inbox.png` (real, from `braid board --demo`), `coordinator-thread.png` and `flow.png` (illustrative mock-ups, labelled so in captions and alt text). About 1 MB in total.
- `docs/design/readme/`: the HTML sources of the two mock-ups and `README.md` saying how each image was made.

## Why

0017's front page read as a manual: no "why", no benefits, one old screenshot. The user approved the proposal (shape and wording as proposed, light images only, board as hero) and asked for one fix, applied: the mock-up's "Ask first" line now names strand C, the one that stores the choice per user.

## Claims and what backs them

| README claim | Backed by |
| --- | --- |
| Plan a goal into strands, PR per part, you approve the plan | `.agents/skills/braid/SKILL.md`, [workflow](../../.agents/skills/braid/references/workflow.md) |
| Independent review, reviewer settable to another model | `braid-reviewer` skill, `models` in `BRAID.md` (D11, D28) |
| Resume from the files | D08, D34, D35 (`braids/` folders, per-thread logs) |
| Board: what needs you, Start, Merge, Open thread | `docs/board.md`, D46, D51, D52 |
| Phone layout; `--host` on Tailscale, own login only | D59, D60, `docs/board.md` |
| Stops and asks (security, dependency, data, outward, scope) | `references/stop-cases.md` |
| Auto mode: seven conditions, final PR into main is the user's | `references/auto-mode.md`, D31 |
| Idea inbox: `$braid-idea`, `braid note` | D54 to D56, `docs/cli.md` |
| Claude, Codex, Cursor | `scripts/Install-Skills.ps1`, `docs/getting-started.md` |
| One writer per branch; red only where something went wrong | `AGENTS.md`, D32 |

No claim about parallel strands, npm publication or other products.

## Validation

- `npm run verify` passed (299 tests, 0 failed).
- README rendered on GitHub on the PR branch, logged out, light and dark (Edge, `prefers-color-scheme` emulated): the logo switches, badges and images show. Screenshots: `~/.braid/artifacts/agento/0032/gh-light.png` and `gh-dark.png`.
- `braid check` OK.

## Open

None.

For later items: the board has no dark theme (its screenshots are light on a dark README page); a dark theme would be its own item. The demo's strand page shows "Brief" text "It works." from the sample data, which reads a little thin in a screenshot.
Needs the user: none
