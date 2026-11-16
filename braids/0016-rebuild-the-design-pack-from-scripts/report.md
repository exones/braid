# 0016 report

## What changed
- `design/source/build/logo-geometry.json`: `traced.json` (with the PR #101 weave-gap fixes), now the master geometry.
- `design/source/build/build.mjs`: Node port of `build.py`; tunable values (colours, `PAD`, lockup ratio and gap, icon inset, social text) are named constants at the top. Optional first argument sets the output folder; default `design/`.
- `design/source/build/render.mjs`: Node port of `render.py`; searches Chrome/Edge on Windows, Linux (PATH: google-chrome, chromium, microsoft-edge …) and macOS; `BRAID_BROWSER` overrides; a missing browser lists everything searched.
- `design/README.md`: "Rebuild the files" section.

## Validation
- `node design/source/build/build.mjs`: git shows no change in any SVG, so all are byte-identical to `main`.
- `node design/source/build/render.mjs`: every PNG byte-identical to `main`. The PDF differs in bytes (Chrome writes fresh ids/dates) but has the same size and page count; I restored the committed PDF and did not commit a regenerated one.
- Linux not run here: the search list covers `google-chrome`, `chromium`, `microsoft-edge` on PATH. `BRAID_BROWSER` with a bad path gives a clear error (tried).
- Gate `npm run verify`: passes.

## Open
Nothing.

For later items: none
Needs the user: none
