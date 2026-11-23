// The running board's local address with its session token (D92): one file per port,
// `~/.braid/board-<port>.url`, so a board with no console (started at login or as a service) can still be
// acted on from its page. Written owner-only when a real board run listens, removed when it stops; a file a
// killed board left behind is told apart by asking the port (`liveAddresses`).
import { randomBytes } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { braidHome } from "../notify/config.js";

const NAME = /^board-(\d{1,5})\.url$/;

/** The address file of the board on `port`. */
export function addressFile(port: number, home: string = braidHome()): string {
  return join(home, `board-${port}.url`);
}

/**
 * Writes `url` (`http://127.0.0.1:<port>/#token=<hex>`) as the address of the board on `port`. The temporary file is
 * created with mode 0600 (owner only on POSIX; on Windows the profile folder's ACL already limits it to the user) and
 * renamed over the port's file, so the token is never readable by others, not even for a moment, and a newer run replaces it.
 */
export function writeAddress(port: number, url: string, home: string = braidHome()): string {
  mkdirSync(home, { recursive: true });
  const file = addressFile(port, home);
  const temp = `${file}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  writeFileSync(temp, `${url}\n`, { mode: 0o600, flag: "wx" });
  try {
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

/** Whether a board answers at `url` with its token: a stale file's port answers nothing, or with another run's token. */
export type Probe = (url: string) => Promise<boolean>;

export const SESSION_PATH = "/api/session";

export const probeBoard: Probe = async (url) => {
  const at = url.indexOf("#token=");
  try {
    const response = await fetch(`${url.slice(0, at).replace(/\/$/, "")}${SESSION_PATH}`, {
      headers: { "x-braid-token": url.slice(at + "#token=".length) },
      signal: AbortSignal.timeout(2000),
    });
    return response.status === 204;
  } catch {
    return false;
  }
};

/** The addresses of the boards running now: the files whose board answers with their token. */
export async function liveAddresses(home: string = braidHome(), probe: Probe = probeBoard): Promise<Address[]> {
  const all = readAddresses(home);
  const live = await Promise.all(all.map((a) => probe(a.url)));
  return all.filter((_, i) => live[i]);
}
