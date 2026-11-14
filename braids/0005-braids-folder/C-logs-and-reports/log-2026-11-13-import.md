## 2026-11-13 18:28Z

Entry format: "## YYYY-MM-DD HH:MMZ" (UTC) plus " checkpoint" for checkpoints; --thread needs 8+ letters/digits; braid report replaces, --append adds; BRAID_NOW fixes the clock in tests.

Review fix: thread short id is taken from the part after the last colon (mcp:launch:5d80964a.. gives 5d80964a); added tests for it and for braid log without a git repository.
