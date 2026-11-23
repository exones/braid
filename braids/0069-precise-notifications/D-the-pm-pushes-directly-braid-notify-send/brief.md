---
id: '0069/D'
title: "The PM pushes directly: braid notify send"
status: In Progress
labels: ["kind:story", "tier:L"]
dependencies: ['0069/B']
order: 40
---
## Goal

The PM can push the user directly for things with no board item, its digest and "nothing can run until you act", with `braid notify send`, through the board's ntfy settings and privacy rules, opening the PM's thread. The braid-pm skill uses it where it now writes only in chat, and comes out no longer than it went in.

Expected size: about 100 lines in 4 files, plus a few changed lines in `.agents/skills/braid-pm/SKILL.md`.

## Start here

- `src/commands/notify.ts` (`setup`, `test`, `off`), `src/notify/sender.ts`, `src/notify/config.ts` (server, topic, `BRAID_NTFY_TOKEN`).
- `docs/board.md` "Notifications", its "Privacy" paragraph.
- `.agents/skills/braid-pm/SKILL.md` "The digest" (when the digest goes out, and "when nothing can run until the user acts").

## Change

- `braid notify send "<one line>" --thread <thread id> [--programme <slug>]`: one push, titled `<repo> pm/<slug>: the PM` (without `--programme`: `<repo>: the PM`), the line as body (cut at 200 characters), 🧭, high priority, click the thread's T3 link, a sequence ID per programme so a newer one replaces the older. It works without a running board; with notifications off or not set up it prints why and exits 0, so a PM never fails on it. It never prints the topic or the token.
- Its help text and usage line.
- `.agents/skills/braid-pm/SKILL.md`: the digest and "nothing can run until you act" are also pushed with `braid notify send`, a line saying what is waiting and no repository details (the topic may be public). Replace words rather than add a section: the skill is no longer than before.
- Tests: the publish body, the off and not-set-up cases, no topic or token in the output.

## Already decided

- ntfy only, never T3's push tool, so nothing arrives twice.
- The command sends at once; the board isn't involved, and nothing is stored.
- The skill edit is an agent-instruction change: tier L, and the user merges it with the final PR.

## Out of scope

- The braid, worker and reviewer skills; T3 notifications.

## Completion

- [ ] `braid notify send` pushes one line opening the given thread, and does nothing (exit 0, a line saying why) with notifications off or not set up
- [ ] Tests cover the publish body and that no topic or token is printed
- [ ] The braid-pm skill pushes the digest and "nothing can run until you act" with it, and is no longer than before (line and word counts before and after in report.md)
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
