# 0072/E report

## What changed

- braid skill, "Talking to the user", "A reply to an open request": record the reply, recap in one line what was understood and what happens next, then act without waiting for a confirmation. Requests are named `<handle>` there (0072/G).
- braid skill, "Launched by a PM": the PM's answer arrives already recorded, as the board's `Wake: <handle> answered by the PM: …` (0072/D) or the PM's message; it counts as the user's reply within the same limits; the coordinator recaps it in one line and acts, recording nothing. The user's reply still wins; forwarded and the PM's own requests stay unclosed (shortened).
- braid-pm skill, "Answering coordinators": the PM answers on the record itself, `braid answer <handle> --from pm --reason "<what>, because <why>, instead of <alternative>" --file -`, which wakes the coordinator; a user's answer given in the PM thread is recorded the same way without `--from` and `--reason`. The PM recaps each user answer in one line. The separate "Every decision … goes on record" paragraph and "Relay the user's answer to the coordinator" are folded in (the board's wake replaces the relay).

## Why

Inbox idea 2026-11-21-t7b8 (the user wants a short recap of what the agent understood before it continues), and 0072/D moved recording a PM answer to the PM, with the board waking the coordinator.

## Validation

- Words in `.agents/skills/` (`cat $(git ls-files .agents/skills) | wc -w`): 19545 at eba56b6, 19538 after (−7).
- `braid check`: OK.
- Gate `npm run verify` locally: exit 0, 745 pass, 0 fail, 9 m 50 s.

## Docs

None affected: docs/board.md, docs/cli.md and docs/braids-format.md already describe the PM recording its own answer and the wake (0072/D); the skills were the lagging part.

## Open

None.

For later items: the braid skill's "A turn that waits" bullet still says `braid ask` "prints its code"; it prints the handle since 0072/G (0072/F fixes the same in the CLI help and docs/cli.md).
Needs the user: none
