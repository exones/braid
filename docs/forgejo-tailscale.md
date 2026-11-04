# Self-hosted Forgejo reached from GitHub Actions

This design was superseded on 2026-11-03, when npm was confirmed as the registry. Use [npm distribution](npm-distribution.md) and `docs/decisions.md`. Do not deploy Forgejo or join CI runners to Tailscale for publishing. The remaining text is historical design rationale. Tailscale remains available for future private infrastructure.

## Proposed flow

1. GitHub keeps the repository, PRs, and Actions builds.
2. A trusted release job joins the tailnet temporarily.
3. It reaches Forgejo's HTTPS npm endpoint and publishes the exact verified tarball.
4. A clean consumer job/session installs the exact version through the same private path and checks `braid --version` plus a small ledger exercise.
5. Keep versioned release tarballs as a bootstrap fallback.

The Tailscale GitHub Action supports temporary tagged runners. Its current documentation recommends workload identity federation; confirm availability and configure trust to the intended repository/release environment. OAuth is a fallback if federation is unavailable. Source: [Tailscale GitHub Action](https://tailscale.com/docs/integrations/github/github-action) and [federated identity configuration](https://tailscale.com/docs/features/workload-identity-federation).

## Connectivity and identity are separate

Use a CI tag whose effective tailnet permissions reach only the registry's HTTPS service. Review all applicable grants, since adding a narrow grant does not remove existing broad access. Use a trusted TLS certificate and a stable tailnet DNS name. Verify both metadata and tarball download URLs resolve through that private path.

Tailscale authorizes network access. Forgejo separately authenticates package writes/reads. Use a dedicated publishing identity with the minimum supported package permissions; consumers use a separate read credential where needed. Configure npm auth for the exact registry path in a temporary configuration, keep TLS validation enabled, and remove credential material after the job.

Forgejo's documented npm endpoint is `https://<forgejo-host>/api/packages/<owner>/npm/`. These angle-bracket fields are placeholders, not actual host or account names. Source: [Forgejo npm registry](https://forgejo.org/docs/latest/user/packages/npm/).

## Build and release separation

Ordinary PR checks run without private-network access or publishing credentials. Initially, project dependencies come from the normal npm registry; Forgejo hosts braid release packages. Do not turn it into an npm proxy or migrate dependencies as part of the seed.

The publish job accepts artifacts from an identified, successful trusted revision and verifies their recorded digest. Grant tailnet membership and package writes only to authorized release execution. Do not execute arbitrary PR code inside a credentialed tailnet publishing job, including through `pull_request_target`.

Initial delivery should use GitHub-hosted Linux for the private-network publish job; Windows/Linux build jobs remain independent. No self-hosted runner, inbound GitHub webhook, public Forgejo endpoint, or Tailscale Funnel is required by this design. Implementation must verify these assumptions on the selected host and account.

## PowerShell role

PowerShell can own deployment preparation, registry configuration, readiness checks, backup/restore exercises, publication, and package-install verification. Hosting Forgejo in a Linux container does not require replacing orchestration with Bash. Use deployment tooling already present on the selected host; choose Compose or another platform only after discovery.

Reusable scripts should take nonsecret configuration as parameters and credentials through the approved secret mechanism. Check native exit codes explicitly. Workflow YAML should call these scripts rather than duplicate them.

## Information needed before deployment

- Target host and platform; whether Forgejo already exists; service owner and maintenance window.
- Tailnet DNS/service name, existing effective grants, TLS setup, and administrator path.
- Persistent data location, capacity, backup destination, retention, and restore procedure.
- Forgejo package owner/scope, publishing identity, read access requirements, and credential delivery.
- GitHub repository and release environment; available federation configuration and identity restrictions.

Do not deploy, create identities, open network access, or rotate secrets from this document alone. Complete [task I](../epics/braid/001-seed/backlog/I-registry-discovery.md) first and turn its evidence into an implementation backlog item.

## Infrastructure acceptance gate

- Service and data persist across restart; backup and restore demonstrated on disposable data.
- Authorized runner resolves/reaches the private endpoint with valid TLS.
- Effective tailnet policy excludes unrelated services; release identity is restricted to the selected workflow context.
- Verified tarball publishes, then exact-version metadata and tarball downloads both succeed from a clean consumer.
- Wrong/missing package credentials fail; an ordinary PR job has no publish credential or tailnet membership.
- Logs contain no credentials; temporary auth configuration is removed; ephemeral runner cleanup is confirmed.
- Forgejo outage produces an explicit release failure while ordinary PR checks remain usable.

This gate belongs to the infrastructure lane. It does not block local CLI packaging or seed development.
