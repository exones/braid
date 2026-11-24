// What the lanes need besides GitHub and T3: the open requests (read through src/braids/requests.ts from the local refs, never
// written here; the wake step writes them), the paused braids (src/braids/pauses.ts, read only) and the broke alarms' clock: when each condition was first seen, kept in `.braid/broke.json`
// of the main checkout, so `braid status`, the board and a restart agree.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Github } from "./github.js";
import { doneDate, headOf, prefetchDoneDates } from "./done.js";
import { gitAsync } from "../braids/gitio.js";
import type { Braid } from "../braids/store.js";
import { BROKE_MS, type Alarm, type BrokeReason, type NudgeTarget, type Signals } from "./model.js";
import { loadLifecycle, type Lifecycle } from "../braids/lifecycle.js";
import { askerOf, conditionEnding, ensureStateDir, loadRecord, mainCheckout, programmeOf, type PrNow, type Request } from "../braids/requests.js";
import { toBraid } from "./record.js";
import { loadPauses, type Pause } from "../braids/pauses.js";

export interface ReadSignals extends Signals {
  /** The stalls whose ten minutes ran out and that weren't nudged yet (the board's step nudges them), and those still stalled ten minutes after the nudge with a PM to tell. */
  readonly nudges?: { readonly due: () => readonly Nudge[]; readonly escalate: () => readonly Nudge[] };
  /** The step after a derivation: starts, keeps or drops the first-seen times for the conditions it saw (`alarms`), then writes them if they changed. */
  commit(alarms: readonly Alarm[]): void;
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

/**
 * A request whose "done when" holds now (its PR merged or closed, a review's head moved, its time reached), as
 * the running board will record it: met or withdrawn by the board. Others unchanged. A `braid:` condition
 * needs main, so it shows once the board has recorded it.
 */
export function ended(r: Request, now: Date, pr: (number: number) => PrNow): Request {
  const e = r.state === "open" ? conditionEnding(r, { pr, now }) : null;
  if (e === null) {
    return r;
  }
  return { ...r, state: e.state, events: [...r.events, { event: e.state, at: now.toISOString(), by: e.who, ...(e.text === undefined ? {} : { text: e.text }) }] };
}

/** A stall due a nudge or an escalation: its alarm id (the clock's key is `<id> stalled`) and where it goes. */
export type Nudge = NudgeTarget & { readonly id: string };

/** The clock's keys beside a stall's first-seen time: when it was nudged, and when the PM was told it went on. */
export const nudgedKey = (id: string): string => `${id} stalled nudged`;
export const escalatedKey = (id: string): string => `${id} stalled escalated`;

/**
 * The first-seen times of the broke conditions, in memory. `alarm` only reads them (what an alarm shows now); `settle` is the step after a
 * derivation: it starts, keeps or drops the times for the conditions the derivation saw, and notes the nudges and escalations now due.
 * `changed` says when the times should be written. A nudgeable stall also keeps its nudged and escalated times here.
 */
export function brokeClock(initial: Readonly<Record<string, string>>, now: Date): { alarm: Signals["alarm"]; settle: (alarms: readonly Alarm[]) => void; nudged: (id: string) => boolean; due: () => readonly Nudge[]; escalate: () => readonly Nudge[]; seen: () => Record<string, string>; changed: () => boolean } {
  const seen: Record<string, string> = { ...initial };
  const due: Nudge[] = [];
  const escalate: Nudge[] = [];
  let dirty = false;
  const ago = (iso: string): number => now.getTime() - new Date(iso).getTime();
  /** How far an alarm has come: not held ten minutes (off), a nudgeable stall waiting for its nudge (due) or for ten minutes after it (wait), or shown. */
  const stage = (id: string, reason: BrokeReason, holds: boolean | null, nudge?: NudgeTarget): "off" | "due" | "wait" | "shown" => {
    const since = seen[`${id} ${reason}`];
    if (holds !== true || since === undefined || ago(since) < BROKE_MS) {
      return "off";
    }
    const nudgedAt = reason === "stalled" ? seen[nudgedKey(id)] : undefined;
    return nudge === undefined || reason !== "stalled" ? "shown" : nudgedAt === undefined ? "due" : ago(nudgedAt) < BROKE_MS ? "wait" : "shown";
  };
  const alarm: Signals["alarm"] = (id, reason, holds, nudge) => (stage(id, reason, holds, nudge) === "shown" ? (seen[`${id} ${reason}`] ?? null) : null);
  const settle = (alarms: readonly Alarm[]): void => {
    for (const { id, reason, holds, nudge } of alarms) {
      const key = `${id} ${reason}`;
      if (holds === false) {
        for (const k of reason === "stalled" ? [key, nudgedKey(id), escalatedKey(id)] : [key]) {
          if (k in seen) {
            delete seen[k];
            dirty = true;
          }
        }
      } else if (holds === true && !(key in seen)) {
        seen[key] = now.toISOString();
        dirty = true;
      }
      const at = stage(id, reason, holds, nudge);
      if (at === "due") {
        due.push({ ...nudge as NudgeTarget, id });
      } else if (at === "shown" && nudge?.pm != null && !(escalatedKey(id) in seen)) {
        escalate.push({ ...nudge, id });
      }
    }
  };
  return { alarm, settle, nudged: (id) => nudgedKey(id) in seen, due: () => due, escalate: () => escalate, seen: () => seen, changed: () => dirty };
}

function brokeFile(root: string): string {
  return join(mainCheckout(root), ".braid", "broke.json");
}

/** The first-seen file's content, read now (a step re-reads it right before it sends); `null` when the repository has none to give. */
export function readBrokeNow(root: string): Record<string, string> {
  return readBroke(brokeFile(root));
}

/** Writes one key of the clock file at once, read-modify-write, so a nudge sent is remembered by every board of the project. */
export function writeBroke(root: string, key: string, value: string): void {
  const file = brokeFile(root);
  const next = { ...readBroke(file), [key]: value };
  ensureStateDir(dirname(file));
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}
`);
  renameSync(tmp, file);
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
  let waits: Request[] = [];
  let closed: Request[] = [];
  let file: string | null = null;
  let pauses: readonly Pause[] = [];
  let pausesNote: string | null = null;
  let lifecycle: ReadonlyMap<string, Lifecycle> = new Map();
  try {
    // A request whose PR just merged or closed, or whose time came, is closed for the board now; the board's wake step (src/board/wake.ts) records it.
    const record = loadRecord(root).requests.map((r) => ended(r, now, (n) => prOf(github, n)));
    closed = record.filter((r) => r.state !== "open");
    // A request to another braid's coordinator isn't the user's: no lane and no push (P6); the asking braid's card shows it.
    const open = record.filter((r) => r.state === "open");
    waits = open.filter(toBraid);
    requests = open.filter((r) => !toBraid(r));
    lifecycle = loadLifecycle(root);
    file = brokeFile(root);
    ({ pauses, note: pausesNote } = loadPauses(root));
  } catch {
    // not a repository: no requests, and no place to keep the alarms' clock
  }
  let head: string | undefined;
  const clock = brokeClock(file === null ? {} : readBroke(file), now);
  return {
    now,
    requests: new Map(requests.filter((r) => askerOf(r) === "coordinator" && programmeOf(r.id) === null).map((r) => [r.id, r])),
    asks: new Map(requests.filter((r) => askerOf(r) === "pm" && programmeOf(r.id) === null).map((r) => [r.id, r])),
    programmes: requests.filter((r) => programmeOf(r.id) !== null),
    waits,
    closed,
    pauses: new Map(pauses.map((p) => [p.braid, p])),
    pausesNote,
    lifecycle,
    alarm: clock.alarm,
    nudged: clock.nudged,
    nudges: { due: clock.due, escalate: clock.escalate },
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
    commit(alarms) {
      clock.settle(alarms);
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
