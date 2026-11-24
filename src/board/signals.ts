// What the lanes need besides GitHub and T3: the open requests (read through src/braids/requests.ts from the local refs, never
// written here; the wake step writes them), the paused braids (src/braids/pauses.ts, read only) and the broke alarms' clock: when each condition was first seen, kept in `.braid/broke.json`
// of the main checkout, so `braid status`, the board and a restart agree.
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Github } from "./github.js";
import { doneDate, headOf, prefetchDoneDates } from "./done.js";
import { gitAsync } from "../braids/gitio.js";
import type { Braid } from "../braids/store.js";
import { BROKE_MS, type BrokeReason, type NudgeTarget, type Signals } from "./model.js";
import { askerOf, conditionEnding, ensureStateDir, loadRecord, mainCheckout, programmeOf, type PrNow, type Request } from "../braids/requests.js";
import { toBraid } from "./record.js";
import { loadPauses, type Pause } from "../braids/pauses.js";

export interface ReadSignals extends Signals {
  /** The stalls whose ten minutes ran out and that weren't nudged yet (the board's step nudges them), and those still stalled ten minutes after the nudge with a PM to tell. */
  readonly nudges?: { readonly due: () => readonly Nudge[]; readonly escalate: () => readonly Nudge[] };
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

/** The first-seen times of the broke conditions, in memory; `changed` says when they should be written. A nudgeable stall also keeps its nudged and escalated times here. */
export function brokeClock(initial: Readonly<Record<string, string>>, now: Date): { alarm: Signals["alarm"]; nudged: (id: string) => boolean; due: () => readonly Nudge[]; escalate: () => readonly Nudge[]; seen: () => Record<string, string>; changed: () => boolean } {
  const seen: Record<string, string> = { ...initial };
  const due: Nudge[] = [];
  const escalate: Nudge[] = [];
  let dirty = false;
  const alarm = (id: string, reason: BrokeReason, holds: boolean | null, nudge?: NudgeTarget): string | null => {
    const key = `${id} ${reason}`;
    if (holds === false) {
      for (const k of reason === "stalled" ? [key, nudgedKey(id), escalatedKey(id)] : [key]) {
        if (k in seen) {
          delete seen[k];
          dirty = true;
        }
      }
      return null;
    }
    if (holds === true && !(key in seen)) {
      seen[key] = now.toISOString();
      dirty = true;
    }
    const since = seen[key];
    // Unknown (null) neither starts nor stops the clock, and shows nothing.
    if (!(holds === true && since !== undefined && now.getTime() - new Date(since).getTime() >= BROKE_MS)) {
      return null;
    }
    const nudgedAt = reason === "stalled" ? seen[nudgedKey(id)] : undefined;
    if (nudge === undefined || reason !== "stalled") {
      return since;
    }
    // A stall that can be nudged shows nothing until it was nudged and still holds ten minutes after.
    if (nudgedAt === undefined) {
      due.push({ ...nudge, id });
      return null;
    }
    if (now.getTime() - new Date(nudgedAt).getTime() < BROKE_MS) {
      return null;
    }
    if (nudge.pm !== null && !(escalatedKey(id) in seen)) {
      escalate.push({ ...nudge, id });
    }
    return since;
  };
  return { alarm, nudged: (id) => nudgedKey(id) in seen, due: () => due, escalate: () => escalate, seen: () => seen, changed: () => dirty };
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
  try {
    // A request whose PR just merged or closed, or whose time came, is closed for the board now; the board's wake step (src/board/wake.ts) records it.
    const record = loadRecord(root).requests.map((r) => ended(r, now, (n) => prOf(github, n)));
    closed = record.filter((r) => r.state !== "open");
    // A request to another braid's coordinator isn't the user's: no lane and no push (P6); the asking braid's card shows it. A timed wait (`to: self`) likewise.
    const open = record.filter((r) => r.state === "open");
    waits = open.filter(toBraid);
    requests = open.filter((r) => !toBraid(r));
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
