**Research: how the board signs in to T3's MCP at Supervised and keeps the sign-in, the token only in the host's secret store** — answered (no live sign-in, as the brief says; T3's side read from its code, the secret store measured on Windows only)

**Answer:** A new command, `braid t3 login`, runs T3's own OAuth sign-in for outside agents: it registers as "braid board", opens T3's approval page on `localhost` in the browser, where the user approves Full access (q-b146), takes the code back on a one-off `127.0.0.1` port of the CLI, checks `state`, `iss` and PKCE, and stores the token in the OS secret store through `@napi-rs/keyring`. The board reads it from there, sends it as `Authorization: Bearer` on every call, warns 5 days before the fixed 30-day end, and on a 401 or with no store falls back to today's CLI paths. Confidence in the basis: high for T3's side (its code at the version in use, S2–S9), high for the OAuth rules (spec and RFCs, S40–S50), medium for the secret store (measured on Windows; macOS and headless Linux from docs only).

**Correction after review (2026-11-25): Supervised can't stop braid's threads if they run above Supervised.** T3 gates `t3_thread_interrupt` as a thread write (S10): for an OAuth client the limit is the approved level, narrowed by `T3-Mode-Limit`, and a target thread whose runtime mode ranks above it is refused with `runtime_mode_escalation_denied` (ranks: Supervised `approval-required` 0, `auto-accept-edits` 1, `auto` 2, Full access `full-access` 3) (S16). braid launches its threads with the project's default mode and sets none itself (`rg` finds no runtime mode in `.agents/skills/` or `src/`); this worker thread runs with permissions bypassed, so at least some braid threads run at Full access (inferred). So the level the board needs is the broadest mode of the threads it must stop, likely **Full access**, and the `T3-Mode-Limit: approval-required/default` cap this report first recommended would make every such interrupt fail. What changes below: the level the user approves, the cap (none, or `full-access/default`, which narrows nothing), and the threat model (a leaked token at Full access also drives workflows, S1). The rest of the flow, the token, expiry and 0080/D's size don't change. This reopens the user's "Supervised" decision; see Needs the user.

## Frame

Decision fed: what 0080/D builds, and whether braid takes its first runtime dependency (S14). Sub-questions: the five under the brief's Change. Candidates: (a) OAuth from a CLI command, (b) OAuth from a board button, (c) no OAuth: T3's own `t3 environment link` pairing (a peer link), or (d) stay on the `t3` CLI. (d) can't stop threads or read events (S12); (c) is for T3 environments, needs Linked environments on and tags the work as a link's (S8, S2). So (a) or (b), and for storage: a keyring library or the OS tools.

## 1. The flow

**Recommended: `braid t3 login` in a terminal on the host; the board only shows the state.**

1. The user runs `braid t3 login` (optionally `--url http://localhost:<port>`; a non-local address only if it is `https` and `--allow-remote` is given). Without `--url`, braid reads T3's local address from `<T3 home>/userdata/server-runtime.json` (`origin`, `port`; default port 3773) (S7). Only `localhost`, `127.0.0.1` or `https` addresses are accepted: T3 sends credentials only over those (S1, S48).
2. Discovery: one POST to `<origin>/mcp` without a token answers 401 with `resource_metadata` (S3); braid reads the protected-resource metadata, then `<issuer>/.well-known/oauth-authorization-server`, and refuses to go on unless the metadata's `issuer` equals the issuer it built the URL from, `S256` is listed and `authorization_response_iss_parameter_supported` is true (S2, S43, S44).
3. Registration: `POST /oauth/mcp/register` with `client_name: "braid board"`, `redirect_uris: ["http://127.0.0.1/callback"]`, `token_endpoint_auth_method: "none"`, `application_type: "native"`. T3 keeps nothing: the client id is the signed name and redirect list (S2). Registering again at each login is harmless.
4. The CLI listens on `127.0.0.1` on a port the OS picks, path `/callback`, for at most 5 minutes, and only on loopback (S45). T3 matches loopback redirects ignoring the port (S2).
5. It makes a 32-byte random `state` and a 32-byte PKCE verifier (43 base64url characters, S46), and opens `<issuer>/oauth/mcp/authorize?response_type=code&client_id=…&redirect_uri=http://127.0.0.1:<port>/callback&code_challenge=…&code_challenge_method=S256&state=…&resource=<origin>/mcp` in the default browser. It also prints that URL (it holds no secret) for a browser on another screen. It opens it without a shell (`rundll32 url.dll,FileProtocolHandler`, `open`, `xdg-open` as argument arrays), not through `openWithOs`'s `cmd /c start` (S13): the MCP guidance forbids shells for this (S51) and the URL is full of `&`.
6. In the browser, T3's own approval page (on `localhost` it is the environment's page, not the hosted app, S6) names "braid board" and the return address `127.0.0.1:<port>` (S6). The user enters a code made in T3 with **Use T3 Code in another app (MCP)** at **Full access** (the user's decision, q-b146; see the correction above for why Supervised can't stop braid's threads), which carries the level, or, in a browser already signed in to T3 with access rights, picks it (S1). braid never sees that code.
7. T3 redirects to `/callback?code=…&state=…&iss=…` (S2). The CLI compares `state` (constant time) and `iss` (exact string, S41, S47); on any mismatch it shows an error page and keeps nothing. It then posts `grant_type=authorization_code`, `code`, `code_verifier`, `redirect_uri`, `client_id`, `resource` to `/oauth/mcp/token` within the code's 60 s (S2). The browser tab gets a plain "Signed in; you can close this tab" page, without the code.
8. T3 answers `access_token`, `token_type: "Bearer"`, `expires_in` (30 days in seconds), `scope` (S2, S5). If `scope` lacks `orchestration:operate`, the user approved Read only: braid stores nothing and says Hold needs a level that may stop threads (S10, S16).
9. braid stores one secret-store entry and prints `Signed in to T3 at <origin> until <date>`. The board picks it up on its next read (below). Afterwards the board calls `POST <origin>/mcp` as in the mock (S11): `t3_thread_list`, `t3_thread_interrupt`, `events/poll`, each with the Bearer header, `mcp-protocol-version: 2026-07-28`, no `T3-Mode-Limit` narrower than the threads it must stop (S4, S16), and never an `Origin` header (T3 answers 403, S3).

Alternatives, a line each:
- **A board button** that starts the same flow from the board: the callback then lands on the board's own listener, an unauthenticated route on a long-running server; a click from the phone over Tailscale (S13) opens the browser on the host, where no one is. Worth adding later only if the terminal step is a nuisance.
- **Both**: the cost of both, for one sign-in a month.
- **`localhost` instead of `127.0.0.1` for the callback**: T3 accepts either (S2), RFC 8252 prefers the IP literal (S45).

## 2. The token

**Recommended: one entry in the OS store through `@napi-rs/keyring`, read by the board in-process.**

- What T3 returns: a Bearer access token, valid 30 days from the sign-in; no refresh token (T3 offers only `authorization_code`, S2) and no renewal on use for an outside agent (only peer links renew, S5). After 30 days the user signs in again.
- Where: service `braid`, account `t3:<origin>`; the value is a small JSON of `{ token, expiresAt, issuer, mcpUrl, clientId }` (about 0.6 KB, under Windows' 2,560-byte limit, S24), so no file holds the date or the address. Windows Credential Manager, macOS Keychain, Linux Secret Service (pinned: `{ linux: { store: "secret-service" } }`, because unpinned the library silently falls back to kernel keyutils, which loses the token at reboot, S20, S21).
- The board reads the entry at start, then at most once a minute and right after a 401, through `AsyncEntry` (about 16 ms measured, S22); it keeps the token in memory only.
- The board as a service: on Windows it is a Task Scheduler task with `InteractiveToken` (S13), the logged-on user (S25), and Local/Enterprise credentials are visible to all that user's logon sessions (S24), so the task reads what the terminal stored (inferred; check live). Under systemd `--user` the store is there only while a desktop or PAM login has unlocked the keyring; with lingering and no login it often isn't (S31).
- No secret store (headless Linux, a locked keyring, the library failing to load): `braid t3 login` refuses ("no secret store on this host; the board keeps using the t3 CLI") and the board stays signed out and works as today. There is no file, environment variable or prompt fallback.
- The dependency: `@napi-rs/keyring` 2.1.2 (2026-10-19), MIT, four releases since August 2026, prebuilt binaries for win32 x64/arm64, darwin x64/arm64 and linux gnu/musl as optional platform packages, no install script, nothing compiled on install (measured, S22). Costs: braid's first runtime dependency (S14); a native binary of about 1.9 MB on win32 x64 (measured; one platform package is installed per host); the Linux binaries statically link libdbus, licensed AFL-2.1 OR GPL-2.0-or-later (S20); on Windows it writes Enterprise persistence, which roams with a roaming profile (S24, S28). braid loads it with a dynamic `import()` inside the store module, so a missing or broken binary means "no secret store", not a broken CLI.
- The token never goes on argv, in an environment variable, a file, a log line, the board's page or API, a push or chat (the brief's rule). With the library it never leaves the process.

Alternatives:
- **Shell out to the OS tools, no dependency.** Windows has no tool that reads a password back (`cmdkey` lists only, S35); it takes a pwsh `Add-Type` P/Invoke of `CredWriteW`/`CredReadW`, about 0.3 s per read (S35). macOS `security add-generic-password -w <pw>` puts the token on argv; avoiding it takes `security -i` with the command on stdin, as go-keyring does (S26, S29), and CI has no Mac to test it. Linux `secret-tool store` reads stdin (S27) but needs `libsecret-tools` installed. Three implementations of about 60 lines each plus their tests; it works, and keeps braid dependency-free. The better choice if a native dependency is unwelcome.
- **keytar**: archived since 2022 (S23). **cross-keychain**: a layer over the same library with a file fallback braid must not use (S30). **CredentialManager** module: last published 2016 (S33).

## 3. Expiry and loss

**Recommended: the date from the sign-in, an amber chip and one push 5 days before, a 401 means signed out until the user signs in again.**

- The date: `expiresAt = now + expires_in`, stored with the token. T3 doesn't tell an outside agent its expiry on later calls (the `T3-Link-Expires-At` header is for peer links only, S4).
- Warning: from 5 days before `expiresAt` the board's T3 chip turns amber ("T3 sign-in ends on <date>; run braid t3 login") and the board sends one push, keyed like its other pushes so it goes once per sign-in. Five days covers a weekend away. At `expiresAt` the board stops calling `/mcp` and shows signed out.
- A 401 (T3 revoked or expired the session, S3, S5): the board marks itself signed out, stops every MCP call, goes back to `t3 thread list/show/send` and the 30 s poll, and sends one push. It does not retry the same token; it reads the store again once a minute and resumes only when the entry holds a different token (a new `braid t3 login`). A connection error is not a 401: T3 is down, and the board backs off as its CLI reads already do. No new state machine: "signed in" is "a token in the store, not past its date, not refused".
- Sign-out: `braid t3 logout` posts the token to `/oauth/mcp/revoke` (`token`, `token_type_hint=access_token`, `client_id`; T3 ends that session, S5, S6, S50), then deletes the entry. If T3 can't be reached it deletes the entry and says to revoke "braid board" in T3's **Settings → Sharing & access**.
- Revoked in T3's settings (S1): the next call gets 401, as above.

Alternatives: warning at 7 days (more nagging) or 2 days (a weekend can eat it); a push at every board start while expiring (repeats); deleting the store entry on a 401 (loses nothing, but makes a T3 bug look like a sign-out; not needed since the board won't reuse a refused token).

## 4. Threat model

- **What a leaked token can do:** at Supervised, read every project and thread, start threads in every project, message and stop only threads at Supervised (`t3_thread_send` has the same gate, S10), started or steered threads run at most Supervised, no workflows (S1, S16); at Full access, the same for every thread at any mode, plus starting, answering, resuming and cancelling workflow runs (S1). For 30 days, until revoked. It is a plain Bearer token, not bound to a key, so it works from wherever T3's address is reachable: the host only, or also the tailnet or the internet if the user serves T3 over Tailscale or T3 Connect (inferred from S1, S3).
- **Another local user:** each OS store is per user (S24, S34, S27); they can't read it. An administrator or root can.
- **Another process of the same user:** can read Credential Manager and an unlocked Secret Service entry, and on macOS can run `security` (S26). It can already do more without the token: `t3 thread` on the host needs no sign-in (S1). So the token adds risk mainly if it leaves the host, which is why it never goes anywhere but the store and the Authorization header.
- **The loopback callback:** open only during a sign-in, on `127.0.0.1` and a fresh port. A forged callback fails the `state` check; a stolen code is useless without the verifier (PKCE) and dies in 60 s; a mixed-up server fails the `iss` check (S45–S47, S49). The callback page never echoes the code.
- **What braid does to limit it:** asks for Full access (the decided level) and refuses Read only; calls only thread reads (`t3_thread_list` and the like), `t3_thread_interrupt` and `events/*`, never workflow tools; sends no `T3-Mode-Limit` (S4 is not used: a cap below the threads' mode stops Hold from working, S16); talks only to a local T3 address, or `https` with `--allow-remote`; prints the authorize URL, the level and the date, never the token, and its errors name HTTP statuses, never headers. The `scope` an authorize request names is ignored by T3 (S2), so what limits braid is the level the user approves and the calls braid makes, not the request.
- **The board's own sign-in is a different thing** and the two can't be swapped: the board's session token is random per run, guards the board's page (`x-braid-token`, the owner-only `~/.braid/board-<port>.url`, Tailscale whois, S13) and never leaves the host; the T3 token is outbound only, lives in the OS store and never reaches the board's page, API or address file. The words differ: "board address" for the first, "T3 sign-in" for the second, in the CLI, the tooltip and the docs.

## 5. What 0080/D builds

- **Commands:** `braid t3 login [--url <origin>] [--allow-remote]` (a local address only, unless the URL is `https` and `--allow-remote` is given), `braid t3 logout`, `braid t3 status` (signed in or not, origin, the approved level as far as T3 reports it (`scope` says only read or operate), end date; never the token). New `src/commands/t3.ts`.
- **Library code:** `src/t3/oauth.ts` (discovery, registration, PKCE, the callback listener, the token exchange, revoke), `src/t3/secret.ts` (the store: `@napi-rs/keyring` behind a small interface with a fake for tests, or the three OS-tool backends if the user prefers no dependency), and the token feed into 0080/B's MCP client with the 401 rule (no `T3-Mode-Limit`).
- **Board pieces:** a T3 chip, icon-only with words in the tooltip: "signed in · Full access · until <date>" (the level is the one `braid t3 login` asked for; T3 doesn't report it, S2, so a wrong pick shows as a refused interrupt, `runtime_mode_escalation_denied`, which the board shows on the chip, S16); amber, ends on a date; signed out (and why: not signed in, refused, no secret store), each tooltip naming `braid t3 login`; the one push before expiry and the one on a 401. No sign-in button (section 1).
- **Tests:** a fake T3 authorization server on `127.0.0.1` in the test (metadata, register, authorize answering with a redirect, token, revoke) covering the happy path, a wrong `state`, a wrong or missing `iss`, an expired code, Read only refused, revoke; a fake store (none, locked, present); the board's state from a fake store and a 401 from the mock MCP server (no retry, one push); a check that the token appears in no log or API output. Real HOME, APPDATA and the real store untouched.
- **Docs:** `docs/cli.md` (the three commands), `docs/board.md` (the chip, signing in, the service and headless Linux), `docs/decisions.md` (the user's decision on this report).
- **Estimate:** about 1,100 lines in 12 files: oauth.ts ~250, secret.ts ~60 (~180 with OS tools), t3.ts ~120, board and page ~180, tests ~450, docs ~40; tier L, as planned.
- **Live check once the user signs in:** `braid t3 login` against the real T3 with a code at the decided level; `braid t3 status`; from a test board on another port and a temporary `BRAID_HOME`: `t3_thread_list`, `events/poll`, and `t3_thread_interrupt` `stop: true` on scratch threads only (`scratch: true`, archived after), one at Supervised and one at Full access, to see S16's refusal or its absence live; revoke "braid board" in Settings and see the board turn signed out with one push; `braid t3 logout`. On Windows also from the board's Task Scheduler task, to confirm it reads the terminal's entry.

## Against

- A board button instead of the CLI: roughly even (45–55%) as a preference; the security case favours the CLI (no unauthenticated route on the board), the convenience case the button.
- Shelling out instead of the library: unlikely to be better (20–45%), unless avoiding a native dependency or the libdbus licence weighs more than three backends and a 0.3 s Windows read.
- The answer hangs on: the board task reading the terminal's Credential Manager entry (inferred, S24, S25; checked live in D); T3 keeping these endpoints in later versions (T3's DCR is deprecated in MCP 2026-07-28 but kept at least 12 months, S42); the mode braid's threads run in (inferred from this worker's session, not read from T3).

## Unknowns

- Whether a systemd `--user` board sees an unlocked Secret Service on the user's Linux hosts: a run on a desktop and on a headless host with lingering.
- macOS Keychain prompts after a Node upgrade for an item the library wrote: a run on a Mac (no Mac in CI).
- The exact `origin` T3 writes to `server-runtime.json` (`localhost` or `127.0.0.1`): one read of the file during D's live check.
- Whether the Node binding can choose Local instead of Enterprise persistence on Windows: its `index.d.ts`.

## Searched

T3's v0.1.12 extract and its installed server bundle (S1–S11, the identifiers listed in sources.md), braid's board and service code (S13–S15), the MCP authorization pages and RFCs 8252, 7636, 9207, 9700, 7009 and OAuth 2.1 (S40–S52), and secret-store libraries, man pages and Microsoft docs, with runs on this Windows machine (S20–S35). Set-aside sources are at the end of sources.md.

## Delivery

What changed: this report and `sources.md` in the item folder; the brief's Plan. No product code.

Review fix (PR #329): S10 corrected (`t3_thread_interrupt` is `Destructive: true`, gated by `McpToolAccess.writesThreads`, not `Readonly: false`); reading that gate found S16, which changes the level; the correction above and the lines that depended on it were updated.

Why: the user asked how the board would sign in and decides before 0080/D builds it (security, dependency).

Validation: the T3 facts were read from its code at v0.1.12 (the extract and the installed bundle); the keyring library and the Windows tools were run on this machine with dummy secrets in a scratch folder (S22, S35); no live sign-in and no T3 call. `braid check` passes. `npm run verify` locally (1,662 s on the loaded machine): 706 of 707 tests pass; the one failure is `test/requests.test.ts:324` "overlapping writers in separate processes lose no update when they start on a stale lock" (six child processes take a lock; three exit 1 after about 130–157 s), failing again when run alone, unrelated to this braids-only diff and green on main's CI; CI on this PR decides.

Docs: none affected; the spike changes no behaviour (docs/ and the roadmap change only in D and H, as the brief says).

For later items: 0080/B: send no `Origin` header and no `T3-Mode-Limit` (S4 not used, S16), and treat 401 as "signed out", not as a retry (S3, S4). 0080/D: don't reuse `openWithOs` for the authorize URL (S51); the board's existing `openWithOs` passes T3 thread links through `cmd /c start`, worth a look under P26 or a later item if a link can ever hold `&`. 0080/H: the words "board address" and "T3 sign-in".

Decisions (the user, q-b146 through the PM, 2026-11-25): "Full Access if it's not worse than what we have now": the board signs in at Full access. It is not worse than today on the host: `t3 thread` already gives any process of the user T3's thread tools without a sign-in (S1); what the token adds is a 30-day credential that also reaches T3 wherever T3 is exposed (Tailscale, T3 Connect) and could drive workflows if it leaked (S1), which is why it lives only in the OS store and braid calls no workflow tools. "ok" to `@napi-rs/keyring`. The PM's conditions for 0080/D: a local T3 address only, unless the URL is `https` and an explicit `--allow-remote` flag is given; the chip's tooltip says "signed in · Full access · until <date>"; `braid t3 logout` revokes the token in T3 (S6, S50) before deleting it.

Needs the user: none (answered: q-b146).
