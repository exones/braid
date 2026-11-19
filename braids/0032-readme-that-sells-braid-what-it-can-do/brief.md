---
id: '0032'
title: "README that sells braid: what it can do, why, fresh screens"
status: Done
labels: ["kind:story", "tier:M"]
dependencies: []
delivery: epic
---

## Goal

Make `README.md` a front page that makes a first-time visitor want to try braid: what it can do for them, why this way of working is good (and what it saves them), shown with fresh screens of the real product and a few illustrative mock-ups. Readers: a developer landing on the GitHub repository who has never heard of braid.

Expected size: about 200 lines in 2 to 3 text files, plus 4 to 7 images.

## Start here

- `README.md`: today's front page (from 0017). It explains the parts and steps well but reads as a manual: no "why", no benefits, one screenshot from before the inbox, Coordinator button and phone layout existed.
- `braids/0017-readme-front-page/brief.md` and its `report.md`: how the current front page and `docs/images/board.png` were made (Edge headless on `braid board --demo`, 1440 px at 2x) and what was decided then.
- `docs/board.md` and `docs/design/board-screenshots/`: what the board shows today (lanes, Needs You, inbox chip, Start, Merge, Open thread, Coordinator, phone) and recent screenshots to learn from; `braid board --demo` serves all of it on sample data.
- `docs/decisions.md`: the reasons behind braid's choices (the ledger in Git, one writer per branch, independent review, the user merges, stop cases); the "why" section draws on these, it doesn't invent new claims.
- `docs/getting-started.md`, `.agents/skills/braid/references/workflow.md`, `.agents/skills/braid/references/stop-cases.md`, `.agents/skills/braid/references/auto-mode.md`: the real behaviour to describe.
- `design/README.md`: brand colours and logo use, for any mock-up.

## Change

- `README.md`: rework it. Keep the logo header, badges, quick start, docs table, contributing and licence. Add or rewrite:
  - a stronger opening: the pitch and a hero image right after it;
  - **What it can do**: concrete capabilities, each one line with the outcome for the user (plan a goal into reviewed PRs, independent review by a different model, resume after a crash from the files, the board on your phone, stops and asks when a decision is yours, auto mode, the idea inbox, works with Claude, Codex and Cursor);
  - **Why braid**: the problems it answers (agents losing context, unreviewed agent code, not knowing what needs you, work stuck in one chat) and how braid answers each, grounded in `docs/decisions.md`;
  - **A walk-through** of one goal from "braid: add dark mode" to merged PRs, illustrated with the screens;
  - the fresh screens and mock-ups below, each with a one-line caption.
- `docs/images/`: new images, replacing `board.png` if a better hero exists:
  - real screenshots of `braid board --demo` taken now (desktop board, Needs You with a request open, an item page, the phone view), light and dark where it helps;
  - illustrative mock-ups, built as HTML on realistic sample data and rendered to PNG: a coordinator thread showing a plan and a recap, and a small diagram of the flow (goal → braids and strands → workers → reviewers → you merge). A mock-up is labelled as illustrative in its caption or alt text when it isn't a real screen.
- `docs/design/readme/` (new): the HTML sources of the mock-ups and a short note of how each image was made, so they can be redone.

## Already decided

- Converge loop: the user chooses the shape. The worker first proposes the README outline with its headings and draft text, and the screens and mock-ups as images, then stops. The coordinator shows them to the user; each verdict goes into the log; only after approval is the final README written.
- D16 holds: the README describes what the product does and how to use it, never work status or plans. No roadmap promises.
- Every claim is true of `main` today; a capability not built yet (for example parallel strands, 0011) is not claimed.
- No comparisons naming other products.
- Images and links are relative paths that render on GitHub, in light and dark mode. GitHub Markdown can't set fonts or colours; the brand shows in images. Keep images small enough for a fast page (PNG, sensibly sized; no GIF or video in this item).
- The README may grow past 0017's 120-line limit, to about 200 lines; detail still belongs in `docs/`.
- The current CLI isn't on npm, so the quick start stays install-from-checkout as today.

## Out of scope

- `AGENTS.md`, `CLAUDE.md`, `BRAID.md`, `.agents/skills/`, CI and the gate.
- Changing the board or the CLI to look better in a screenshot; if a screen shows a real problem, report it under "For later items".
- Rewriting `docs/` pages beyond fixing a link; the GitHub description, topics or social preview (repository settings).
- A script that regenerates the README images.

## Completion

- [x] The README has a pitch with a hero image, "What it can do", "Why braid" and a walk-through, plus the quick start, docs table, contributing and licence; about 200 lines or fewer.
- [x] Every capability and claim in the README is true of `main` (the report lists each with the doc or code that backs it).
- [x] Fresh screenshots from `braid board --demo` and the agreed mock-ups are in `docs/images/`, each referenced from the README with a caption; mock-ups are marked illustrative.
- [x] The mock-up sources and how each image was made are in `docs/design/readme/`.
- [x] The README renders correctly on GitHub in light and dark mode (checked on the PR branch; screenshots of both in the report).
- [x] The gate command from BRAID.md passes
- [x] report.md written: what changed, why, validation, anything open

## Plan

1. Converge loop: propose the outline, draft text and images (in `report.md` and `docs/images/`), stop for the user's verdict.
2. After approval: write the final `README.md`, `docs/design/readme/README.md` (how each image was made), check every claim against docs/code, render on the PR branch in light and dark, run the gate, open the PR.
