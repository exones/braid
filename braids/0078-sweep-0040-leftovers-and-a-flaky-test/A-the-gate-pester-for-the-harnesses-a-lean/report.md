# 0078/A report

## What changed

- `scripts/Test-DocsGate.ps1`: the cat-file reader, attribute batching and byte loop (about 220 lines) are one `Get-TextFindings` function of about 20 lines using `git grep`, over index blobs (`--cached`) and over the worktree. The finding lines are unchanged. The script went from 569 to about 370 lines.
- The three harnesses are Pester suites under `test/pester/`, and the old scripts and their calls in `scripts/Verify.ps1` are gone. `verify:full` runs them through `scripts/Test-Pester.ps1`.
  - `Test-DocsGate.Tests.ps1`
  - `Install-Policy.Tests.ps1` (the `scripty` package stays under `test/fixtures/install-policy/`)
  - `Install-NodeToolchain.Store.Tests.ps1` (`Install-NodeToolchain.Tests.ps1` already covered launcher shims)
- Size: about 1,740 lines added and 2,080 removed in 10 files. More was added than the brief's 600 to 900, because the toolchain cases and their fixtures carry over almost as written (about 1,090 lines).

## Why

The quick gate spent most of its docs-gate time reading every blob and worktree file in PowerShell, and AGENTS.md says the hand-written harnesses convert to Pester.

## Cases

None dropped.

- Toolchain: each `Test-*` function is one `It`. The last one ran the production-pin check a second time; that repeat is gone, the check itself is its own `It`.
- Install policy: the guard against the harness starting itself (`BRAID_INSTALL_POLICY`) is gone, since there is no script to start. The suite now restores the environment variables it changes, because Pester shares one process.
- Docs gate: every case is kept. Added: trailing tab, no final newline, whitespace before CR, a line count, a path with a space and a non-ASCII name, a `-text` file and a NUL file.

## The text check: what differs

Binary detection is now git's (`-I`). No file in the repository hits either difference:

- A file whose first NUL comes after 8,000 bytes was skipped and is now checked.
- A file marked `-diff` but not `-text` was checked and is now skipped.

A worktree finding identical to the index finding is printed once; before, it was printed twice if the bytes differed elsewhere.

## Validation (Windows, a machine running other gates)

- The new docs-gate suite passes 17/17 against both the old script and the new one, so both give the same findings on those cases.
- `scripts/Test-Pester.ps1`: 69 passed, 0 failed, 0 skipped.
- `npm run verify` (the gate): exit 0.
- Docs gate alone, three alternating runs on the same tree: before 43.7, 35.8, 25.5 s; after 12.2, 10.1, 11.9 s.
- Whole quick gate: before 1,184 s, after 795 s. Load varied between the two runs and the node tests dominate, so the docs-gate figures are the reliable comparison. The harnesses were only ever in the full gate.
- `verify:full` was not run as one command locally; CI runs it on Windows and Ubuntu.

## Docs

`docs/development.md` updated (the text check and what `verify:full` runs). No other doc from BRAID.md `docs` is affected; the user decided nothing.

## Open

Nothing.

For later items:
- AGENTS.md says "The older hand-written fixtures under `test/fixtures/` stay until they are converted". After 0078/B none are left, so the sentence can go (needs the user's go).
- `docs/development.md` says the quick gate takes "about 20 seconds"; the node tests alone take minutes now.

Needs the user: none
