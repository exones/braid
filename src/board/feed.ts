// One project's snapshot cycle (docs/board.md, "Refresh" and "Several projects"): reads one at a time off the
// request path, at most one more queued, each whole read bounded by a timeout. A project keeps its last good
// snapshot, when it was read and what failed in the latest read, so a slow or broken project holds up no other.
import type { Braid } from "../braids/store.js";
import type { Sources } from "../commands/board.js";
import type { Github } from "./github.js";
import { toBoard, type BoardData, type StartContext } from "./model.js";
import type { ReadSignals } from "./signals.js";
import type { T3 } from "./t3.js";
import { heldPauses } from "./programme.js";

/** How long one project's whole read (GitHub, T3, braids, signals, inbox) may take before it counts as failed. */
export const READ_TIMEOUT_MS = 60_000;

/** Everything one complete read produced; the pages are answered from the latest good one. */
export interface Good {
  readonly braids: Braid[];
  readonly github: Github;
  readonly t3: T3;
  readonly sig: ReadSignals;
  readonly start: StartContext;
  readonly board: BoardData;
}

export type Snapshot = ({ readonly ok: true } & Good) | { readonly ok: false; readonly error: unknown };

/** Reads every source of one project once. Every source call it starts settles before it returns. */
export async function readSnapshot(src: Sources, fetch: boolean): Promise<Snapshot> {
  const marks: string[] = [];
  const timed = async <T>(name: string, read: () => T | Promise<T>): Promise<T> => {
    const began = performance.now();
    try {
      return await read();
    } finally {
      marks.push(`${name} ${Math.round(performance.now() - began)} ms`);
    }
  };
  // Every source call this read starts settles before it ends, so the next read never overlaps a `gh` or `t3` still running.
  const github = timed("github", () => src.github(true));
  const t3 = timed("t3", () => src.t3(true));
  // A fresh read fetches the requests record too, alongside GitHub and T3; a failed fetch leaves the local copy.
  const requests = fetch && src.fetchRequests !== undefined ? timed("requests fetch", () => src.fetchRequests?.()).catch(() => {}) : Promise.resolve();
  github.catch(() => {}); // their failure is reported when they are awaited below
  t3.catch(() => {});
  try {
    const [gh, threads] = [await github, await t3];
    // Briefs the loader can't read (a malformed brief.md, a bad folder name) are readiness problems, and the board is served without them.
    const braids = await timed("braids", async () => {
      try {
        return await src.braids();
      } catch (error) {
        if (src.readiness?.(gh).some((p) => p.key === "check") === true) {
          return [];
        }
        throw error;
      }
    });
    const plans = await timed("plans", async () => {
      try {
        return (await src.plans?.()) ?? [];
      } catch {
        return []; // the programmes are left out, never the board
      }
    });
    await requests;
    const read = await timed("signals", () => src.signals(gh));
    // A held plan holds its braids too: those without a pause record of their own read as held by the PM.
    const sig: ReadSignals = plans.length === 0 ? read : { ...read, plans, pauses: heldPauses(plans, read.pauses ?? new Map(), read.now) };
    await timed("done dates", () => sig.prepare?.(braids));
    const inbox = await timed("inbox", () => src.inbox(fetch));
    const start = src.start();
    const board = await timed("board", () => {
      const limits = src.limits?.(threads, sig.pauses ?? new Map()) ?? null;
      const b = toBoard(src.repo, braids, gh, threads, sig, start, inbox, src.readiness?.(gh) ?? [], limits);
      sig.commit();
      return b;
    });
    return { ok: true, braids, github: gh, t3: threads, sig, start, board };
  } catch (error) {
    return { ok: false, error };
  } finally {
    await Promise.allSettled([github, t3, requests]);
    if (process.env["BRAID_BOARD_TIMINGS"] === "1") {
      process.stderr.write(`board read${src.repo === "" ? "" : ` (${src.repo})`}: ${marks.join(", ")}\n`);
    }
  }
}

