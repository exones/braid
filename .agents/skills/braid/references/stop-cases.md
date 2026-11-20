# Stop cases

The cases where braid may need the user (`braid ask --key <key>`, or a handover recap). Every role judges against this list and uses these keys.

| Key | Meaning | Examples |
| --- | --- | --- |
| `security` | The change touches who can do what, or what is exposed. | Authentication or authorization, permissions, secrets, cryptography, sandboxes or tool restrictions, handling of untrusted input, network exposure, logging of personal data. |
| `dependency` | The project relies on something new or different. | A new library or tool, a major version bump, a new external service or paid API, a licence change. |
| `architecture` | The shape of the system or its contracts changes. | A new module, service, process or storage; a changed public API, CLI, config or file format; a refactor across many files. |
| `data` | Stored data changes or can be lost. | A migration, a changed stored format, deleting or rewriting user data, a backward-incompatible change. |
| `process` | How the project is built, checked or instructed changes. | Skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, CI workflows or the gate; deleted, skipped or weakened tests. |
| `outward` | An effect outside the repository. | Publishing, releasing, deploying, sending messages, anything irreversible outside the repository. |
| `scope` | The work departs from what was agreed. | A change to the goal or its Completion boxes, growth beyond the mandate, new tier L work, a deviation from the brief. |
| `quality` | The normal loop isn't converging. | Still blocking after 2 fix rounds, worker and reviewer disagree, the same check fails twice, a merge conflict outside `braids/`, a worker that fails twice. |

The braid's autonomy preset (`braid autonomy <number>`) decides, per case, who decides: its row says when the agent decides itself and when the user is asked. When unsure which side applies, ask.

## Who records what

- **Plan:** the coordinator adds an `ask:<key>` label to each brief where the plan already shows a case.
- **Worker:** its `report.md` and chat report carry `Needs the user: none`, or per case on the preset's "ask me" side `<key>: <what it is about, then what is needed>`.
- **Reviewer:** a `Needs the user` section in its PR comment, in the same form.
- **Coordinator:** `braid facts <pr>`: it fetches, runs the diff checks for the PR's base and head and prints each fact with its case (`dependency`, `process`: workflow, instruction or skill files, deleted tests, skip or only markers; `quality or scope`: over twice the brief's expected size). A fact is context to weigh against the cases, not a verdict.
- **Decided:** whoever decides a case on the preset's "decide yourself" side logs `Decided: <what>, because <why>, instead of <alternative>` on the item whose branch it holds (`braid log <id> --thread <your thread id> --file -`): the worker on its item, the coordinator on the braid, naming the strand. `braid decisions <number>` lists them for the recap.
