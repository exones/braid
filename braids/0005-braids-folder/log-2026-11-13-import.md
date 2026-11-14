## 2026-11-13 18:28Z

2026-11-13 Back to To Do at the user's request: nothing in TASK-5 starts until TASK-4 (fresh start) is merged; set In Progress when TASK-5.1 starts.

2026-11-13 TASK-4 merged into main (PR #59, 74f272a); main merged into the epic branch; TASK-5.1 starts.

2026-11-13 TASK-5.1 merged: PR #60, 020cd03. Done: docs/braids-format.md; strict front matter parser (YAML subset, values stay text, unknown keys are errors, id must match folder, delivery only on braids, default epic); braid list and braid view; errors name file and line; BOM and CRLF handled. Review not blocking; 3 suggestions applied. For later items: parseBrief(text, file, expectedId), loadBraids(root), findRoot(cwd) in src/braids/store.ts; FormatError exits 2, UsageError 1; the writer should emit exactly the front matter subset, ids quoted like '0001', strings JSON-escaped in double quotes.
Plan changes: none. User decided: merge on request.

2026-11-13 TASK-5.2 merged: PR #61, c8dce52. Done: braid new, braid strand new, braid edit, braid brief (--text, --file, --file -); ids never reused (git fetch --all, then working tree plus every braids/ path in git log --all, deleted ones included; fetch failure stops unless --no-fetch); every write re-parsed before saving; a title change keeps the folder; dependencies must exist; section text can't hold ## headings or an unclosed fence. Review not blocking; AC 4 checked and a remote-letter test added. The user tried it hands-on in a playground repo. For later items: write through src/braids/write.ts (writeBrief re-parses); multi-line input via --file/--file -/--text as in braid brief.
Plan changes: none. User decided: merge on request.

2026-11-13 TASK-5.3 merged: PR #62, f94ee1f. Done: braid log (per-thread log-<date>-<8 chars>.md, the part after the last ':' of the thread id, user without one; UTC headings, --checkpoint; git add, never commit) and braid report (replace by default, --append adds). Review blocking once (all mcp:launch ids shared one file), fixed and checked. The user tried logs and reports hands-on. For later items: none.
Plan changes: doc-5 story 4 outline notes the report rule (after a fix round the worker rewrites report.md; the history goes in its log). User decided: that rule; merge on request.

Closing: all three strands merged into the epic branch; braid now reads, creates, edits, logs and reports braids and strands from the CLI.
