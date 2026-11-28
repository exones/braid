## 2026-11-28 14:52Z

Decided: dist/cli.js runs main only under import.meta.main (no separate entry module, so bin and every path that runs cli.js stay). The help test has no skip list: run() first, the built CLI for what run() calls unknown. Gate green on Windows: 868 pass, 1 skipped.
