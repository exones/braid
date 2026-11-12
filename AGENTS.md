# Working on braid

braid is a TypeScript/Node.js CLI; see [README](README.md). This file lists the project facts and limits an agent can't guess. It doesn't explain general engineering practice.

## Project facts

- Names: the project and CLI are `braid`, the npm package is `@exones/braid`, and local state lives in `.braid/`. Leave `.agento/` and `.crew/` directories alone.
- Product code: strict TypeScript on Node.js `>=26.13.0 <27`, ESM, compiled to `dist/`. Automation and scripts: PowerShell 7.6+ (`pwsh`).
- Setup is in the README under "Build and verify". [BRAID.md](BRAID.md) holds the facts braid agents read: the gate (`npm run verify`, before every PR), the CI checks, the `backlog` folder, how to call Backlog.md and the models.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (`feat:`, `fix:`, `docs:`, `build:`, `test:`, `chore:`). Merge with merge commits. Don't rebase or force-push shared branches.
- Search with `rg`. In PowerShell, pass native command arguments as arrays and check `$LASTEXITCODE`.
- Keep code and scripts cross-platform: CI runs on Windows and Ubuntu, and Windows-only path, line-ending or permission assumptions have broken Linux CI before.
- New PowerShell tests are Pester 5 suites under `test/pester/` (`*.Tests.ps1`). The older hand-written fixtures under `test/fixtures/` stay until they are converted.
- The README describes what the product does and how to use it. Work status belongs in `backlog/`, not the README.

## Hard limits

- Don't publish packages, create releases or tags, deploy, or change repository settings unless the user asks for it.
- The user merges every item PR and everything into `main`; agents don't merge. See [the workflow](.agents/skills/braid/references/workflow.md).
- Changes to `.agents/skills/`, `AGENTS.md`, `CLAUDE.md` or `BRAID.md` are made only when the user asks, and the user merges them.
- One writer per checkout. Don't reset, clean, switch branches or commit in a checkout that the user or another agent is working in, and leave changes you didn't make alone.
- No secrets in chat, files, commits or logs. Get credentials only through the host's secret mechanism.
- Don't hand-edit `.braid/` state files.
- `inspiration/` is reference material. Its permissions, hosts and credentials don't apply here.

## Where to look

- Goals and stories, here and in other projects, including "run TASK-12": [braid](.agents/skills/braid/SKILL.md). It decides story or goal and keeps items in Backlog.md (`backlog/`). `epics/` holds past records, read-only.
- Doing one assigned item: [braid-worker](.agents/skills/braid-worker/SKILL.md), only in a worker thread a coordinator launched; never chosen for a user's request.
- Ordinary questions and small direct edits need no skill.
- Items, tiers, branches and merges: [the workflow](.agents/skills/braid/references/workflow.md).
- Using the skills in other projects: [README](README.md#braid-skills-in-other-projects).
- Decisions and their reasons: [docs/decisions.md](docs/decisions.md). Later stages: [docs/roadmap.md](docs/roadmap.md).

## Providers and roles

The models per role are in [BRAID.md](BRAID.md): Claude Opus 5.5 (high effort) coordinates; Claude Sonnet 5.5 (medium) implements stories and tasks, Claude Opus 5.5 (medium) implements tier L items and runs spikes as a researcher, and Claude Opus 5.5 (high) reviews with the `code-review` skill. In T3 all of them use the `Claude_Everix` provider with `target.options` `{"effort":"<level>"}`. Don't substitute another model or other settings without the user's agreement.

Workers and reviewers run as top-level T3 threads, each in its own worktree. That is the user's standing request for work inside an approved epic, so it needs no confirmation per item.
