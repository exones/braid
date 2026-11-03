# I: Forgejo/Tailscale discovery and implementation proposal

Status: cancelled, 2026-11-03. Reason: user confirmed npm; no self-hosted registry is planned. Preserve the original spike below as history; do not assign or execute it.
Kind: spike. Epic: AGENTO-001 optional infrastructure.
Research question: if private hosting is selected, what exact host/deployment/access changes are needed? Limit: one bounded discovery pass; stop with a concrete proposal or missing-input list. No deployment.
Role: discovery/planning. No deployment or remote changes.

## Read first

`AGENTS.md`, decisions, `docs/forgejo-tailscale.md`, epic, and current checkpoint. Do not use host/account names or permissions from inspiration.

## Outcome

Produce an actionable infrastructure backlog item for self-hosted Forgejo npm packages, built on GitHub Actions and reached through Tailscale.

## Work

1. Identify supplied/current host/platform facts and approved connected sources. If no host is identified, list exactly the nonsecret facts needed; do not scan or guess unrelated infrastructure.
2. Inspect an existing Forgejo/Tailscale setup read-only if its target/access is provided. Record actual service versions, storage, TLS/DNS, backup path, network policy, and authentication options without exposing secrets.
3. Verify official documentation for the deployed versions. Assess GitHub Actions workload identity federation; prefer it when available and appropriately restricted, otherwise specify the OAuth fallback.
4. Propose the smallest deployment using existing host tooling. PowerShell owns operational orchestration where useful. Explain persistence, backup/restore, private TLS, effective tailnet access, and distinct publishing/consumer identities.
5. Specify a trusted release job that publishes the verified tarball; ordinary PR jobs receive no tailnet membership or publish credentials. Include both npm metadata and tarball URL connectivity in the consumer gate.
6. Write a follow-on implementation backlog item in the report, with exact target, proposed changes, rollback, acceptance checks, missing inputs, and actions requiring authorization. Leave any unknown values clearly unresolved.

## Acceptance and output

Write `reports/I.md` and update only task I's row. If another task owns `checkpoints/current.md`, do not overwrite its active handoff; put I's resume point in the report. The report must distinguish observation from proposal.

Do not install a service, register an identity, change grants, request raw secrets in chat, publish, or deploy. No follow-on implementation begins automatically.