export interface FeedOptions {
  /** The whole-read timeout; READ_TIMEOUT_MS unless given. */
  readonly timeoutMs?: number;
  /** Called after each read that stored something (a good snapshot or a failure). */
  readonly changed: () => void;
}

export interface Feed {
  readonly src: Sources;
  /** The latest good read, or undefined when none succeeded yet. */
  good(): Good | undefined;
  /** When the latest good read finished (ms since the epoch); null for none. */
  readAt(): number | null;
  /** Why the latest read failed (the snapshot shown is then older); null when it succeeded or none finished. */
  failure(): string | null;
  /** The error of the latest read when it failed and there is no good snapshot to show instead. */
  error(): unknown;
  /** Reads again: at once when idle, else once after the read that runs. Resolves when that read is done. */
  refresh(fetch?: boolean): Promise<void>;
  /** Resolves once there is something to answer with: after a fresh read when `fresh`, else after the first read; never later than the timeout. */
  ready(fresh: boolean): Promise<void>;
  /** Resolves once no read runs and none is queued (a read that timed out still runs until it ends, because its children do). */
  idle(): Promise<void>;
  /** Stops: a read still running stores nothing and sends no pushes. */
  close(): void;
}

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export function feed(src: Sources, options: FeedOptions): Feed {
  const timeoutMs = options.timeoutMs ?? READ_TIMEOUT_MS;
  let good: Good | undefined;
  let readAt: number | null = null;
  let failure: string | null = null;
  let error: unknown;
  // A stored last-good read (`src.seed`) is taken first; real reads queue behind it.
  let running: Promise<void> | undefined =
    src.seed === undefined
      ? undefined
      : readSnapshot(src.seed, false).then((snap) => {
          running = undefined;
          if (snap.ok && !closed) {
            good = snap;
            readAt = Date.now();
          }
        });
  let firstDone = false;
  let queued: { fetch: boolean; done: Promise<void> } | undefined;
  let closed = false;
  const wait = (ms: number): Promise<void> =>
    new Promise((done) => {
      setTimeout(done, ms).unref();
    });
  const begin = (fetch: boolean): Promise<void> => {
    let late = false;
    const timer = setTimeout(() => {
      late = true;
      if (!closed) {
        failure = `the read took longer than ${Math.round(timeoutMs / 1000)} s`;
        error = new Error(`${src.repo}: ${failure}`);
        options.changed();
      }
    }, timeoutMs);
    timer.unref();
    const read = readSnapshot(src, fetch).then((snap) => {
      clearTimeout(timer);
      running = undefined;
      // A read that timed out counts as failed: its late result is dropped, so it can't send pushes on its own.
      if (closed || late) {
        return;
      }
      if (snap.ok) {
        good = snap;
        readAt = Date.now();
        failure = null;
        error = undefined;
        try {
          src.notify?.(snap.board);
        } catch {
          // Notifications never stop the board.
        }
        try {
          src.act?.(snap);
        } catch {
          // The limits pause never stops the board.
        }
      } else {
        failure = message(snap.error);
        error = snap.error;
      }
      options.changed();
    });
    running = read;
    return read;
  };
  const refresh = (fetch = false): Promise<void> => {
    if (running === undefined) {
      return begin(fetch);
    }
    if (queued === undefined) {
      const next = { fetch, done: Promise.resolve() };
      next.done = running.then(() => {
        queued = undefined;
        return closed ? undefined : begin(next.fetch);
      });
      queued = next;
    } else if (fetch) {
      queued.fetch = true;
    }
    return queued.done;
  };
  const first = refresh().then(() => {
    firstDone = true;
  });
  return {
    src,
    good: () => good,
    readAt: () => readAt,
    failure: () => failure,
    error: () => (good === undefined ? (error ?? new Error(`${src.repo}: not read yet`)) : undefined),
    refresh,
    ready: (fresh) => Promise.race([fresh ? refresh(true) : firstDone || failure !== null ? Promise.resolve() : first, wait(timeoutMs)]),
    idle: async () => {
      while (running !== undefined || queued !== undefined) {
        await (queued?.done ?? running);
      }
    },
    close: () => {
      closed = true;
    },
  };
}
