What changed: braid now reads the `braids/` folder. `docs/braids-format.md` defines the layout (`NNNN-slug` braids, `X-slug` strands, `brief.md`, optional `report.md`, `log-<date>-<thread>.md`, ignored `temp/`) and the brief front matter (id, title, status Outline | To Do | In Progress | Done, labels, dependencies, order, delivery epic | main). New code: `src/braids/frontmatter.ts` (a strict YAML subset with line-numbered errors; quoted values and list items take JSON escapes or doubled single quotes), `src/braids/brief.ts` (validated briefs and `## ` sections), `src/braids/store.ts` (root discovery and loading), `src/commands/braids.ts` (`braid list`, `braid view <0002|0002/A>`), routed in `src/cli.ts` and listed in help and the README. `.gitignore` ignores `braids/**/temp/`.

Why: the persistent format every later story builds on (TASK-5.2 writes it, the board reads it).

Validation: `test/braids.test.ts` runs the built CLI against a fixture repo (`test/fixtures/braids-repo`: three braids, strands out of letter order, Outline, report, logs, block and inline lists, quoted ids), temp repos for CRLF and BOM briefs, quoted list items with escaped quotes and commas, strands without `order` running last by letter, and 21 malformed cases (each error names the file, most with a line); `npm run verify` passes locally on Windows; CI green on Windows and Ubuntu.

Open: none.

For later items: `parseBrief(text, file, expectedId)` returns `Brief` with `sections` (title/text from `## ` headings) for `braid brief`; `loadBraids(root)` and `findRoot(cwd)` in `src/braids/store.ts`; `FormatError(file, message)` exits 2 and `UsageError` exits 1 via `src/cli.ts`. Values are text; a writer should quote ids (`'0001'`) for YAML compatibility and may emit JSON-escaped double-quoted strings, in values and list items alike. No writer exists yet; TASK-5.2 adds one that should emit this exact subset.

Needs the user: none
