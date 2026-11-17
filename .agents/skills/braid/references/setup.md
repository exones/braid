# Setup problems

Read this when the project isn't ready for braid: the `braid` tool, the `braids/` folder or `BRAID.md` is missing. In the first two cases, stop and tell the user what to run.

- `braid --version` fails: the user installs it with the braid skills (the braid repository's `docs/getting-started.md`, "Install the skills and the CLI").
- The project has `backlog/` and no `braids/`: the user runs `braid import-backlog --dry-run`, then the same without `--dry-run`, and commits.
- `BRAID.md` is missing: offer [the template](../assets/braid-md.md). It is committed before workers launch, with `braids/**/temp/` in `.gitignore`.
