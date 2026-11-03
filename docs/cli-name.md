# CLI name: braid

Updated: 2026-11-03. Selected by the user: project and CLI name are both `braid`.

## Current decision

Use `braid` as the executable: `braid --version`, `braid init`, `braid new`, and `braid status`. Configure the npm package's `bin` entry and installed-package smoke checks for `braid`. No short alias is selected.

Use `.braid/` for local state as well. The package is public `@exones/braid`. The published version is `0.1.0`. This source is `0.1.1`. The Git repository is `https://github.com/exones/braid`. The command remains `braid`. Unscoped `braid` was refused by npm as too similar to `brace`. The user selected this name on 2026-11-03 after the former unscoped name `agento` was found to be a different npm package. Storage follows the tool name. This supersedes `.agento/` and the earlier `.crew/` directory. The CLI does not migrate, alias, or delete a pre-existing `.agento/` or `.crew/` directory.

## Naming history

The initial preference was `ag` unless commonly used. The following research led to considering alternatives before the user chose `agento`, and later `braid`.

`ag` is the established executable for [The Silver Searcher](https://github.com/ggreer/the_silver_searcher/blob/master/doc/ag.1.md), a code-search tool. Avoid using it as the installed default.

Nearby short names also have existing CLI uses: [ago](https://github.com/troyshu/agent-overseer) and [agt](https://github.com/open330/agt). These are especially close to this project's agent tooling domain.

## Alternatives considered, not selected

- `agto`: four letters, recognizable abbreviation of the former name `agento`.
- `agnto`: five letters; `agento` with its `e` omitted.

Targeted web searches did not identify a prominent standalone CLI under either proposed name. This is a limited collision check, not a guarantee of uniqueness or npm package availability. Check the chosen executable on target machines and package identity before publishing.

Naming is resolved for the executable, package, and state directory. Runtime paths, help, errors, tests, the Git ignore rule, and the seed contract use `.braid/`. The CLI does not migrate, alias, or delete a pre-existing `.agento/` or `.crew/` directory. Old disposable ledgers under those names stay where they are.
