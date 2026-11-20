# Report: 0049/H

**What changed:** the `board` handler in `src/cli.ts` now maps `ProjectsFileError` to `error: <message>` and exit 2, as `braid projects` does. Two tests in `test/projects.test.ts` start `braid board --no-open` (as `node dist/cli.js`, home folder redirected) with a corrupt list and with an unknown version.

**Why:** the final review of 0049 (blocking 2) found the board printed `error: unexpected failure` and exited 5, against `docs/board.md` and the comment in `runBoard`.

**Validation:** both tests check exit 2, a message naming `projects.json` and its cause, empty stdout (no URL, so nothing listened; the spawn has a timeout, so a listening board would fail it) and the file unchanged. The gate passed (see the PR).

**Open:** nothing.

For later items: none.
Needs the user: none.
