---
gate: npm run verify
main: main
epics: epics/braid/
ci: [verify (ubuntu-latest), verify (windows-latest)]
coordinator_model: codex / gpt-6.1-sol / reasoningEffort=high
worker_model: cursor / grok-4.7 / reasoning_effort=high, contextWindow=500k
reviewer_model: cursor / grok-4.7 / reasoning_effort=high, contextWindow=500k
---

# braid for braid agents

- Setup before the gate works: see the README section "Build and verify" (shared Node.js toolchain, then `npm ci`).
- Project facts and hard limits are in [AGENTS.md](AGENTS.md).
- Epics 001–005 are closed history; new epics start at 006.
- The braid skills are developed here in `.agents/skills/`. Other projects get them through `scripts/Install-Skills.ps1`.
