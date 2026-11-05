---
gate: npm run verify
main: main
epics: epics/braid/
ci: [verify (ubuntu-latest), verify (windows-latest)]
shell: pwsh 7.6+
setup: npm ci, with Node.js 26 on PATH (README "Build and verify")
test: "npm run build && node --test test/<file>.test.ts; Pester suites: pwsh -NoProfile -File scripts/Test-Pester.ps1"
run: npm run build, then node dist/cli.js --help (a CLI; no UI)
models:
  coordinator: codex / gpt-6.1-sol / reasoningEffort=high
  worker: cursor / grok-4.7 / reasoning_effort=high, contextWindow=500k
  reviewer: cursor / grok-4.7 / reasoning_effort=high, contextWindow=500k
---

# braid for braid agents

- Read installed skills; don't edit them. Documented setup may install/reuse the shared Node.js toolchain. Tests use temporary skill destinations and toolchain stores, never the real installations.
- Project facts and hard limits are in [AGENTS.md](AGENTS.md).
- New epics start at 006. The records of epics 001–005 are in the Git tag `archive/process-v1`.
- The braid skills are developed here in `.agents/skills/`. Other projects get them through `scripts/Install-Skills.ps1`.
