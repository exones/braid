# Stop cases

The cases where braid waits for the user. Every role judges against this list and uses these keys.

| Key | Meaning | Examples |
| --- | --- | --- |
| `security` | The change touches who can do what, or what is exposed. | Authentication or authorization, permissions, secrets, cryptography, sandboxes or tool restrictions, handling of untrusted input, network exposure, logging of personal data. |
| `dependency` | The project relies on something new or different. | A new library or tool, a major version bump, a new external service or paid API, a licence change. |
| `architecture` | The shape of the system or its contracts changes. | A new module, service, process or storage; a changed public API, CLI, config or file format; a refactor across many files. |
| `data` | Stored data changes or can be lost. | A migration, a changed stored format, deleting or rewriting user data, a backward-incompatible change. |
| `process` | How the project is built, checked or instructed changes. | Skills, `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, CI workflows or the gate; deleted, skipped or weakened tests. |
| `outward` | An effect outside the repository. | Publishing, releasing, deploying, sending messages, anything irreversible outside the repository. |
| `scope` | The work departs from what was agreed. | A change to the goal or acceptance criteria, growth beyond the mandate, new tier L work, a deviation from the task. |
| `quality` | The normal loop isn't converging. | Still blocking after 2 fix rounds, worker and reviewer disagree, the same check fails twice, a merge conflict outside task files, a worker that fails twice. |

## Who records what

- **Plan:** the coordinator adds an `ask:<key>` label to each task where the plan already shows a case.
- **Worker:** its final summary and chat report carry `Needs the user: none`, or `<key>: <one sentence>` per case.
- **Reviewer:** a `Needs the user` section in its PR comment, in the same form.
- **Coordinator:** the diff facts below, for the PR's base and head (`git fetch` first; `<base>` is `origin/<base branch>`, `<head>` the PR's head commit). Each command that prints something is a fact to weigh against the cases.

```sh
git diff --name-status <base>...<head>   # every changed file; also gh pr diff <pr> --name-only
git diff --shortstat <base>...<head>      # over twice the task's expected size: quality or scope
git diff --name-only <base>...<head> -- '*package.json' '*package-lock.json' '*npm-shrinkwrap.json' '*pnpm-lock.yaml' '*yarn.lock' '*bun.lock*' '*requirements*.txt' '*pyproject.toml' '*poetry.lock' '*uv.lock' '*Pipfile*' '*go.mod' '*go.sum' '*Cargo.toml' '*Cargo.lock' '*Gemfile*' '*composer.json' '*composer.lock' '*.csproj' '*packages.lock.json' '*Directory.Packages.props' '*pom.xml' '*build.gradle*'   # dependency
git diff --name-only <base>...<head> -- .github/workflows BRAID.md AGENTS.md CLAUDE.md .agents/skills   # process
git diff --name-only --diff-filter=D <base>...<head>   # deleted files: process if any is a test
git diff --name-only -G '\.(skip|only)\(|\b[xf]it\(|@pytest\.mark\.skip|@Disabled|@Ignore|t\.Skip\(|-Skip\b' <base>...<head>   # skip or only markers added or removed in tests: process
```
