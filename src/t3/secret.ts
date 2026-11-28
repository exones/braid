// The T3 sign-in in the OS secret store: one entry (service `braid`, account `t3`) holding `{ token, expiresAt,
// issuer, mcpUrl, clientId }`, through `@napi-rs/keyring` (Windows Credential Manager, macOS Keychain, Linux Secret
// Service). The library is loaded with a dynamic import, so a missing or broken binary reads as "no secret store",
// never a broken CLI. On Linux the entry is pinned to Secret Service: unpinned, the library falls back to the kernel
// keyring, which loses the token at reboot. There is no file, environment or prompt fallback (0080/A, the brief).

export const SERVICE = "braid";
export const ACCOUNT = "t3";

export interface SignInEntry {
  readonly token: string;
  /** When T3 ends the sign-in (ISO); T3 doesn't renew an outside agent's sign-in. */
  readonly expiresAt: string;
  /** T3's origin, as its metadata names it (`http://127.0.0.1:3773`). */
  readonly issuer: string;
  readonly mcpUrl: string;
  readonly clientId: string;
}

/** The store can't be used on this host (no store, a broken library, a locked or unreachable keyring). Its message names no secret. */
export class NoSecretStore extends Error {
  override readonly name = "NoSecretStore";
}

export interface SecretStore {
  /** The entry, or null when there is none (or it isn't braid's shape). Rejects with `NoSecretStore`. */
  read(): Promise<SignInEntry | null>;
  write(entry: SignInEntry): Promise<void>;
  /** Deletes the entry; false when there was none. */
  remove(): Promise<boolean>;
}

interface KeyringEntry {
  getPassword(): Promise<string | null>;
  setPassword(value: string): Promise<void>;
  deletePassword(): Promise<boolean>;
}
type KeyringModule = { AsyncEntry: new (service: string, account: string, options?: { linux?: { store?: "secret-service" | "keyutils" } }) => KeyringEntry };

/** Reads an entry's value: the JSON braid wrote, or null for anything else. */
export function parseEntry(value: string | null): SignInEntry | null {
  if (value === null) {
    return null;
  }
  let o: unknown;
  try {
    o = JSON.parse(value);
  } catch {
    return null;
  }
  if (typeof o !== "object" || o === null) {
    return null;
  }
  const r = o as Record<string, unknown>;
  const s = (k: string): string | null => (typeof r[k] === "string" && r[k] !== "" ? r[k] : null);
  const token = s("token");
  const expiresAt = s("expiresAt");
  const issuer = s("issuer");
  const mcpUrl = s("mcpUrl");
  const clientId = s("clientId");
  if (token === null || expiresAt === null || Number.isNaN(Date.parse(expiresAt)) || issuer === null || mcpUrl === null || clientId === null) {
    return null;
  }
  return { token, expiresAt, issuer, mcpUrl, clientId };
}

const loadKeyring = async (): Promise<KeyringModule> => (await import("@napi-rs/keyring")) as unknown as KeyringModule;

/** The OS store through `@napi-rs/keyring`; `load` is replaced in tests to stand for a missing library. */
export function keyringStore(load: () => Promise<KeyringModule> = loadKeyring): SecretStore {
  let entry: KeyringEntry | undefined;
  const open = async (): Promise<KeyringEntry> => {
    if (entry !== undefined) {
      return entry;
    }
    let mod: KeyringModule;
    try {
      mod = await load();
    } catch {
      throw new NoSecretStore("no secret store on this host (the keyring library didn't load)");
    }
    try {
      entry = new mod.AsyncEntry(SERVICE, ACCOUNT, { linux: { store: "secret-service" } });
    } catch {
      throw new NoSecretStore("no secret store on this host (no Secret Service)");
    }
    return entry;
  };
  // Never the library's own message: keep what leaves this module to words braid chose.
  const guard = async <T>(what: string, run: (e: KeyringEntry) => Promise<T>): Promise<T> => {
    const e = await open();
    try {
      return await run(e);
    } catch {
      throw new NoSecretStore(`the secret store couldn't ${what} (locked or unavailable)`);
    }
  };
  return {
    read: () => guard("be read", async (e) => parseEntry(await e.getPassword())),
    write: (value) => guard("be written", (e) => e.setPassword(JSON.stringify(value))),
    remove: () => guard("delete the entry", (e) => e.deletePassword()),
  };
}

/** A store in memory for tests: `none` stands for a host without a store, `locked` for one that refuses to be read. */
export function memoryStore(start: SignInEntry | null | "none" | "locked" = null): SecretStore & { value(): SignInEntry | null | "none" | "locked" } {
  let value = start;
  const check = (): void => {
    if (value === "none") {
      throw new NoSecretStore("no secret store on this host");
    }
    if (value === "locked") {
      throw new NoSecretStore("the secret store couldn't be read (locked or unavailable)");
    }
  };
  return {
    read: async () => {
      check();
      return value as SignInEntry | null;
    },
    write: async (e) => {
      check();
      value = e;
    },
    remove: async () => {
      check();
      const had = value !== null;
      value = null;
      return had;
    },
    value: () => value,
  };
}
