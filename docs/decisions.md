# braid decisions

Updated: 2026-11-12. User requirements take precedence over implementation proposals. Change this file with a dated reason; do not silently rewrite project direction. The full earlier log, including superseded process decisions, is in Git tag `archive/process-v1` (`git show archive/process-v1:docs/decisions.md`).

## Current decisions

| ID | Decision | Reason |
| --- | --- | --- |
| D01 | Build a small usable release, then use it to build its successor. | Adopt the intended work method during development; avoid waiting for the entire MVP. |
| D02 | Implement the CLI/core in modern TypeScript on Node.js. | User selected this stack for the CLI. |
| D03 | Use PowerShell as a first-class automation language. | User uses it heavily and wants substantive scripting supported. |
| D04 | Use GitHub for source/PRs and GitHub Actions for build. | User's chosen development platform. |
| D05 | Use Tailscale for private infrastructure binding. | Existing user practice. |
| D06 | Use npm as the package registry. Forgejo/Tailscale registry deployment is superseded and out of scope. | User confirmed the npm decision. |
| D07 | One implementation worker at a time; introduce parallel workers only after supervised execution and routing work. | Keep the bootstrap understandable and recoverable. |
| D08 | Preserve context in versioned files (epics, briefs, decisions) so a fresh session can continue without chat history. | Agents and people resume from the repository. |
| D09 | Project and command are `braid`. The npm package is public `@exones/braid`. Epic files live under `epics/braid/`. The Git repository is `https://github.com/exones/braid`. | User selected `braid` on 2026-11-03 because unscoped npm `agento` belongs to another package. npm then refused unscoped `braid` as too similar to `brace`, so the package is scoped. |
| D10 | CLI executable is `braid`, in full. | User selected the full name after considering short alternatives. |
| D11 | Models per role are set in [BRAID.md](../BRAID.md) and [AGENTS.md](../AGENTS.md#providers-and-roles); agents don't substitute another model or settings without the user's agreement. | User-selected models and settings, kept in one place. |
| D15 | Passing local gates leads to scoped Conventional Commits and a PR. Done requires green CI, the review its tier asks for, and a merge. | User wants a real commit/PR/CI/review loop instead of accumulating uncommitted work. |
| D16 | README describes supported project state and usage; work status belongs in `epics/`. | User treats README as the repository frontend. |
| D18 | Local state lives under `.braid/`. Pre-existing `.agento/` and `.crew/` directories are left untouched. | Storage follows the tool name, with no alias or silent migration. |
| D26 | Resolve Node.js PATH-first, then one shared Windows pin. A Node.js `>=26.13.0 <27` already on PATH is selected when the npm that shipped with that same install runs; when `node` on PATH is a version-manager launcher (Volta), the runtime it reports as `process.execPath` is checked and selected. `package.json` pins Volta to `26.13.0`. Otherwise Windows reuses or installs official Node.js `26.13.0` under `%LOCALAPPDATA%/braid/toolchains`, or under an absolute `BRAID_TOOLCHAIN_DIR` that does not change the version or hashes. The key is `node-v<version>-<platform>`. Warm reuse is offline and requires the exact version, a usable bundled npm, and `.braid-toolchain.json` naming the pin, platform, and verified archive hash. Publication takes a per-key exclusive lock bounded to 120 seconds, checks the pinned hash and the official checksum, validates the extracted runtime, and atomically renames a same-filesystem staging directory. Corrupt completed directories are preserved. Non-Windows stays PATH-only. Checkout-local `.tools` is not read, migrated, or deleted. | User asked on 2026-11-05 for a per-machine multi-version toolchain and for reuse of a suitable PATH Node.js. |
| D28 | Agent process rules are short and common-sense: [AGENTS.md](../AGENTS.md) holds project facts and limits, the skills hold role steps, and the [workflow](../.agents/skills/braid-coordinate/references/workflow.md) holds layout, tiers, branches and merges. Each item gets one brief (start-here files, settled facts, expected size, out of scope, done-when, checks), which is both backlog entry and worker instructions. Items have a kind (story, task or spike) and a tier (S/M/L). CI's own result (`gh pr checks`) is the CI evidence, and nobody re-derives it. The PR description is the item's record; the worker ends with a short chat report (done, decisions, and when relevant deviations, user actions, screenshots), and the coordinator gives the user the same recap. The coordinator merges S and M item PRs into the epic branch once checks are green and review has nothing blocking; the user merges L items and everything into `main`. | The user agreed on 2026-11-05 that the accumulated rules made a one-script item take over an hour and a half, mostly in repeated verification and paperwork ([diagnosis](../epics/reports/braid-overhead-diagnosis.md), [plan](../epics/reports/simplify-rules-plan.md)). Capable models already know engineering practice; they need project facts, limits and a precise brief. |
| D29 | Braid skills work in any repository. Each skill folder is self-contained (the docs gate rejects links outside it). A target repository declares its facts in a root `BRAID.md` with front matter: `gate`, `main`, `epics` (or `backlog` for the `braid` skill, D30), `ci`, an optional `run`, and a `models` map (provider / model / options per role, optional `<role>.<tier>` and `<role>.<kind>` overrides and `skill:`; `<role>.<tier>` wins over `<role>.<kind>`, then `<role>`); skills read it explicitly, so Cursor, Codex and Claude agents all see it. `scripts/Install-Skills.ps1` copies the skills (`braid` and `braid-*`) from a committed ref into the Cursor, Codex and Claude personal skill folders and `~/.braid/skills`, stamping ref and commit; updates happen only by rerunning it. Changes to skills, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` are tier L. New PowerShell tests use Pester 5 under `test/pester/`. | The user wants braid to drive projects in other repositories while keeping the skills supervised: no self-modifying instructions, no links that only work inside braid, and updates that reach other projects only deliberately. Claude reads `CLAUDE.md` rather than `AGENTS.md`, so project facts live in a file the skills name. |
| D30 | The `braid` skill keeps a project's items as [Backlog.md](https://github.com/MrLesk/Backlog.md) tasks in the target repository: `backlog.md@1.55.3` installed globally, the skill's `backlog/config.yml` committed without `backlog init`, and no Backlog.md block in `AGENTS.md`. The user talks only to `braid`, for work of any size; it decides story or goal. `braid` hands every item PR to the user to merge. `braid-worker` runs only in worker threads a coordinator launches. `braid-coordinate` and its `epics/` briefs stay for this repository's own epics until the user's trial. The CLI's `.braid/` ledger is unchanged for now; the roadmap's stages 1–6 are revisited after the user's trial of `braid`. | The user wants one skill that handles every size of work the same way (a goal, a single story, a story that grows into phases). Backlog.md task files in Git give a board, a CLI and task fields without braid building its own tracker, and the tasks travel with the branches and PRs that change them. Spike A (epic 008) showed the pinned version works from pwsh 7 and POSIX shells and across worktrees. |

D12, D13, D14, D17 and D19–D25 (Agile vocabulary, report formats, review naming, assignment packets, delivery and record-ownership rules) and D27 (workspace-binding helper) were process decisions superseded by D28 and D29. Their IDs are not reused.

## Working defaults

- One package, strict TypeScript, ESM, compiled JavaScript, npm lockfile; Node.js per D26 and PowerShell 7.6+.
- PowerShell scripts own reusable build/verify/package automation. YAML wires jobs; npm scripts provide discoverable entry points. Avoid implementing the same orchestration twice.
- The braid skills live in `.agents/skills/` and reach other projects through `scripts/Install-Skills.ps1` (D29).
- GitHub-hosted Windows and Linux jobs run deterministic checks. Live T3 exercises are separate and explicitly recorded.
- Build and verify an installable tarball before npm publication. Publishing needs explicit authorization; steps and current status are in [npm distribution](npm-distribution.md).
- A released controller is fixed for the lifetime of a development run. New schemas need compatibility handling before promotion.

## Scope changes from the original MVP plan

The root MVP plan remains the long-term requirements reference. These changes supersede its implementation details:

1. Replace the PowerShell module product implementation with TypeScript/Node.js, while retaining PowerShell automation. Use TypeScript tests for product behavior and Pester for PowerShell logic.
2. Bring templates, CI, packaging, and verification forward. Introduce dispatch, messaging, scheduling, and recovery in successive releases.
3. The seed has manual item tracking, not the full later stream state machine. It must distinguish manual completion from verified acceptance.
4. T3 behavior is checked against the current installation rather than assumed.
5. Historical instructions in the inspiration material are examples, not current project permissions.
6. The coordinator skill came first (stage 0); later milestones implement deterministic coordination in the product.

## Distribution

The user confirmed using npm directly. Public packages can use npm's free tier; private npm packages require paid access. A scoped package such as `@exones/braid` still installs the `braid` executable. Publishing uses GitHub Actions [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC, no `NPM_TOKEN`) from `.github/workflows/release.yml`; Forgejo is not an npm OIDC provider. Registry selection itself does not authorize a public upload.

## Decision log

- 2026-11-12, user (epic 008): adopted D30, Backlog.md as the item store of the `braid` skill, which `scripts/Install-Skills.ps1` now installs next to `braid-*`. Routing agreed on 2026-11-11: the user talks only to `braid`; `braid-coordinate` stays for `epics/` until the trial. D29 gained the `<role>.<tier>` model key.
- 2026-11-05, user: split the gate. `npm run verify` (the `BRAID.md` gate, about 20 s) runs the docs gate, OIDC guard, typecheck, build and tests; `npm run verify:full` adds the tooling tests and the package proof and is what CI and releases run. CI's `push` trigger is limited to `main` and `epic/**`, because pull requests already cover PR branches.
- 2026-11-05, user: asked for braid skills usable from other repositories, supervised and self-contained, with project facts in a conventional file, and for Pester tests of PowerShell code. Adopted D29. Existing PowerShell fixtures are converted to Pester later as separate work.
- 2026-11-05, user: agreed the agent process had grown into its own product and was slowing simple work. Adopted D28, removed the PR-proof and workspace-binding helpers, and removed the records of epics 001–005; they remain in tag `archive/process-v1`. Only the user merges into `main`.
- 2026-11-05, user: asked for a per-machine toolchain that can hold several Node.js versions, and for reuse of a suitable PATH Node.js. Adopted D26.
- 2026-11-03, trusted publishing: npm publish runs from GitHub-hosted Actions with OIDC. The release job keeps `id-token: write` and uses no `NPM_TOKEN` or `NODE_AUTH_TOKEN`. It stays on Node.js 26, above npm's 22.14.0 trusted-publishing minimum.
- 2026-11-03, user: selected `braid` as the project, CLI, package, and storage name, on GitHub at `https://github.com/exones/braid`. The former name `agento` stays in historical records and remains another owner's npm package.
- 2026-11-03, user: confirmed npm as the registry; the Forgejo/Tailscale distribution design was dropped.
- 2026-11-03, user: TypeScript/Node.js CLI, PowerShell automation, GitHub Actions, incremental self-hosting, one-agent bootstrap.
