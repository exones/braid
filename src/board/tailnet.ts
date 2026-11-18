// `braid board --host`: which Tailscale address the board may listen on, and who may use it there.
// Everything comes from tailscaled at run time (`tailscale status --json`, `tailscale whois --json`);
// tests pass a fake runner, so no real tailscaled is needed.
import { execFile } from "node:child_process";
import { isIP } from "node:net";
import { UsageError } from "../commands/braids.js";

export interface TailscaleResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** Runs `tailscale <args>`. A call that fails to start or times out resolves with a null status. */
export type TailscaleRunner = (args: readonly string[]) => Promise<TailscaleResult>;

/** How long one `tailscale` call may take before it counts as failed. */
export const TAILSCALE_TIMEOUT_MS = 3_000;

export const runTailscale: TailscaleRunner = (args) =>
  new Promise((done) => {
    execFile("tailscale", [...args], { encoding: "utf8", timeout: TAILSCALE_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
      const code = error === null ? 0 : typeof (error as { code?: unknown }).code === "number" ? (error as { code: number }).code : null;
      done({ status: code, stdout: stdout ?? "", stderr: stderr || error?.message || "" });
    });
  });

/** This machine on its tailnet, from `tailscale status --json`. */
export interface Tailnet {
  /** This machine's Tailscale addresses, IPv4 first. */
  readonly ips: readonly string[];
  /** The MagicDNS name without the trailing dot (`pc.tail1234.ts.net`), or null when MagicDNS is off. */
  readonly name: string | null;
  /** The login of the Tailscale user who owns this machine; the only one the board serves. */
  readonly owner: string;
}

const obj = (v: unknown): Record<string, unknown> | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const parse = (text: string): Record<string, unknown> | null => {
  try {
    return obj(JSON.parse(text));
  } catch {
    return null;
  }
};
const firstLine = (r: TailscaleResult): string => r.stderr.trim().split(/\r?\n/)[0] || "tailscale failed";
const refuse = (why: string): never => {
  throw new UsageError(`--host: ${why}`);
};

/** Reads this machine's Tailscale addresses, MagicDNS name and owner. Refuses (UsageError) when Tailscale can't serve the board. */
export async function readTailnet(run: TailscaleRunner = runTailscale): Promise<Tailnet> {
  const r = await run(["status", "--json"]);
  if (r.status !== 0) {
    refuse(`Tailscale isn't available (${firstLine(r)})`);
  }
  const status = parse(r.stdout);
  const self = obj(status?.["Self"]);
  if (status === null || self === null) {
    refuse("tailscale status --json gave no readable answer");
  }
  const state = status?.["BackendState"];
  if (typeof state === "string" && state !== "Running") {
    refuse(`Tailscale is ${state}, not Running; connect it first`);
  }
  const ips = Array.isArray(self?.["TailscaleIPs"]) ? (self["TailscaleIPs"] as unknown[]).filter((ip): ip is string => typeof ip === "string" && isIP(ip) !== 0) : [];
  if (ips.length === 0) {
    refuse("this machine has no Tailscale address; connect Tailscale first");
  }
  const tags = self?.["Tags"];
  if (Array.isArray(tags) && tags.length > 0) {
    refuse(`this machine is a tagged node (${tags.join(", ")}), so no Tailscale user owns it and nobody could be let in`);
  }
  const owner = obj(obj(status?.["User"])?.[String(self?.["UserID"])])?.["LoginName"];
  if (typeof owner !== "string" || owner === "") {
    refuse("tailscale status --json doesn't say which user owns this machine");
  }
  const dns = typeof self?.["DNSName"] === "string" ? (self["DNSName"] as string).replace(/\.$/, "").toLowerCase() : "";
  return { ips: [...ips].sort((a, b) => isIP(a) - isIP(b)), name: dns === "" ? null : dns, owner: owner as string };
}

