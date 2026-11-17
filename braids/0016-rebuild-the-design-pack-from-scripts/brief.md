---
id: '0016'
title: "Rebuild the design pack from scripts"
status: Done
labels: ["kind:task", "tier:S"]
dependencies: []
delivery: epic
---

## Goal

Anyone can change the braid logo's colours, layout, icon padding, social text or export sizes and regenerate every file in `design/` with one or two commands, on Windows or Linux. Today the files on `main` were made by throwaway Python scripts that live only in the user's untracked `output/` folder.

Expected size: about 250 lines in 4 files.

## Start here

- `C:\code\agento\output\design-build\build.py`: the composer to port. It reads `traced.json` and writes every SVG: four lockups x colour versions, the two app icons, the favicon and the social preview. Read-only: it is in the user's checkout; copy, don't move or edit.
- `C:\code\agento\output\design-build\render.py`: rasterizes every SVG to PNG with headless Chrome and prints `design/source/brand-guidelines.html` to `design/braid-brand-guidelines.pdf`.
- `C:\code\agento\output\design-build\traced.json`: the logo geometry (symbol navy, symbol violet, wordmark paths, bounding boxes, trace scale). This copy already has the weave-gap fixes of PR #101.
- `design/README.md`: the pack's guide; gets a rebuild section.
- `scripts/check-markdown-links.mjs`: precedent for a plain Node `.mjs` script in this repo.

## Change

- `design/source/build/logo-geometry.json`: `traced.json`, renamed. It is the master geometry from now on.
- `design/source/build/build.mjs`: port of `build.py`; same output.
- `design/source/build/render.mjs`: port of `render.py`. Finds Chrome or Edge on Windows, Linux and macOS, with an environment variable to override the path; a clear error if none is found.
- `design/README.md`: a short "Rebuild the files" section: what each script does, the commands, what to edit for common changes (colours, lockup ratio, icon padding, social text, sizes), and that shape changes are made in a vector editor on the SVGs, not here.

## Already decided

- Node, not Python: the repo's tooling is PowerShell and Node. Plain Node ESM (`.mjs`), no new dependencies; the browser is the only external tool, for `render.mjs`.
- Don't port `trace.py`. The traced geometry is the master; tracing from the concept image again is out of scope, and neither the tracer nor the concept PNG goes into the repo.
- The scripts write into `design/` by default.
- `npm run verify` and CI don't run these scripts.

## Out of scope

- Changing any design: colours, layout, shapes, copy.
- Tests in `test/`, npm scripts, CI changes.
- The user's `output/` folder: leave it alone; the coordinator removes it after the merge.

## Acceptance

- [x] `node design/source/build/build.mjs` regenerates every SVG in `design/`, byte-identical to `main`; any difference is explained in `report.md` and renders identically.
- [x] `node design/source/build/render.mjs` regenerates every PNG and the PDF with the same names and pixel sizes as on `main`, with no visible change.
- [x] `render.mjs` finds the browser on Linux (or is shown to by its search list) and honours the override variable.
- [x] `design/README.md` explains how to rebuild and what to edit for common changes.
- [x] The PR commits the scripts, the geometry and the README, plus regenerated files only if their bytes changed.

## Definition of done

- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Copy `traced.json` to `design/source/build/logo-geometry.json`.
2. Port `build.py` to `build.mjs` (same output, Python float formatting matched); tune-able values grouped at the top.
3. Port `render.py` to `render.mjs` with a browser search per OS and `BRAID_BROWSER` override.
4. Add the "Rebuild the files" section to `design/README.md`; fix the PDF-source line.
5. Verify SVG/PNG bytes against `main`, PDF page count, and the missing-browser error.
