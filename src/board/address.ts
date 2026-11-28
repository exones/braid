// The running board's local address with its session token (D94): one file per port,
// `~/.braid/board-<port>.url`, so a board with no console (started at login or as a service) can still be
// acted on from its page. Written owner-only when a real board run listens, removed when it stops; a file a
// killed board left behind is told apart by asking the port (`liveAddresses`).
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { braidHome } from "../notify/config.js";
import { system32 } from "../system32.js";

const NAME = /^board-(\d{1,5})\.url$/;

/** The address file of the board on `port`. */
export function addressFile(port: number, home: string = braidHome()): string {
  return join(home, `board-${port}.url`);
}

/**
 * Makes `file` owner-only on Windows: its inherited entries removed and the current user (by SID) granted full control,
 * nothing else, by whoami and icacls from System32 (never by bare name). A file under `~/.braid` otherwise inherits the folder's ACL, which can grant other accounts read access
 * (a sandbox group, for one). Throws when it can't be done. A test seam; POSIX has mode 0600 instead.
 */
export type OwnerOnly = (file: string) => void;
export const ownerOnlyAcl: OwnerOnly = (file) => {
  const who = spawnSync(system32("whoami.exe"), ["/user", "/fo", "csv", "/nh"], { encoding: "utf8", windowsHide: true });
  const sid = /"(S-1-[\d-]+)"/.exec(who.stdout ?? "")?.[1];
  if (sid === undefined) {
    throw new Error(`can't find the current user's SID (whoami /user: ${(who.stderr || who.error?.message || who.stdout || "no output").trim()})`);
  }
  const r = spawnSync(system32("icacls.exe"), [file, "/inheritance:r", "/grant:r", `*${sid}:F`], { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) {
    throw new Error(`icacls couldn't make it owner-only: ${(r.stderr || r.error?.message || r.stdout || `exit ${r.status}`).trim()}`);
  }
};

/**
 * Writes `url` (`http://127.0.0.1:<port>/#token=<hex>`) as the address of the board on `port`, owner-only, then renames
 * it over the port's file, so a newer run replaces it. The temporary file is created empty with mode 0600 (owner only on
 * POSIX); on Windows it then gets its own ACL (`ownerOnly`, inheritance off) before the token is written, so the token is
 * never in a file others can read, not even for a moment. A rename keeps the file's ACL. When the ACL can't be set the
 * empty file is removed and this throws: the token is never written to a file it couldn't protect.
 */
export function writeAddress(port: number, url: string, home: string = braidHome(), ownerOnly: OwnerOnly | null = process.platform === "win32" ? ownerOnlyAcl : null): string {
  mkdirSync(home, { recursive: true });
  const file = addressFile(port, home);
  const temp = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  writeFileSync(temp, "", { mode: 0o600, flag: "wx" });
  try {
    ownerOnly?.(temp);
    writeFileSync(temp, `${url}\n`, { flag: "r+" });
    renameSync(temp, file);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
  return file;
}
/** Removes the address file of the board on `port` while it still holds `url` (a newer run's address stays). Never throws. */
export function removeAddress(port: number, url: string, home: string = braidHome()): void {
  const file = addressFile(port, home);
  try {
    if (readFileSync(file, "utf8").trim() === url) {
      rmSync(file, { force: true });
    }
  } catch {
    // Gone already, or unreadable: nothing of this run's to remove.
  }
}

export interface Address {
  readonly port: number;
  readonly url: string;
}

/** Every address file under `home`, by port; a file without a board URL for its own port is skipped. */
export function readAddresses(home: string = braidHome()): Address[] {
  let names: string[];
  try {
    names = readdirSync(home);
  } catch {
    return [];
  }
  const found: Address[] = [];
  for (const name of names) {
    const m = NAME.exec(name);
    if (m === null) {
      continue;
    }
    const port = Number(m[1]);
    let url: string;
    try {
      url = readFileSync(join(home, name), "utf8").trim();
    } catch {
      continue;
    }
    if (url.startsWith(`http://127.0.0.1:${port}/#token=`)) {
      found.push({ port, url });
    }
  }
  return found.sort((a, b) => a.port - b.port);
}

export const SESSION_PATH = "/api/session";
/** The header of `/api/session`'s 204: the version the running board started from. */
export const VERSION_HEADER = "x-braid-version";

/** How long a board may take to answer the probe before it reads as busy. */
export const PROBE_MS = 10_000;

/**
 * What a port says to an address file's token. `answers`: the board of this run, with the version it started from when it
 * names one. `busy`: something listens there but didn't answer in time. `none`: nothing listens, or it answers otherwise
 * (a stale file's port with another run's token).
 */
export type Probed = { readonly state: "answers"; readonly version: string | null } | { readonly state: "busy" } | { readonly state: "none" };
export type Probe = (url: string) => Promise<Probed>;

/** One request with the whole budget: a retry would give up on a board that needs longer than one attempt. */
export async function probeBoard(url: string, budgetMs: number = PROBE_MS): Promise<Probed> {
  const at = url.indexOf("#token=");
  try {
    const response = await fetch(`${url.slice(0, at).replace(/\/$/, "")}${SESSION_PATH}`, {
      headers: { "x-braid-token": url.slice(at + "#token=".length) },
      signal: AbortSignal.timeout(budgetMs),
    });
    return response.status === 204 ? { state: "answers", version: response.headers.get(VERSION_HEADER) } : { state: "none" };
  } catch (error) {
    // A closed port refuses at once; only a port that takes the request and stays silent runs into the budget.
    return { state: (error as Error).name === "TimeoutError" ? "busy" : "none" };
  }
}

/** An address whose board runs: it answered, or its port is busy. */
export type Live = Address & ({ readonly state: "answers"; readonly version: string | null } | { readonly state: "busy" });

/** The addresses of the boards running now: the files whose board answers with their token, or whose port is busy. */
export async function liveAddresses(home: string = braidHome(), probe: Probe = probeBoard): Promise<Live[]> {
  const all = readAddresses(home);
  const probed = await Promise.all(all.map((a) => probe(a.url)));
  return all.flatMap((a, i): Live[] => {
    const p = probed[i];
    return p === undefined || p.state === "none" ? [] : [{ ...a, ...p }];
  });
}
