`scripts/check-markdown-links.mjs` now reads its file list from standard input (one path per line) when no path arguments are given; path arguments still work. `Test-DocsGate.ps1` sends the Markdown list on stdin instead of argv, so the Windows command-line limit (32,767 characters) no longer applies. Findings and exclusions are unchanged.

Validation: new Pester suite `test/pester/Check-MarkdownLinks.Tests.ps1` (a 700-file list over 32,767 characters through stdin, and the argument form); `npm run verify` passes (385 node tests, docs gate).

Decisions: none
For later items: none
Needs the user: none
