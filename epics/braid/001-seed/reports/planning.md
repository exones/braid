# Planning handoff

Date: 2026-11-03. Status: epic/backlog documentation and bootstrap coordinator skill prepared; structural validation passes.

## Outcome

Created a durable entry point, project instructions, decisions, roadmap, handoff guide, private-registry proposal, and ordered seed assignments. No product code, Git initialization, GitHub workflows, remote resources, credentials, or infrastructure were changed.

## Evidence

- Inspected the workspace and original MVP plan; read the inspiration's epic/backlog item/report conventions.
- Prior Git inspection reported no repository; A must recheck before implementation.
- Consulted official Tailscale GitHub Action/federation and Forgejo npm registry documentation linked in `docs/forgejo-tailscale.md`. Infrastructure feasibility is a proposal, not a tested deployment.
- Local Markdown/link validation after the Agile migration: checked all 24 active Markdown files, including skill references/assets; all local links resolve.
- Skill structure: bundled `quick_validate.py` reports `Skill is valid!` for `.agents/skills/agento-coordinate`. UI metadata is checked separately as YAML.
- Reviewed the skill's plan-only, delivery, and resume branches and explicit worker/coordinator ownership. This is a document review, not a behavioral agent run. Automatic matching in this T3 session, a fresh host's discovery, and live delegation remain untested; the epic's bootstrap gate remains open.

## Decisions

2026-11-03 first delivery/acceptance: the user asked to start. The actual Grok/Cursor spike A completed and Sol reviewed its files. Accepted A after correcting the replacement procedure and event-gap handling, with evidence in `A-review.md`. B is now Ready and unassigned. This supersedes earlier planning-time statements that no worker had run; no product code, CI, or publication exists yet.
2026-11-03 Agile/skill follow-up: created the bootstrap coordinator skill at `.agents/skills/agento-coordinate/`, with automatic selection enabled, epic/backlog templates, and T3 delegation guidance. Renamed active work from initiatives to epics and briefs to backlog; classified item kinds and added Ready/Done criteria. Short goal requests replace repeated coordinator boilerplate. No product implementation or worker was started. Validation results are recorded below.
2026-11-03 starting/distribution follow-up: added a copy/paste prompt that explicitly starts task A through Sol -> T3 -> Grok with the chosen settings and shared checkout. Public npm is the proposed simple distribution route, pending visibility/name choice; Forgejo is optional. These are planning changes only; no worker or publication was started.
2026-11-03 provider handoff: recorded user's Sol High coordinator / Grok 4.7 Extra High worker preference. Read T3 capability metadata and official Codex/Cursor instruction-loading documentation. Added role prompts and separate checkpoint ownership; no delegation or product implementation started. Current model/settings are observations to recheck before launch.

2026-11-03 rename follow-up: project name is `agento`; seed epic paths and handoff prompts were updated. CLI `crew` and state directory `.crew/` remain working defaults. No product implementation started.

2026-11-03 CLI naming follow-up: `ag` is already The Silver Searcher. Recorded proposed alternatives `agto` and `agnto` in `docs/cli-name.md`. User selection is pending; `crew` examples are now provisional. No executable or state-directory rename has been implemented.

2026-11-03 final CLI selection: user chose `agento` in full. Updated current examples, agent instructions, implementation backlog items, checkpoint, and naming decision. This supersedes the pending choice above. No product code exists yet; `.crew/` remains the planned state directory.

TypeScript owns the product CLI/core; PowerShell is first-class automation. GitHub hosts source/builds. Public npm is proposed pending visibility/package identity; self-hosted Forgejo over Tailscale remains optional. The seed can be packaged before any registry is configured.

## Open points

GitHub target, publication identity, host/storage, tailnet configuration, and credential delivery remain unknown. Live T3 behavior will be fully characterized before dispatch implementation in stage 2.

## Resume

Give one agent task A using `docs/agent-handoff.md`. It writes the exact seed contract and environment report. Product implementation begins with B, not this planning handoff.
