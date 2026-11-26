// The acting board (0074/B, docs/board.md "One acting board"): of the boards running on this machine, one acts per provider
// account (the limits pause and resume) and one per repository (wakes, reminders, nudges, the request record and the pending
// limit pushes); every other board reads and shows. Each key is a lease file in `~/.braid/acting/`:
//   - `provider-<instanceId>.json`, `repo-<hash of the main checkout's path>.json`;
//   - it holds the board's pid, port, start time and a heartbeat the holder renews at each tick;
//   - another board takes it over only when the heartbeat is older than `staleMs` (three refreshes) or the pid is gone;
//   - every change happens under the file's lock (src/braids/state.ts `locked`), so two boards started together can't both win;
//   - a board that stops removes its leases.
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { braidHome } from "../notify/config.js";
import { locked } from "../braids/state.js";
import { mainCheckoutOf } from "../braids/worktrees.js";

/** One lease file. */
export interface Lease {
  /** The key: `provider-<instanceId>` or `repo-<hash>`. */
  readonly key: string;
  /** What the key is about, for people: the provider id or the repository's main checkout. */
  readonly label: string;
  /** The holding board: a random id per run (two boards in one process stay apart), its pid and port. */
  readonly board: string;
  readonly pid: number;
  readonly port: number | null;
  readonly started: string;
  /** Renewed at each tick of the holder (ISO). */
  readonly heartbeat: string;
}

/** The lease key of a provider account. */
export const providerKey = (instanceId: string): string => `provider-${instanceId.replace(/[^A-Za-z0-9._-]+/g, "_")}`;

/** The lease key of a repository, from its main checkout's path (case-folded on Windows, where paths are). */
export function repoKey(mainCheckout: string): string {
  const path = resolve(mainCheckout).replace(/[\\/]+$/, "");
  return `repo-${createHash("sha256").update(process.platform === "win32" ? path.toLowerCase() : path).digest("hex").slice(0, 16)}`;
}

/** A lease whose heartbeat is older than this is taken over: three of the board's 30 s refreshes. */
export const ACTING_STALE_MS = 3 * 30_000;

/** The folder of the lease files. */
export const actingDir = (home: string = braidHome()): string => join(home, "acting");

/** Whether a process with this pid runs (EPERM: it runs as someone else). */
export function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

const leaseOf = (v: unknown): Lease | null => {
  const o = typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
  return o !== null && typeof o["key"] === "string" && typeof o["board"] === "string" && typeof o["pid"] === "number" && typeof o["heartbeat"] === "string"
    ? { key: o["key"], label: typeof o["label"] === "string" ? o["label"] : o["key"], board: o["board"], pid: o["pid"], port: typeof o["port"] === "number" ? o["port"] : null, started: typeof o["started"] === "string" ? o["started"] : o["heartbeat"], heartbeat: o["heartbeat"] }
    : null;
};

function readLease(file: string): Lease | null {
  try {
    return leaseOf(JSON.parse(readFileSync(file, "utf8")));
  } catch {
    return null;
  }
}

/** Every lease file in the folder (unreadable ones left out). */
export function readLeases(home: string = braidHome()): Lease[] {
  try {
    return readdirSync(actingDir(home))
      .filter((f) => f.endsWith(".json"))
      .flatMap((f) => {
        const l = readLease(join(actingDir(home), f));
        return l === null ? [] : [l];
      });
  } catch {
    return [];
  }
}

/** Whether a lease still binds: its heartbeat is fresh and its board's process runs. */
export function live(lease: Lease | null, now: Date, staleMs: number, alive: (pid: number) => boolean = pidAlive): lease is Lease {
  return lease !== null && now.getTime() - Date.parse(lease.heartbeat) < staleMs && alive(lease.pid);
}

/** Who acts for a key, as the page and `braid board service status` say it: "acting", or "watching: the board on port <p> (pid <n>) acts". */
export function holderText(lease: Lease): string {
  return `the board on ${lease.port === null ? "an unknown port" : `port ${lease.port}`} (pid ${lease.pid}) acts`;
}

/**
 * `braid board service status`'s lines on the acting leases: what the board on `port` acts for, and per key another board holds,
 * "Watching: the board on port <p> (pid <n>) acts for <what>". None when no board holds a lease.
 */
