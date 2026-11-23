---
gate: npm run verify
main: main
ci: [verify (ubuntu-latest), verify (windows-latest)]
autonomy: steady
shell: pwsh 7.6+
setup: npm ci, with Node.js 26 on PATH (docs/development.md)
test: "npm run build && node --test test/<file>.test.ts; Pester suites: pwsh -NoProfile -File scripts/Test-Pester.ps1"
run: npm run build, then node dist/cli.js --help (a CLI; no UI)
docs:
  update: both
  public:
    - README.md
    - docs/getting-started.md
    - docs/cli.md
    - docs/board.md
    - docs/autonomy.md
    - "the CLI's help text (src/cli.ts and the commands' usage lines)"
  internal:
    - docs/development.md
    - docs/decisions.md
    - docs/braids-format.md
    - docs/roadmap.md
    - docs/npm-distribution.md
models:
  coordinator: Claude_Everix / claude-opus-5-5 / effort=medium
  worker:
    story: Claude_Everix / claude-sonnet-5-5 / effort=medium
    task: Claude_Everix / claude-sonnet-5-5 / effort=medium
    spike: Claude_Everix / claude-opus-5-5 / effort=medium (follows braid-researcher's Method)
    L: Claude_Everix / claude-opus-5-5 / effort=medium (tier L items, including spikes)
  reviewer: cursor / grok-4.6 / effort=high, fastMode=false; skill braid-reviewer
  researcher: Claude_Everix / claude-opus-5-5 / effort=medium; skill braid-researcher
  steering:
    first: Claude_Everix / claude-haiku-5-5 / effort=low
    fallback: codex / gpt-6-luna / effort=low
---

# braid for braid agents

- Read installed skills; don't edit them. Documented setup may install/reuse the shared Node.js toolchain. Tests use temporary skill destinations and toolchain stores, never the real installations.
- Items are braids in `braids/`, kept with the installed `braid` CLI ([format](docs/braids-format.md)). Edit briefs and reports directly, then run `braid check`.
- Project facts and hard limits are in [AGENTS.md](AGENTS.md).
- Past epics are in `epics/` (read-only); those before 006 are in the Git tag `archive/process-v1`.
- The braid skills are developed here in `.agents/skills/`. Other projects get them through `scripts/Install-Skills.ps1`.
