// What the lanes need besides GitHub and T3: the open requests (read through src/braids/requests.ts, never
// written here) and the broke alarms' clock: when each condition was first seen, kept in `.braid/broke.json`
// of the main checkout, so `braid status`, the board and a restart agree.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Github } from "./github.js";
import { doneDate, headOf, prefetchDoneDates } from "./done.js";
import { gitAsync } from "../braids/gitio.js";
import type { Braid } from "../braids/store.js";
import { BROKE_MS, type BrokeReason, type Signals } from "./model.js";
import { ensureStateDir, filterLive, loadRequests, mainCheckout, type PrNow, type Request } from "../braids/requests.js";

export interface ReadSignals extends Signals {
  /** Writes the first-seen times if they changed. */
  commit(): void;
  /** Reads the Done dates of the Done items of these braids in one batch, without blocking; `doneAt` then answers from them. */
  prepare?(braids: readonly Braid[]): Promise<void>;
}

/** What GitHub says of the PR with this number, in the shape the requests store compares; null when it isn't known. */
export function prOf(github: Github, number: number): PrNow {
  if (github.status.state !== "ok") {
    return null;
  }
  for (const pr of github.prs.values()) {
    if (pr.number === number && pr.head !== undefined) {
      return { state: pr.state, headRefOid: pr.head };
    }
  }
  return null;
}

/** The first-seen times of the broke conditions, in memory; `onChange` is told when they should be written. */
export function brokeClock(initial: Readonly<Record<string, string>>, now: Date): { alarm: Signals["alarm"]; seen: () => Record<string, string>; changed: () => boolean } {
  const seen: Record<string, string> = { ...initial };
  let dirty = false;
  const alarm = (id: string, reason: BrokeReason, holds: boolean | null): string | null => {
    const key = `${id} ${reason}`;
    if (holds === false) {
      if (key in seen) {
        delete seen[key];
        dirty = true;
      }
      return null;
    }
    if (holds === true && !(key in seen)) {
      seen[key] = now.toISOString();
      dirty = true;
    }
    const since = seen[key];
    // Unknown (null) neither starts nor stops the clock, and shows nothing.
    return holds === true && since !== undefined && now.getTime() - new Date(since).getTime() >= BROKE_MS ? since : null;
  };
  return { alarm, seen: () => seen, changed: () => dirty };
}

function brokeFile(root: string): string {
  return join(mainCheckout(root), ".braid", "broke.json");
}

function readBroke(file: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * The signals of a repository now. Anything that can't be read (not a Git checkout, a broken file) gives
 * fewer signals, not an error: no requests, and alarms that start from this read.
 */
export function readSignals(root: string, github: Github, now: Date = new Date()): ReadSignals {
  let requests: Request[] = [];
  let file: string | null = null;
  try {
    requests = filterLive(loadRequests(root), (n) => prOf(github, n));
    file = brokeFile(root);
  } catch {
    // not a repository: no requests, and no place to keep the alarms' clock
  }
  let head: string | undefined;
  const clock = brokeClock(file === null ? {} : readBroke(file), now);
  return {
    now,
    requests: new Map(requests.map((r) => [r.id, r])),
    alarm: clock.alarm,
    doneAt: (folder, source) => {
      head ??= headOf(root) ?? "";
      return doneDate(root, folder, source, undefined, head === "" ? null : head);
    },
    async prepare(braids) {
      if (head === undefined) {
        const r = await gitAsync(root, ["rev-parse", "--verify", "-q", "HEAD"]);
        head = r.status === 0 && /^[0-9a-f]{7,64}$/.test(r.stdout.trim()) ? r.stdout.trim() : "";
      }
      const done = braids.flatMap((b) => [b, ...b.strands]).filter((i) => i.brief.status === "Done");
      await prefetchDoneDates(root, done, head === "" ? null : head);
    },
    commit() {
      if (file === null || !clock.changed()) {
        return;
      }
      try {
        ensureStateDir(dirname(file));
        const tmp = `${file}.${process.pid}.tmp`;
        writeFileSync(tmp, `${JSON.stringify(clock.seen(), null, 2)}\n`);
        renameSync(tmp, file);
      } catch {
        // the alarms start again from the next read
      }
    },
  };
}
