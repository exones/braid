**0080/D: The board signs in to T3**

**What changed**

- `braid t3 login [--url]`, `logout`, `status` and `set` (`src/commands/t3.ts`, usage lines in `src/cli.ts`). `login` runs T3's OAuth for outside agents (`src/t3/oauth.ts`):
  - discovery, refusing another issuer, no S256 or no `iss`;
  - registration as "braid board", PKCE S256 and a fresh `state`;
  - the approval page opened without a shell (`rundll32`, `open`, `xdg-open`);
  - a one-off `127.0.0.1` listener for 5 minutes that answers only its own `state`, once;
  - `iss` checked, then the code exchanged;
  - Full access required: a token whose scopes lack `settings:write` is revoked and refused.

  `logout` revokes in T3, then deletes; if T3 can't be reached it deletes the entry and names T3's Settings → Sharing & access. `status` reads the store only.
- The token is only in the OS secret store (`src/t3/secret.ts`): one entry, service `braid`, account `t3`, value `{ token, expiresAt, issuer, mcpUrl, clientId }`. It goes through `@napi-rs/keyring` 2.1.2 (pinned, braid's first runtime dependency), loaded with a dynamic `import()`, so a missing binary reads as "no secret store". On Linux it is pinned to Secret Service. There is no fallback.
- The two settings (`src/t3/settings.ts`) live in `~/.braid/t3.json`: `access` `auto`|`cli` and `localOnly` (defaults `auto` and on). A missing or unreadable file means the defaults.
- The board side (`src/t3/signin.ts`, wired in `src/commands/board.ts`):
  - It reads the store at the start, at most once a minute and right after a 401. The token stays in memory only.
  - `client()` hands 0080/E and 0080/F an MCP client while the board is signed in and `access` is `auto`. A 401 through that client signs the board out for that token, with no retry and one push; it signs in again only when the store holds a different token.
  - One push goes 5 days before the end. Both pushes are keyed per sign-in in `~/.braid/t3-notified.json` and go through `braid notify`'s settings.
  - The board makes no T3 call on a timer.
  - `/api/all` carries `t3SignIn` (no token), and `braid board` prints the state at the start.
- The T3 button (`web/src/T3.tsx`, shared words in `src/t3/words.ts`) follows the approved mockups:
  - It sits after the provider chips (first in the phone's chip strip) and is icon-only, with the tooltip words from the brief.
  - Six looks: the four states, plus faint for no secret store and blue while waiting.
  - A panel (a bottom sheet on the phone) offers Sign in, Sign in again, Sign out with a confirmation, and the waiting state with Open the approval page again and Cancel.
  - `POST /api/t3/login|cancel|logout` are gated like every action. `login` is refused (403) on the Tailscale listener; `logout` works there too.
  - `GET /t3/callback` answers on the local listener only, to the pending click's own `state`, once, within 5 minutes; anything else gets 404.
- Leftover 2026-11-26-7wrg in `src/t3mcp`: `callTool` now reads `token()` once, and there are tests for a refused redirect, a bare 5xx and the single token read.

**Why:** the user decided on Full access with `@napi-rs/keyring` (q-b146), the two settings and the sign-in button. The verdict on the mockups (q-nxp6) approved the design and all four proposals. For performance, the sign-in adds no periodic T3 reads.

**Validation**

- `test/t3-signin.test.ts` (23 tests) runs against a fake T3 (`test/fixtures/t3-oauth-fake.ts`) and an in-memory store. It covers:
  - the login happy path;
  - a wrong `state` (404, then the right one goes on) and a callback path that isn't `/callback`;
  - a reused callback;
  - a wrong `iss` and a missing one;
  - an expired code;
  - Supervised and Read only, each refused and revoked;
  - a denial in T3;
  - no or a locked store, where nothing is called;
  - a keyring library that doesn't load;
  - a non-local address refused while `localOnly` is on, and over `http` when it is off;
  - logout revoking, and logout with T3 down;
  - `status` and `set`, including an unreadable `t3.json`;
  - the board's states from the store (in, soon with one push that isn't sent again after a restart, ended, none, locked);
  - a 401 (one MCP call, no retry, signed out, one push, back in with a new token);
  - a connection error that isn't a sign-out;
  - `access: cli` (signed in, no client);
  - the button's sign-in through the board's callback, followed by the board's sign-out;
  - the callback's 404 for no sign-in pending, a wrong state, the Tailscale listener, a POST, an expired sign-in and a cancelled one;
  - the phone: sign-in refused, sign-out works;
  - no store: sign-in refused.

  Every output, error, API body, page and push is checked to hold no issued token.
- `test/t3mcp.test.ts`: 3 new tests (the 7wrg leftover).
- The page, checked on `braid board --demo` (test port 7842, temporary HOME): the button after the chips, the signed-in panel on the desktop and the sheet on the phone. Screenshots are in `~/.braid/artifacts/braid/0080/0080D-built-*.png`.
- `npm run verify` couldn't finish in one run on this loaded machine: a first run hit the 30-minute background limit, and a second was stopped for the merge of main. Its steps were run after the merge instead, and all of them came out as follows:
  - The docs gate, OIDC guard, typecheck and build pass.
  - Every `test/board*.test.ts`: 305 of 305 pass. `board-wake` took 31 minutes alone, and the first combined run cut it off at a 25-minute timeout.
  - Every other test file: 584 of 586 pass. The one failure is `test/inbox.test.ts` "the first note creates braid-inbox", a timing check that expected an age of `0m` and got `1m` because the test took 91 s under load. It doesn't touch this change. The 586th didn't run as a pass or a fail.
  - `test/cli.test.ts` needed `t3` in its list of commands handled in `main`, and its help-name pattern now takes digits.
  CI's verify on both platforms is the full run.
- Merged `origin/main` (0077, 397b2431) as the coordinator asked. Both sides were kept, and the log names each conflict.

**Docs:**
- `docs/board.md`: a new "T3 sign-in" section with "The T3 button"; Actions names the T3 routes and the callback.
- `docs/cli.md`: the four `braid t3` rows.
- `docs/decisions.md`: D121 and the log entry for q-b146 and q-nxp6.
- `README.md`: the board line.

**Decided:** the store's account is `t3`, not `t3:<origin>`. With one sign-in at a time, the board finds the entry without knowing T3's address, and a new sign-in replaces (and revokes) the old one. The address is in the entry's value. Full access is recognised by the token's `scope` holding `settings:write` (T3 0.1.13's `mcpClientScopes` gives Full access `settings:write source-control:write` on top of Supervised's scopes).

**Size:** about 2,200 lines in 22 files, against about 1,100 expected:
- tests and the fake T3: about 650 lines;
- the button's panel with the waiting state and the confirmation the user approved: about 250;
- the docs: about 50;
- the 7wrg tests: about 50.

**Open:** the live check with the user's real sign-in comes after review, through the coordinator, as the brief says:
1. `braid t3 login` at Full access, then `braid t3 status`.
2. On a test board on another port with a temporary `BRAID_HOME`: `t3_thread_list`, `events/poll`, and `t3_thread_interrupt` on a scratch thread.
3. Revoke "braid board" in T3, and see the board turn signed out with one push.
4. `braid t3 logout`.
5. On Windows, the board's Task Scheduler task reading the terminal's entry.

None of it has been run: no real token, no real T3 sign-in, port 7800 and the real `~/.braid` untouched.

For later items: 0080/E and 0080/F take the client from `BoardSignIn.client()` (null means use the `t3` command line). It already turns a 401 into signed out. 0080/E should show a refused interrupt's `runtime_mode_escalation_denied` on the card.

Needs the user: none
