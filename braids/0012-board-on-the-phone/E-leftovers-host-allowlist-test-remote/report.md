# Report 0012/E

**What changed**
- `test/board-tailnet.test.ts`: `tailnetHosts` is locked to the Tailscale address and MagicDNS name with the port (IPv6 bracketed, no MagicDNS, and 127.0.0.1, localhost, 0.0.0.0, a bare name or IP, another port all absent).
- `BoardData.remote` (`src/board/model.ts`): the server sets it per listener (`true` on the Tailscale one). The page (`web/src/App.tsx`) reads it through a context instead of `location.hostname`, so a local board opened as `localhost` keeps Open thread. Test: `/api/board` says `remote` true/false per listener, and false for a `localhost` Host.
- `braid board --port <n>` (`src/commands/board.ts`): both listeners use that port; a bad number or a port in use is a usage error with a message, and the local listener is closed if the Tailscale one fails. Without `--port`, behaviour is unchanged. Tests for local only, with `--host`, in-use refusal and bad numbers.
- Docs: `docs/board.md`, `docs/cli.md`, D60.

**Why:** the three 0012/C leftovers (ty0o, phl4, z0ug).

**Validation:** `npm run verify` passed (273 tests). The page change is covered only by the server field test; no browser run.

**Open:** the in-use check binds the port and releases it, so "before anything listens" is "nothing stays listening". The Tailscale-address test uses 127.0.0.2 as the Tailscale IP (works on Windows and Linux, not macOS).

For later items: none.
Needs the user: none