export function actingLines(port: number, home: string, now: Date, staleMs: number, alive: (pid: number) => boolean = pidAlive): string[] {
  const leases = readLeases(home).filter((l) => live(l, now, staleMs, alive));
  const what = (l: Lease): string => (l.key.startsWith("repo-") ? `the wakes of ${l.label}` : `the pause of ${l.label}`);
  const mine = leases.filter((l) => l.port === port);
  const others = leases.filter((l) => l.port !== port);
  return [...(mine.length === 0 ? [] : [`Acting: for ${mine.map(what).join(", ")}`]), ...others.map((l) => `Watching: ${holderText(l)} for ${what(l)}`)];
}

/** One key as a board sees it. */
export interface ActingLine {
  readonly key: string;
  readonly label: string;
  /** "acting": this board acts; "watching": another board does (`by` says which); "free": none holds it yet. */
  readonly state: "acting" | "watching" | "free";
  readonly by: string | null;
}

export interface ActingOptions {
  readonly home?: string;
  /** A lease older than this is taken over: three refreshes. */
  readonly staleMs: number;
  readonly now?: () => Date;
  /** This board's port, once it listens. */
  readonly port?: () => number | null;
  readonly pid?: number;
  readonly alive?: (pid: number) => boolean;
}

export interface ActingBoard {
  /** This run's id. */
  readonly id: string;
  /** Takes or renews the lease of `key`; true when this board holds it now. Never throws: a lease that can't be read or written is not held. */
  hold(key: string, label: string): boolean;
  /** Where each key stands for this board, read from the files (no write). */
  lines(keys: readonly { readonly key: string; readonly label: string }[]): ActingLine[];
  /** Removes every lease this board holds. */
  release(): void;
}

export function actingBoard(opts: ActingOptions): ActingBoard {
  const dir = actingDir(opts.home);
  const now = opts.now ?? (() => new Date());
  const alive = opts.alive ?? pidAlive;
  const pid = opts.pid ?? process.pid;
  const id = randomUUID();
  const started = now().toISOString();
  const held = new Set<string>();
  const fileOf = (key: string): string => join(dir, `${key}.json`);
  const write = (file: string, lease: Lease): void => {
    const tmp = `${file}.${id}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(lease, null, 2)}\n`);
    renameSync(tmp, file);
  };
  return {
    id,
    hold(key, label) {
      try {
        const file = fileOf(key);
        const won = locked(
          file,
          () => {
            const at = now();
            const current = readLease(file);
            if (current !== null && current.board !== id && live(current, at, opts.staleMs, alive)) {
              return false;
            }
            write(file, { key, label, board: id, pid, port: opts.port?.() ?? null, started, heartbeat: at.toISOString() });
            return true;
          },
          "the acting lease",
          (d) => mkdirSync(d, { recursive: true }),
          2_000,
        );
        if (won) {
          held.add(key);
        } else {
          held.delete(key);
        }
        return won;
      } catch {
        held.delete(key);
        return false;
      }
    },
    lines(keys) {
      const at = now();
      return keys.map(({ key, label }) => {
        const lease = readLease(fileOf(key));
        if (lease !== null && lease.board === id) {
          return { key, label, state: "acting", by: null };
        }
        return live(lease, at, opts.staleMs, alive) ? { key, label, state: "watching", by: holderText(lease) } : { key, label, state: "free", by: null };
      });
    },
    release() {
      for (const key of held) {
        try {
          const file = fileOf(key);
          locked(
            file,
            () => {
              if (readLease(file)?.board === id) {
                unlinkSync(file);
              }
            },
            "the acting lease",
            (d) => mkdirSync(d, { recursive: true }),
            2_000,
          );
        } catch {
          // the next board takes it over once it is stale
        }
      }
      held.clear();
    },
  };
}

const repoLeases = new Map<string, { key: string; label: string }>();
/** The lease of a repository folder (a worktree reads as its main checkout), read once per folder. */
export function repoLease(root: string): { key: string; label: string } {
  let known = repoLeases.get(root);
  if (known === undefined) {
    const main = mainCheckoutOf(root) ?? resolve(root);
    known = { key: repoKey(main), label: main };
    repoLeases.set(root, known);
  }
  return known;
}
