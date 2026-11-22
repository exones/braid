---
id: '0062/E'
title: "Skills: the programme manager routes through the board"
status: In Progress
labels: ["kind:task", "tier:L", "ask:process"]
dependencies: ['0062/B', '0062/C', '0062/D']
order: 50
---

## Goal

The skills use what B to D built:

- **Under a PM, a coordinator** opens its requests addressed to the PM.
- **The PM** asks the user through the board, forwards what it can't decide, keeps its plan file in the front matter the board reads, and records a hold the board shows.
- **The name:** the skills call it a programme manager.

The user asked for these skill changes in this braid's plan (2026-11-21), and the user merges them.

Expected size: about 220 lines in 5 files.

## Start here

- `braids/0062-*/A-*/report.md`: questions 2, 3, 6 and 7, and "Strands, restated", E.
- `.agents/skills/braid-pm/SKILL.md` and `assets/plan.md`. `.agents/skills/braid/SKILL.md`, "Launched by a PM". `references/limits.md`, "Under a PM", as 0061/D left it.
- What B, C and D built: `braid ask|handover --to pm`, `braid forward`, `braid ask pm/<slug>`, `--by pm`, `--kind action`, `braid pause --hold`, `braid check --plan`, the plan front matter.

## Change

- **`braid-pm`:**
  - Name it "programme manager" in prose. `braid-pm`, the `🧭 <repo> pm:` titles and the `pm/<slug>` branches stay.
  - Keep the plan file's front matter (the template changes) and run `braid check --plan` before each push.
  - Ask the user with `braid ask pm/<slug>` or `--by pm`, with `--kind action` for something only the user can do. Still write the message in chat too, context first, and never use the question tool.
  - Forward what it won't decide with `braid forward`, and write `digest` in the front matter.
  - "Hold": add `braid pause <n> --hold "<words>" --thread <PM thread> --by pm` for each running braid, set the plan's `hold`, and run `braid resume` on "go".
  - Build on 0061/D's "Provider limits" and edit around it; don't rewrite it.
- **The braid skill, "Launched by a PM" only:** open requests with `--to pm` on `braid ask` and `braid handover`. Never close a request the user still has to act on (an `action`, or one the PM forwarded).
- The install test, if a name changes.

## Already decided

- The user approved the design (logged on 0062/A).
- 0061/D (PR #231) is merged into 0061's branch. This strand starts after 0061 merges into `main`.
- Related to 0036 and 0060, which also change the braid skill: this strand changes only "Launched by a PM" in it.

## Out of scope

- The braid skill outside "Launched by a PM", `AGENTS.md`, `CLAUDE.md` and `BRAID.md`.

## Completion

- [ ] `braid-pm` and "Launched by a PM" use `--to pm`, `braid forward`, `braid ask pm/<slug>`, `--by pm`, `--kind action` and `braid pause --hold` as built
- [ ] The plan template has the front matter, and the skill validates it with `braid check --plan` before each push
- [ ] The name "programme manager" throughout; `braid-pm`, `🧭 … pm:` and `pm/<slug>` unchanged
- [ ] braid-pm's "Hold" records `braid pause --hold` per running braid and the plan's `hold`, and 0061/D's "Provider limits" is unchanged
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open

## Plan

- `braid-pm/SKILL.md`: "programme manager" in prose (title, description, intro); `braid-pm`, `🧭 <repo> pm:` and `pm/<slug>` stay.
- "The plan file": the front matter the board reads (`programme`, `title`, `goal`, `thread`, `limit`, `state`, `hold`, `next`, `digest`, `rows`), kept in step with the body; `braid check --plan pm/<slug>.md` before each push.
- "Answering coordinators": ask the user with `braid ask <number> --by pm` (one braid) or `braid ask pm/<slug>` (the programme), `--kind action` for what only the user can do; still in chat, context first, no question tool; `braid answer --by pm` when answered. Forward what it won't decide with `braid forward <id> --note`; answer and close only requests it decides.
- "The digest": write it to `digest` in the front matter too.
- "Hold": `braid pause <n> --hold "<words>" --thread <PM thread> --by pm` per running braid, plan `hold` and `state: held`; on go `braid resume <n>`, clear `hold`, `state: running`. "Provider limits" left as 0061/D wrote it.
- `assets/plan.md`: the front matter; the header line drops what moved into it.
- braid skill, "Launched by a PM" only: `--to pm` on `braid ask` and `braid handover`; close (`braid answer`) only a request the PM decided, never one forwarded to the user or an `action`.
- Install test: no name changes, so unchanged. Docs: getting-started's naming line; the rest is 0062/F's.
