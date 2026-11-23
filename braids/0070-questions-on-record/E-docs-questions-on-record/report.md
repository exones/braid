The docs now describe questions on record as a whole: README, getting started, the CLI help, the format, autonomy, the board, decisions and the roadmap. 0070/A–D had already documented their own commands and board changes. This strand fills the gaps between them (the overview, the upgrade path, the recap and `braid decisions` reading the record, D82's superseded `Decided:`) and makes the one skill wording fix the user asked for.

What changed:

- `README.md`, "Stops and asks when a decision is yours": each question is on the record with a code, shown on the board with a link to the asking thread, answered in chat (the code can be named in any thread), and listed with who answered. The end markers ✋, ⏳ and 🟢.
- `docs/getting-started.md`:
  - New section "Questions and answers": `braid ask`, then the question in chat in the turn's last message with the code and lettered options; no dialog; the record's history (asked, answered, withdrawn, met, who answered and the PM's reason); `braid answer <code>`, `braid requests [<code>] [--closed]`; the board; the end markers.
  - "Updating from a braid before the request record": `.braid/requests.json` is carried over once onto `braid-requests` by the first command that reads or writes requests, and renamed `requests.migrated.json`.
  - "Merging and autonomy presets": the recap and `braid decisions` show your answers and the PM's next to the `Decided:` entries.
- `src/cli.ts`: the `recap` help line names the `Decided:` entries and answered requests (0070/B's review).
- `docs/braids-format.md`: `braid decisions` and `braid recap` read the answered requests from the record too (0070/B's review).
- `docs/autonomy.md`, "What the CLI enforces": the same (0070/B's review).
- `docs/board.md`: a PM request leaves when the PM records your reply with `braid answer <code>` or withdraws it, no longer `braid answer <id> --by pm`.
- `docs/decisions.md`:
  - D82 notes that D99 supersedes its `Decided:` for the PM's decisions; D99 says the PM's `--from pm` reason is that decision on the record (0070/D's review).
  - The user's words from 0070's "Already decided" added where a decision lacked them: D97 (waits as requests, "Yes"), D99 ("not only via chat, but via braid cli"; on ⏳).
- `docs/roadmap.md`: questions on record (0070, built), with P6 named as what comes next on top of it.
- `.agents/skills/braid/SKILL.md`, "Launched by a PM": "the user's answer on the board" becomes "the user's reply". The board has no Answer button (asked by the user through this braid). Nothing else in the skill changed (6371 → 6368 words).

Why: the brief's goal; the board has no Answer button (D98), so the skill's wording pointed at something that doesn't exist.

Upgrade path, checked by hand: in a temporary clone (its own bare `origin`, temporary `HOME`), I put an open pre-0070 request (`id`, `kind`, `text`, `at` 2026-11-20, `thread`) in `.braid/requests.json` and ran `braid requests` with the built CLI. It listed `q-ctz4  0070/E  question  3d  <text>`. The branch `braid-requests` had `requests/q-ctz4.json` and the file was renamed `requests.migrated.json`. A second run listed the same single request (no duplicate), and `braid requests q-ctz4` showed the original time and thread. The carry-over stayed local until the next write: `braid answer q-ctz4 --file -` pushed both commits ("carry over 1 from .braid/requests.json", then the answer) to the bare `origin`.

Validation:

- `rg` finds no `braid answer <id> --by pm`, `.braid/requests.json` as the current store, or question-tool instruction left in the docs; the old file is mentioned only as what migrates.
- The command forms in the new text match the usage lines in `src/commands/requests.ts`.
- Gate: `npm run verify` passed.

Docs (BRAID.md `docs`):

| Doc | |
| --- | --- |
| README.md | updated |
| docs/getting-started.md | updated |
| docs/cli.md | unchanged (0070/A–B already describe ask, answer, withdraw, requests, handover, decisions, recap) |
| docs/board.md | updated (one line) |
| docs/autonomy.md | updated |
| CLI help text (src/cli.ts) | updated (recap line); the other request lines already matched |
| docs/development.md | unchanged (nothing about requests) |
| docs/decisions.md | updated |
| docs/braids-format.md | updated |
| docs/roadmap.md | updated |
| docs/npm-distribution.md | unchanged (nothing about requests) |

Open: nothing.

Decisions: the upgrade note sits in getting started's install section, where updating is described, and not in `docs/npm-distribution.md`, which is about publishing.

For later items:

- The braid skill's "Launched by a PM" also says "A reply from the user on the board still wins". The board has no Answer button there either; "a reply from the user still wins" would match. I left it out because the brief kept the skill edit to the one wording; it needs the user's go.
- In this run `braid answer` printed its line as `Q-ctz4 0070/E: answered by the user: Keep it.` (a capital Q) in Git Bash, though the source writes the code as is. Not investigated; worth a look if it repeats.

Needs the user: none