/**
 * The address the Tailscale listener binds for `--host <host>`: `tailscale` is the IPv4 Tailscale address, a
 * Tailscale IP of this machine is itself, its MagicDNS name is the IPv4 address. Anything else, `0.0.0.0` and
 * `::` included, is refused with the reason, before anything listens.
 */
export function tailnetAddress(host: string, tailnet: Tailnet): string {
  const ipv4 = tailnet.ips.find((ip) => isIP(ip) === 4) ?? tailnet.ips[0] ?? "";
  const h = host.trim().toLowerCase().replace(/^\[(.*)\]$/, "$1").replace(/\.$/, "");
  if (h === "tailscale" || (tailnet.name !== null && h === tailnet.name)) {
    return ipv4;
  }
  const mine = tailnet.ips.find((ip) => ip.toLowerCase() === h);
  if (mine !== undefined) {
    return mine;
  }
  const allowed = `tailscale, ${[...tailnet.ips, ...(tailnet.name === null ? [] : [tailnet.name])].join(", ")}`;
  if (h === "0.0.0.0" || h === "::" || h === "") {
    return refuse(`${host || "an empty address"} would serve every network; the board serves only this machine's Tailscale address (${allowed})`);
  }
  return refuse(`${host} is not this machine's Tailscale address; use one of ${allowed}`);
}

/** The `Host` values the Tailscale listener answers to: its address and MagicDNS name, with the port. */
export function tailnetHosts(address: string, name: string | null, port: number): string[] {
  return [isIP(address) === 6 ? `[${address}]:${port}` : `${address}:${port}`, ...(name === null ? [] : [`${name}:${port}`])];
}

/** Decides whether a connection from `address:port` may use the board; it never rejects. */
export type Gate = (address: string, port: number) => Promise<boolean>;

export interface GateOptions {
  /** How long an answer is kept per remote address. */
  readonly ttlMs?: number;
  /** How long a whois may take; a slower one refuses. */
  readonly timeoutMs?: number;
  readonly now?: () => number;
}

/** True when tailscaled says the peer is a node of `owner` and carries no tags. */
export function ownerOf(whois: string, owner: string): boolean {
  const reply = parse(whois);
  const login = obj(reply?.["UserProfile"])?.["LoginName"];
  const node = obj(reply?.["Node"]);
  const tags = node?.["Tags"];
  return node !== null && typeof login === "string" && login === owner && (tags === undefined || tags === null || (Array.isArray(tags) && tags.length === 0));
}

/**
 * The Tailscale listener's identity check: `tailscale whois --json <ip>:<port>` of each connection, allowed only for
 * the owner's login on an untagged node. Every failure (tailscaled down, an unknown peer, unreadable output,
 * a timeout) refuses. An answer is kept for a few seconds per remote address; concurrent asks share one call.
 */
export function whoisGate(owner: string, run: TailscaleRunner = runTailscale, options: GateOptions = {}): Gate {
  const ttl = options.ttlMs ?? 5_000;
  const timeout = options.timeoutMs ?? TAILSCALE_TIMEOUT_MS;
  const now = options.now ?? Date.now;
  const cache = new Map<string, { at: number; answer: Promise<boolean> }>();
  const ask = async (ip: string, port: number): Promise<boolean> => {
    let timer: NodeJS.Timeout | undefined;
    const late = new Promise<null>((done) => {
      timer = setTimeout(() => done(null), timeout);
      timer.unref();
    });
    try {
      const r = await Promise.race([run(["whois", "--json", isIP(ip) === 6 ? `[${ip}]:${port}` : `${ip}:${port}`]), late]);
      return r !== null && r.status === 0 && ownerOf(r.stdout, owner);
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };
  return (address, port) => {
    const ip = address.replace(/^::ffff:(?=\d+\.)/, "");
    if (isIP(ip) === 0) {
      return Promise.resolve(false);
    }
    const kept = cache.get(ip);
    if (kept !== undefined && now() - kept.at < ttl) {
      return kept.answer;
    }
    const answer = ask(ip, port);
    cache.set(ip, { at: now(), answer });
    return answer;
  };
}
