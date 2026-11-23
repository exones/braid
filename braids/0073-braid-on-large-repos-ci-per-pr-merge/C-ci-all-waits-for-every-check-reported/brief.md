---
id: '0073/C'
title: "ci: all waits for every check reported"
status: To Do
labels: ["kind:story", "tier:M"]
dependencies: []
order: 30
---

## Goal

On a repo where the checks on a PR depend on the paths it changes, a fixed `ci:` list doesn't fit. `ci: all` in BRAID.md means: every check actually reported on the commit must finish green, after a short start grace in which checks may still appear. `braid wait` then waits for something, and the merge condition "checks green" checks something. Inbox 2026-11-23-n1xv.

Expected size: about 150 lines of code and tests in 4 to 6 files, plus docs.

## Start here

- `src/commands/coordinate.ts`: `ciChecks`, and its callers in `src/commands/done.ts` (`commitChecks`, accept and handover), `facts.ts`, `wait.ts`, `requests.ts`.
- `src/commands/wait.ts`: the start limit (`START_MS`) and how a run that hasn't appeared counts.
- `docs/braids-format.md` and the template `.agents/skills/braid/assets/braid-md.md` on `ci` (`[]` and `none`).

## Change

- `ci: all`: the required checks are every check run reported on the commit (by name; the newest run per name), excluding none.
- `braid wait`: with `ci: all`, it waits for every check reported on the answering commit; it doesn't call it green until a start grace (say 2 minutes after the CI commit's first run appeared, or the existing 5-minute start limit when none has; the worker decides and documents) has passed without a new check appearing and all reported ones finished. No run at all within the start limit is exit 2, as now.
- `braid accept`, `braid handover`, `braid facts`: with `ci: all`, every reported check must have passed, and at least one must be reported; a pending one is pending as now. These read once; the grace is `braid wait`'s.
- `ci: []` and `ci: none` keep today's behaviour; the template's line says exactly what each of `[]`, `all`, a list and `none` means (today it says `[]` is every reported check, which `braid wait` doesn't do: make the text true).
- Tests per command: `all` with every check green, one failed, one pending, none reported; for `braid wait` a check appearing inside the grace keeps it waiting.
- Docs: template line, `docs/braids-format.md`, `docs/cli.md`, help text, a decision in `docs/decisions.md`.

## Already decided

- `ci: all` is the answer to CI that differs per PR; path rules (`<glob> → <names>`) and "required plus anything reported" are not built.
- Excluding review bots' checks from `ci: all` is a line in 0073/D (they report as checks; a project that doesn't want to wait on them lists names instead).

## Out of scope

- The merge gate (0073/B).
- Partial CI on braid branches (0073/D, a line).

## Completion

- [ ] With `ci: all`, `braid wait` waits for every check reported after a start grace and exits 0 only when all passed; `braid accept`, `braid handover` and `braid facts` require at least one reported check and all passed; tests cover green, failed, pending, none reported and a late check
- [ ] The template and docs say exactly what `[]`, `all`, a list and `none` mean
- [ ] Docs from BRAID.md `docs` that this change makes untrue are updated, or report.md says none are affected
- [ ] The gate command from BRAID.md passes
- [ ] report.md written: what changed, why, validation, anything open
