// The board's pause for provider limits (0064, 0074/C, docs/board.md "Provider limits"): the one exception to the board's click-only
// rule. Every served project's feed hands its good snapshot to one board-wide steerer, which runs a tick at a time:
//   0. done (0074/H): a board record of a braid that is Done (as the board reads it) is cleared, with no send;
//   1. count: for 10 minutes after a pause's sends, read each target's thread for its `Paused:` line, then settle the record;
//   2. resume (0074/D, src/board/resume.ts): a record whose resume time has passed is re-checked; one whose fresh reading is under
//      the threshold (or no longer has its window) resumes early; one asked for (Resume now) or pending (a failed send) is tried
//      again. A braid without a PM: each thread its resume text by code; a PM-run braid: one message to the PM;
//   3. pause: per provider over its threshold, claim a record per braid with a working agent under the lock, then send each target
//      its text by code (`t3 thread send`, ids from T3's own output) and each PM one summary;
//   4. wake: each project's open requests whose "done when" holds are closed and their askers woken (src/board/wake.ts).
// Signed in to T3 (0080/E, src/board/stop.ts), step 3 and the hold step (a hold record the board hasn't acted on: its texts, counted
// as a pause's) first stop the braid's working top-level threads with `stop: true`, and for 10 minutes after a stop the card shows the
// threads still working (one push at 2 minutes): one live-only MCP list per tick, one interrupt per working top-level thread.
// No LLM sits in the path and no thread is started (0074/C). With several boards on one machine, a tick acts only for the keys whose
// lease this board holds (src/board/acting.ts, 0074/B): steps 1-3 and the blind push per provider account, step 4 and the pending limit pushes per
// repository. A board that holds none still reads and shows. Only `.braid/pauses.json`, `notified.json` and (the wake)
// `braid-requests` are written, and only `t3 thread send` and `t3 thread show` are called.
import { join } from "node:path";
import { percent } from "../braids/percent.js";
import { providerKey, repoLease, type ActingBoard } from "./acting.js";
import { LimitsError, readLimits, readModelLines, readProvider, t3Home, type ModelLine, type ProviderReading } from "../braids/limits.js";
import { byBoard, claimPauses, clearPause, loadPauses, patchPauses, reasonOf, resumedAt, type NoAnswer, type Pause, type Replies, type Stop } from "../braids/pauses.js";
import type { McpClient } from "../t3mcp/client.js";
import { failureOf } from "./failure.js";
import type { Good } from "./feed.js";
import { blindReason } from "./limits-view.js";
import { clock } from "./pause.js";
import { resumePauses } from "./resume.js";
import { blindPush, coordinatorPause, escalation, heldLine, HOLD_HEAD, holdText, limitPush, overWindow, pausedLine, pmsOf, pmSummary, targetsOf, weeklyPause, workerPause, type LimitEvent, type LimitPush, type PmThread } from "./steer.js";
import { STILL_PUSH_MS, stillPush, stillWorking, stopTargets, tickMcp, type TickMcp } from "./stop.js";
import { working, type T3Runner } from "./t3.js";
import type { Waker } from "./wake.js";

/** How long the board counts the replies after its sends; a target without its `Paused:` line by then is no answer. */
export const COUNT_MS = 10 * 60_000;
/** A resume this late is reported as missed ("was due …"): no board ran at the time. */
export const MISSED_MS = 5 * 60_000;
/** A pause text is sent at most this many times to one thread in one refresh; failing them all is a failed send (0074/C). */
export const PAUSE_TRIES = 2;

/** One served project as the steerer sees it. */
export interface SteerProject {
  readonly name: string;
  /** The repository folder (`.braid/` and BRAID.md are read from its main checkout). */
  readonly root: string;
  /** The repository name for titles. */
  readonly repo: string;
  /** T3's project folder (the main checkout). */
  readonly folder: () => string;
}

export interface SteererOptions {
  readonly t3: T3Runner;
  readonly now?: () => Date;
  /** T3's caches folder; `$T3CODE_HOME/caches` unless given. */
  readonly caches?: string;
  /** Sends a limit push once per key, through a project's `notified.json`; absent: none. */
  readonly push?: (root: string, push: LimitPush) => void;
  /** Sends again the limit pushes of a project (its `notified.json`'s pending) whose send failed; called at the start of each tick for each project this board acts for. */
  readonly retry?: (root: string) => void;
  /** Where the steerer reports what it couldn't do: the board's standard error. */
  readonly warn?: (line: string) => void;
  /** The wake step, run for each project after the pause steps; absent: nothing is woken. */
  readonly wake?: Waker;
  /** The leases of this board (0074/B); absent: it acts for every key (a single board, tests). */
  readonly acting?: ActingBoard;
  /**
   * The T3 sign-in's MCP client (0080/E), asked once per tick: while it gives one, the pause and the hold stop the braid's working
   * threads before their texts. Absent or null: today's CLI path only, and a hold stays a record.
   */
  readonly mcp?: () => McpClient | null;
  /** The board's shared live thread list (0080/F); absent: the tick lists the live threads itself. */
  readonly live?: () => Promise<readonly Record<string, unknown>[]>;
}

export interface Steerer {
  /** Hands a project's good snapshot over and queues a tick; returns at once. */
  observe(project: SteerProject, good: Good): void;
  /** Queues a tick on the snapshots it has (the Resume now button: a resume asked for goes out now, not at the next refresh). */
  poke(): void;
  /** Resolves when no tick runs or is queued. */
  idle(): Promise<void>;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json | null => (typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Json) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v !== "" ? v : null);
const jsonOf = (text: string): Json | null => {
  try {
    return obj(JSON.parse(text));
  } catch {
    return null;
  }
};
const firstLine = (r: { stderr: string; error?: Error | undefined }): string => (r.stderr.trim().split("\n")[0] ?? "") || r.error?.message || "t3 failed";

interface Seen {
  readonly project: SteerProject;
  readonly good: Good;
}

/** A record and the project whose `pauses.json` holds it. */
interface Held {
  readonly at: Seen;
  readonly pause: Pause;
}

/**
 * Why a board pause resumes before its resume time (0074/D), from a reading checked after the pause began: `gone` when its window is no
 * longer in the reading (gone from the cache, or no longer applying to the provider's models), `early` when it is under its threshold
 * and nothing else is over. Null otherwise (no fresh reading, still over, or the provider over on another window).
 */
export function earlyWhy(p: Pause, reading: ProviderReading | null): "early" | "gone" | null {
  if (reading === null || reading.checkedAt === null || reading.verdict === "unknown" || Date.parse(reading.checkedAt) <= Date.parse(p.at) || p.window === null) {
    return null;
  }
  const w = reading.windows.find((x) => x.id === p.window);
  if (w === undefined) {
    return reading.verdict === "pause" ? null : "gone";
  }
  return reading.verdict === "ok" && !w.over ? "early" : null;
}

export function steerer(opts: SteererOptions): Steerer {
  const now = opts.now ?? (() => new Date());
  const caches = opts.caches ?? join(t3Home(), "caches");
  const warned = new Set<string>();
  const warn = (line: string, once = line): void => {
    if (!warned.has(once)) {
      warned.add(once);
      (opts.warn ?? ((l: string) => void process.stderr.write(`${l}\n`)))(`braid board: ${line}`);
    }
  };
  const push = (root: string, event: LimitEvent, records: readonly Pause[], at: Date, extra: Parameters<typeof limitPush>[3] = {}): void => {
    const p = limitPush(event, records, at, extra);
    if (p !== null && opts.push !== undefined) {
      try {
        opts.push(root, p);
      } catch {
        // a push never stops the pause
      }
    }
  };
  const latest = new Map<string, Seen>();
  let running: Promise<void> = Promise.resolve();
  let pending = false;

  const linesOf = (root: string): { lines: ModelLine[]; limits: ReturnType<typeof readLimits> } | null => {
    try {
      return { lines: readModelLines(root), limits: readLimits(root) };
    } catch (error) {
      if (error instanceof LimitsError) {
        return null;
      }
      throw error;
    }
  };
  const readingOf = (root: string, provider: string, at: Date): ProviderReading | null => {
    const read = linesOf(root);
    return read === null ? null : readProvider(caches, provider, read.lines.filter((l) => l.instanceId === provider), read.limits, at);
  };
  const boardRecords = (seen: readonly Seen[]): Held[] => seen.flatMap((s) => loadPauses(s.project.root).pauses.filter((p) => p.by === "board").map((pause) => ({ at: s, pause })));
  /** The holds (0080/E): the board adds its targets, replies and stop to them, as to its own records. */
  const isHold = (p: Pause): boolean => reasonOf(p) === "hold";
  const kindOf = (p: Pause): ((q: Pause) => boolean) => (isHold(p) ? isHold : byBoard);
  /** Applies `change` to these records (the board's, or holds), each in its own project's file. */
  const patch = (held: readonly Held[], change: (p: Pause) => Pause): Pause[] => {
    const byRoot = new Map<string, { root: string; braids: string[]; hold: boolean }>();
    for (const h of held) {
      const key = `${h.at.project.root}\n${isHold(h.pause) ? "hold" : "board"}`;
      const e = byRoot.get(key) ?? { root: h.at.project.root, braids: [], hold: isHold(h.pause) };
      e.braids.push(h.pause.braid);
      byRoot.set(key, e);
    }
    return [...byRoot.values()].flatMap((e) => patchPauses(e.root, e.braids, change, e.hold ? isHold : byBoard));
  };
  /** The record as the file holds it now. */
  const fresh = (h: Held): Held => ({ at: h.at, pause: loadPauses(h.at.project.root).pauses.find((p) => p.braid === h.pause.braid && kindOf(h.pause)(p)) ?? h.pause });

  /** Sends `text` to a thread by code (on standard input: no shell quoting), up to PAUSE_TRIES times; whether it went through. */
  const send = async (root: string, thread: string, text: string): Promise<boolean> => {
    for (let i = 0; i < PAUSE_TRIES; i++) {
      try {
        const r = await opts.t3(root, ["thread", "send", thread, "-"], text);
        if (r.error === undefined && r.status === 0) {
          return true;
        }
        warn(`a pause send to ${thread.slice(0, 8)} failed (${firstLine(r)})`, `pause send ${thread} ${i}`);
      } catch (error) {
        warn(`a pause send to ${thread.slice(0, 8)} failed (${error instanceof Error ? error.message : String(error)})`, `pause send ${thread} ${i}`);
      }
    }
    return false;
  };

  /** One target's thread as the count reads it: answered (stopped, with its `Paused:` line after the board's text), still working, stopped without the line, or unread. */
  const replyOf = async (root: string, thread: string): Promise<NoAnswer["why"] | "answered"> => {
    const shown = await opts.t3(root, ["thread", "show", thread, "--messages", "10", "--json"]);
    const out = shown.error === undefined && shown.status === 0 ? jsonOf(shown.stdout) : null;
    if (out === null) {
      return "unread";
    }
    const t = obj(out["thread"]) ?? {};
    if (working(t)) {
      return "working";
    }
    // The limit clash (0080/E): a thread whose last run failed on a usage limit counts as paused; only the resume reaches it.
    if (failureOf(str(out["error"]), { status: str(t["status"]) })?.kind === "limit") {
      return "answered";
    }
    const messages = (Array.isArray(out["messages"]) ? (out["messages"] as unknown[]) : []).map(obj).filter((m): m is Json => m !== null);
    // Only what came after the board's text counts: an older `Paused:` line (an earlier pause) is no answer to this one.
    const sentAt = messages.findLastIndex((m) => m["role"] === "user" && new RegExp(`^\\s*(?:Pause for |${HOLD_HEAD})`).test(str(m["text"]) ?? ""));
    const last = messages.slice(sentAt + 1).filter((m) => m["role"] !== "user").at(-1);
    const text = str(last?.["text"]) ?? "";
    return last !== undefined && (pausedLine(text) || heldLine(text)) ? "answered" : "no line";
  };

  /** A record's replies once counted: who answered, and why the others didn't. */
  const outcomeOf = (p: Pause, r: Replies, why: Map<string, NoAnswer["why"]>, reason: string | null): Replies => {
    const counted = (p.targets ?? []).filter((x) => x.kind !== "pm");
    const noAnswer = counted.filter((x) => !r.got.includes(x.thread)).map((x): NoAnswer => ({ item: x.item, thread: x.thread, link: x.link ?? null, why: r.failed.includes(x.thread) ? "send failed" : (why.get(x.thread) ?? "working") }));
    const outcome: Replies["outcome"] = noAnswer.length === 0 ? "paused" : r.got.length === 0 && r.failed.length === counted.length ? "failed" : "partial";
    return { ...r, outcome, answered: counted.length - noAnswer.length, total: counted.length, noAnswer, reason: outcome === "failed" ? (reason ?? "every send failed") : null };
  };

  /** Settles holds: their replies only. The card shows them; the still-working push (2 minutes after the stop) is a hold's alarm. */
  const settleHolds = (held: readonly Held[], why: Map<string, NoAnswer["why"]>, reason: string | null): void => {
    patch(held, (p) => (p.replies === undefined || p.replies.outcome !== "pausing" ? p : { ...p, replies: outcomeOf(p, p.replies, why, reason) }));
  };

  /** Settles these records (one pause of one provider): the push, and for a partial or failed one the PM's (else the coordinator's) message. */
  const settle = async (held: readonly Held[], at: Date, why: Map<string, NoAnswer["why"]>, reason: string | null): Promise<void> => {
    const moved = new Set<string>();
    const done = held.flatMap((h) =>
      patch([h], (p) => {
        const r = p.replies;
        if (r === undefined || r.outcome !== "pausing") {
          return p; // settled already (another tick): nothing twice
        }
        moved.add(p.braid);
        return { ...p, replies: outcomeOf(p, r, why, reason) };
      }),
    );
    const settled = done.filter((p) => moved.has(p.braid));
    if (settled.length === 0) {
      return;
    }
    const host = held[0]?.at.project.root ?? "";
    const bad = settled.filter((p) => p.replies?.outcome !== "paused");
    push(host, bad.length === 0 ? "paused" : "failed", bad.length === 0 ? settled : bad, at);
    // The safety net: one message per PM thread (a braid without a PM: its coordinator) with the braids that didn't pause fully.
    const to = new Map<string, { root: string; braids: string[]; records: Pause[] }>();
    for (const p of bad) {
      const h = held.find((x) => x.pause.braid === p.braid);
      const pms = (p.targets ?? []).filter((x) => x.kind === "pm");
      const coordinator = (p.targets ?? []).find((x) => x.kind === "coordinator");
      for (const x of pms.length > 0 ? pms : coordinator === undefined ? [] : [coordinator]) {
        const e = to.get(x.thread) ?? { root: h?.at.project.root ?? host, braids: [], records: [] };
        e.braids.push(p.braid);
        e.records.push(p);
        to.set(x.thread, e);
      }
    }
    for (const [thread, e] of to) {
      const all = e.records.flatMap((p) => (p.replies === undefined ? [] : [p.replies]));
      const merged: Replies | undefined = all.reduce<Replies | undefined>((a, r) => (a === undefined ? r : { ...a, outcome: a.outcome === "failed" && r.outcome === "failed" ? "failed" : "partial", answered: a.answered + r.answered, total: a.total + r.total, noAnswer: [...a.noAnswer, ...r.noAnswer] }), undefined);
      if (merged !== undefined && !(await send(e.root, thread, escalation(e.braids, e.records[0]?.provider ?? "", merged)))) {
        warn(`the pause's escalation to ${thread.slice(0, 8)} could not be sent`, `escalate ${thread} ${at.toISOString()}`);
      }
    }
  };

  /** The holds of the repositories this board acts for. */
  const holdRecords = (seen: readonly Seen[], repos: ReadonlySet<string>): Held[] =>
    seen.filter((s) => repos.has(s.project.root)).flatMap((s) => loadPauses(s.project.root).pauses.filter(isHold).map((pause) => ({ at: s, pause })));

  /** Done as the board reads it (a merged PR too), not only a stored Done. */
  const isDone = (s: Seen, b: Good["braids"][number]): boolean => b.brief.status === "Done" || s.good.board.braids.find((c) => c.id === b.number)?.status === "Done";

  /** 0. A Done braid has nothing left to pause or resume (0074/H): its board record goes, with no send, so no PM is asked to resume it. */
  const clearDone = (seen: readonly Seen[], acts: (provider: string | null) => boolean): void => {
    for (const s of seen) {
      const done = new Set(s.good.braids.filter((b) => isDone(s, b)).map((b) => b.number));
      for (const p of loadPauses(s.project.root).pauses.filter((x) => done.has(x.braid) && x.by === "board" && acts(x.provider))) {
        clearPause(s.project.root, p.braid, (q) => q.by === "board" && reasonOf(q) === "limit");
      }
    }
  };

  /** 1. Pauses still counting: read each target that hasn't answered; settle when all answered or failed, or at 10 minutes. */
  const count = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean, repos: ReadonlySet<string>): Promise<void> => {
    const groups = new Map<string, Held[]>();
    // The board's limit records under the provider's lease, and holds the board stopped (0080/E) under the repository's.
    for (const h of [...boardRecords(seen).filter((x) => acts(x.pause.provider ?? null)), ...holdRecords(seen, repos)].filter((x) => x.pause.replies?.outcome === "pausing")) {
      const key = `${isHold(h.pause) ? "hold" : (h.pause.provider ?? "")} ${h.pause.replies?.sent ?? ""}`;
      groups.set(key, [...(groups.get(key) ?? []), h]);
    }
    for (const held of groups.values()) {
      const sent = held[0]?.pause.replies?.sent ?? at.toISOString();
      const over = at.getTime() - Date.parse(sent) >= COUNT_MS;
      const why = new Map<string, NoAnswer["why"]>();
      let open = 0;
      for (const h of held) {
        const r = h.pause.replies as Replies;
        const got: string[] = [];
        for (const x of (h.pause.targets ?? []).filter((y) => y.kind !== "pm" && !r.got.includes(y.thread) && !r.failed.includes(y.thread))) {
          const reply = await replyOf(h.at.project.root, x.thread);
          if (reply === "answered") {
            got.push(x.thread);
          } else {
            why.set(x.thread, reply);
            open++;
          }
        }
        if (got.length > 0) {
          patch([h], (p) => (p.replies === undefined || p.replies.outcome !== "pausing" ? p : { ...p, replies: { ...p.replies, got: [...new Set([...p.replies.got, ...got])] } }));
        }
      }
      if (open === 0 || over) {
        const now = held.map(fresh);
        if (now.every((h) => isHold(h.pause))) {
          settleHolds(now, why, null);
        } else {
          await settle(now, at, why, null);
        }
      }
    }
  };

  /**
   * 2. The resumes (0074/D), all through `resumePauses`: a record whose resume time has passed is re-checked (still over: kept with the
   * new time); one whose fresh reading (checked after the pause began) shows its window under the threshold, or no longer has it,
   * resumes early; one with a resume asked for (Resume now) or pending (a send failed) is tried again. Holds are never resumed.
   */
  const resume = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): Promise<void> => {
    const readings = new Map<string, ProviderReading | null>();
    const readingAt = (root: string, provider: string): ProviderReading | null => {
      const key = `${root}
${provider}`;
      if (!readings.has(key)) {
        readings.set(key, readingOf(root, provider, at));
      }
      return readings.get(key) ?? null;
    };
    const all = seen.flatMap((s) => loadPauses(s.project.root).pauses.filter((p) => reasonOf(p) === "limit" && p.provider !== null && acts(p.provider)).map((pause) => ({ at: s, pause })));
    const go: { held: Held; why: string }[] = [];
    const over: Held[] = [];
    for (const h of all) {
      const p = h.pause;
      if (p.resuming !== undefined) {
        // Asked for and not tried, or a send pending: try (again) now. A PM that got its ask resumes it; nothing more here.
        if (p.resuming.lastTry === null || p.resuming.failedSince !== null) {
          go.push({ held: h, why: p.resuming.why });
        }
        continue;
      }
      if (p.by !== "board" || p.replies?.outcome === "pausing") {
        continue;
      }
      const reading = readingAt(h.at.project.root, p.provider ?? "");
      if (p.resumeAt !== null && Date.parse(p.resumeAt) <= at.getTime()) {
        if (reading?.verdict === "pause") {
          over.push(h);
        } else {
          go.push({ held: h, why: "timer" });
        }
        continue;
      }
      const early = earlyWhy(p, reading);
      if (early !== null) {
        go.push({ held: h, why: early });
      }
    }
    // Still over at the resume time: each project keeps its records with the new time (0074/B: each against its own BRAID.md).
    const byKey = new Map<string, Held[]>();
    for (const h of over) {
      const key = `${h.at.project.root}
${h.pause.provider ?? ""}`;
      byKey.set(key, [...(byKey.get(key) ?? []), h]);
    }
    for (const hs of byKey.values()) {
      const first = hs[0] as Held;
      const reading = readingAt(first.at.project.root, first.pause.provider ?? "") as ProviderReading;
      const w = overWindow(reading);
      const kept = patch(hs, (p) => ({ ...p, window: w?.id ?? p.window, label: w?.label ?? p.label, usedPercent: w?.usedPercent ?? p.usedPercent, resetsAt: w?.resetsAt ?? p.resetsAt, resumeAt: reading.resumeAt ?? p.resumeAt }));
      if (kept.length > 0) {
        push(first.at.project.root, "extended", kept, at);
      }
    }
    if (go.length === 0) {
      return;
    }
    const archived = (thread: string): boolean => seen.some((s) => s.good.t3.states?.get(thread) === "archived");
    const usageOf = (p: Pause, root: string): string | null => {
      const w = readingAt(root, p.provider ?? "")?.windows.find((x) => x.id === p.window);
      return w === undefined ? null : `${w.label} ${percent(w.usedPercent)}%`;
    };
    // One call per reason, so the ask names it; within it one message per thread.
    const whys = [...new Set(go.map((g) => g.why))];
    for (const why of whys) {
      const batch = go.filter((g) => g.why === why);
      const out = await resumePauses(
        batch.map((g) => ({ root: g.held.at.project.root, pause: g.held.pause })),
        { t3: opts.t3, now: at, why, archived, usage: (p) => usageOf(p, batch.find((g) => g.held.pause.braid === p.braid)?.held.at.project.root ?? ""), warn: (l) => warn(l, l) },
      );
      // The resumed push, per project and provider: late ones say when they were due.
      const groups = new Map<string, { root: string; records: Pause[] }>();
      for (const c of out.cleared) {
        const key = `${c.root}
${c.pause.provider ?? ""}`;
        const e = groups.get(key) ?? { root: c.root, records: [] };
        e.records.push(c.pause);
        groups.set(key, e);
      }
      for (const e of groups.values()) {
        const first = e.records[0] as Pause;
        const late = first.resumeAt === null ? 0 : at.getTime() - Date.parse(first.resumeAt);
        const w = readingAt(e.root, first.provider ?? "")?.windows.find((x) => x.id === first.window);
        push(e.root, "resumed", e.records, at, { due: why === "timer" && late >= MISSED_MS && first.resumeAt !== null ? clock(first.resumeAt, at) : null, usage: w === undefined ? null : `${w.label} at ${percent(w.usedPercent)}%` });
      }
    }
  };

  /** 3. Providers over their threshold: a record per braid with a working agent on it and no record yet, then the texts, sent by code. */
  const pause = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean, mcp: TickMcp): Promise<void> => {
    const over = new Set(seen.flatMap((s) => (s.good.board.limits?.providers ?? []).filter((p) => p.windows.some((w) => w.over) && acts(p.instanceId)).map((p) => p.instanceId)));
    for (const provider of over) {
      const wanted: { at: Seen; records: Pause[]; reading: ProviderReading }[] = [];
      for (const s of seen) {
        const reading = readingOf(s.project.root, provider, at);
        if (reading?.verdict !== "pause") {
          continue;
        }
        // After a resume by hand (Resume now, braid resume --limit), only a reading checked after it pauses again (0074/D).
        if (reading.checkedAt === null || Date.parse(reading.checkedAt) <= resumedAt(s.project.root, provider)) {
          continue;
        }
        const held = new Set(loadPauses(s.project.root).pauses.map((p) => p.braid));
        const pms: PmThread[] = s.good.board.programmes.flatMap((p) => (p.thread === null || p.section === null ? [] : [{ thread: p.thread, braids: p.braids }]));
        const w = overWindow(reading);
        const records = s.good.braids
          .filter((b) => !isDone(s, b) && !held.has(b.number))
          .flatMap((b): Pause[] => {
            const targets = targetsOf(b.number, provider, s.good.t3, s.project.folder());
            if (targets.length === 0) {
              return [];
            }
            const all = [...targets, ...pmsOf(b.number, s.good.t3, pms, s.project.folder())];
            const replies: Replies = { sent: at.toISOString(), outcome: "pausing", answered: 0, total: targets.length, got: [], failed: [], noAnswer: [], reason: null };
            return [{ braid: b.number, reason: "limit", provider, window: w?.id ?? reading.pauseWindow, label: w?.label ?? null, usedPercent: w?.usedPercent ?? null, resetsAt: w?.resetsAt ?? null, resumeAt: reading.resumeAt ?? at.toISOString(), task: null, thread: "", by: "board", at: at.toISOString(), targets: all, replies }];
          });
        if (records.length > 0) {
          wanted.push({ at: s, records, reading });
        }
      }
      const claimed: Held[] = wanted.flatMap((x) => claimPauses(x.at.project.root, x.records).map((pause) => ({ at: x.at, pause })));
      const first = wanted.find((x) => claimed.some((h) => h.at === x.at));
      if (first === undefined || claimed.length === 0) {
        continue; // another board (or a race) holds them all
      }
      // From here on every way out leaves the claimed records counting: a send that fails is recorded, and anything that throws is
      // warned; the count settles them within 10 minutes either way.
      try {
        const w = overWindow(first.reading);
        const window = w?.label ?? first.reading.pauseWindow ?? "window";
        const resume = clock(first.reading.resumeAt ?? at.toISOString(), at);
        // Signed in (0080/E): the working threads are stopped first, so the text doesn't wait behind a busy turn.
        await stopAll(claimed, at, `braid board: pause for ${provider} ${window}`, mcp);
        const failed: string[] = [];
        const done = new Set<string>();
        for (const h of claimed) {
          for (const x of (h.pause.targets ?? []).filter((y) => y.kind !== "pm")) {
            if (done.has(x.thread)) {
              continue;
            }
            done.add(x.thread);
            const text = x.kind === "coordinator" ? coordinatorPause(x.item, provider, window, resume) : workerPause(provider, window, resume);
            if (!(await send(h.at.project.root, x.thread, text))) {
              failed.push(x.thread);
            }
          }
        }
        // Direct pause, tell the PM: one summary per PM thread with the braids it runs; it needs no reply.
        const pms = new Map<string, { root: string; braids: string[] }>();
        for (const h of claimed) {
          for (const x of (h.pause.targets ?? []).filter((y) => y.kind === "pm")) {
            const e = pms.get(x.thread) ?? { root: h.at.project.root, braids: [] };
            e.braids.push(h.pause.braid);
            pms.set(x.thread, e);
          }
        }
        for (const [thread, e] of pms) {
          if (!(await send(e.root, thread, pmSummary(e.braids, provider, window, resume)))) {
            warn(`the pause summary to the PM thread ${thread.slice(0, 8)} could not be sent`, `pm ${thread} ${at.toISOString()}`);
          }
        }
        if (failed.length > 0) {
          patch(claimed, (p) => (p.replies === undefined ? p : { ...p, replies: { ...p.replies, failed: (p.targets ?? []).filter((x) => failed.includes(x.thread)).map((x) => x.thread) } }));
        }
        const records = claimed.map((h) => h.pause);
        if (records.some(weeklyPause)) {
          push(first.at.project.root, "weekly", records, at, { roles: [...new Set(first.reading.roles.map((r) => r.split(".")[0] ?? r))].filter((r) => r !== "steering") });
        }
        // Every send failed: nothing to count, so it settles now (loudly).
        if (failed.length > 0 && claimed.every((h) => (h.pause.targets ?? []).filter((x) => x.kind !== "pm").every((x) => failed.includes(x.thread)))) {
          await settle(claimed.map(fresh), at, new Map(), "every send failed");
        }
      } catch (error) {
        warn(`the pause of ${provider} failed after its records were written (${error instanceof Error ? error.message : String(error)}); the count settles them`, `claimed ${provider} ${at.toISOString()}`);
      }
    }
  };

  /**
   * Signed in (0080/E): stops each record's working top-level targets with `stop: true` and records what came of it on the record.
   * Not known which threads are live (signed out, the list failed): nothing is stopped or recorded, and the texts go as today.
   */
  const stopAll = async (held: readonly Held[], at: Date, reason: string, mcp: TickMcp): Promise<void> => {
    for (const h of held) {
      const out = await stopTargets(mcp, (h.pause.targets ?? []).filter((x) => x.kind !== "pm"), reason);
      if (out === null) {
        return;
      }
      const stop: Stop = { at: at.toISOString(), stopped: out.stopped, refused: out.refused, still: [], pushed: false };
      patch([h], (p) => ({ ...p, stop }));
    }
  };

  /**
   * 2b. Holds (0080/E): signed in, a hold the board hasn't acted on (no replies yet) in a repository it acts for gets the braid's
   * working threads (every provider) as its targets; they are stopped, then each gets the hold text, and the replies are counted as a
   * pause's. The thread that ran `braid pause --hold` is left alone. Signed out, a hold stays a record only.
   */
  const hold = async (seen: readonly Seen[], at: Date, repos: ReadonlySet<string>, mcp: TickMcp): Promise<void> => {
    for (const h of holdRecords(seen, repos).filter((x) => x.pause.replies === undefined)) {
      const b = h.at.good.braids.find((x) => x.number === h.pause.braid);
      if (b === undefined || isDone(h.at, b)) {
        continue;
      }
      // Signed out (also by a 401 this tick), or the live threads not known: tried at a later refresh.
      if (!mcp.signedIn() || (await mcp.live()) === null) {
        return;
      }
      const targets = targetsOf(h.pause.braid, null, h.at.good.t3, h.at.project.folder()).filter((t) => t.thread !== h.pause.thread);
      const replies: Replies = { sent: at.toISOString(), outcome: targets.length === 0 ? "paused" : "pausing", answered: 0, total: targets.length, got: [], failed: [], noAnswer: [], reason: null };
      const mine = patch([h], (p) => (p.replies !== undefined ? p : { ...p, targets, replies })).find((p) => p.replies === replies || p.replies?.sent === replies.sent);
      if (mine === undefined || targets.length === 0) {
        continue;
      }
      const held: Held = { at: h.at, pause: mine };
      try {
        await stopAll([held], at, `braid board: hold of braid ${h.pause.braid}`, mcp);
        const failed: string[] = [];
        for (const x of targets) {
          if (!(await send(h.at.project.root, x.thread, holdText(h.pause.braid, h.pause.words ?? "")))) {
            failed.push(x.thread);
          }
        }
        if (failed.length > 0) {
          patch([held], (p) => (p.replies === undefined ? p : { ...p, replies: { ...p.replies, failed } }));
        }
        if (failed.length === targets.length) {
          settleHolds([fresh(held)], new Map(), "every send failed");
        }
      } catch (error) {
        warn(`the hold of ${h.pause.braid} failed after its record was written (${error instanceof Error ? error.message : String(error)}); the count settles it`, `hold ${h.pause.braid} ${at.toISOString()}`);
      }
    }
  };

  /**
   * 1b. After a stop (0080/E): for 10 minutes, while replies are counted or a thread still runs, the braid's threads still working,
   * from the tick's one live list (targets that haven't answered, and their live children). One push if any still work at 2 minutes.
   */
  const still = async (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean, repos: ReadonlySet<string>, mcp: TickMcp): Promise<void> => {
    const open = [...boardRecords(seen).filter((x) => acts(x.pause.provider ?? null)), ...holdRecords(seen, repos)].filter((x) => {
      const s = x.pause.stop;
      return s !== undefined && at.getTime() - Date.parse(s.at) < COUNT_MS && (x.pause.replies?.outcome === "pausing" || s.still.length > 0);
    });
    if (open.length === 0) {
      return;
    }
    const live = await mcp.live();
    if (live === null) {
      return;
    }
    for (const h of open) {
      const s = h.pause.stop as Stop;
      const targets = (h.pause.targets ?? []).filter((x) => x.kind !== "pm");
      const now = stillWorking(live, targets, h.pause.replies?.got ?? []);
      const due = !s.pushed && now.length > 0 && at.getTime() - Date.parse(s.at) >= STILL_PUSH_MS;
      if (due) {
        try {
          opts.push?.(h.at.project.root, stillPush(h.pause.braid, isHold(h.pause), now, targets, s.at));
        } catch {
          // a push never stops the pause
        }
      }
      if (due || JSON.stringify(now) !== JSON.stringify(s.still)) {
        patch([h], (p) => (p.stop === undefined ? p : { ...p, stop: { ...p.stop, still: now, pushed: p.stop.pushed || due } }));
      }
    }
  };

  /**
   * 4. Blind providers (0074/E): one push per provider and blind spell (a spell is a cache's last update: a later spell is another one),
   * for a provider this board acts for whose chip reads `blind`. A reading that recovers ends the spell with no push. One push per
   * provider even when several projects show it; the pusher keeps the key, so a restart sends nothing twice.
   */
  const blind = (seen: readonly Seen[], at: Date, acts: (provider: string | null) => boolean): void => {
    const sent = new Set<string>();
    for (const s of seen) {
      for (const p of s.good.board.limits?.providers ?? []) {
        if (p.state !== "blind" || p.blindSince === null || !acts(p.instanceId) || sent.has(p.instanceId)) {
          continue;
        }
        sent.add(p.instanceId);
        const agents = p.agents.filter((a) => a.state === "running").map((a) => `${a.id} ${a.role}`);
        const out = blindPush(p.instanceId, p.blindSince, blindReason(p, at), agents, at);
        try {
          opts.push?.(s.project.root, out);
        } catch {
          // a push never stops the pause
        }
      }
    }
  };

  /** Takes or renews this board's leases: the repositories it acts for, and a test of the provider accounts it acts for. */
  const leases = (seen: readonly Seen[]): { repos: Set<string>; acts: (provider: string | null) => boolean } => {
    const acting = opts.acting;
    if (acting === undefined) {
      return { repos: new Set(seen.map((s) => s.project.root)), acts: () => true };
    }
    const repos = new Set(
      seen
        .filter((s) => {
          const l = repoLease(s.project.root);
          return acting.hold(l.key, l.label);
        })
        .map((s) => s.project.root),
    );
    let records: Held[] = [];
    try {
      records = boardRecords(seen);
    } catch {
      // a pauses file that can't be read: its providers are taken when it reads again
    }
    const ids = new Set([...seen.flatMap((s) => (s.good.board.limits?.providers ?? []).map((p) => p.instanceId)), ...records.flatMap((h) => (h.pause.provider == null ? [] : [h.pause.provider]))]);
    const mine = new Set([...ids].filter((id) => acting.hold(providerKey(id), id)));
    return { repos, acts: (provider) => provider !== null && mine.has(provider) };
  };

  const tick = async (): Promise<void> => {
    pending = false;
    const seen = [...latest.values()];
    const { repos, acts } = leases(seen);
    for (const root of repos) {
      try {
        opts.retry?.(root);
      } catch {
        // a push never stops the pause
      }
    }
    const at = now();
    // One MCP view per tick (0080/E): at most one live list, and a 401 turns the rest of the tick to the CLI.
    const mcp = tickMcp(opts.mcp?.() ?? null, warn, opts.live);
    try {
      clearDone(seen, acts);
      await count(seen, at, acts, repos);
      await still(seen, at, acts, repos, mcp);
      await resume(seen, at, acts);
      await hold(seen, at, repos, mcp);
      await pause(seen, at, acts, mcp);
      blind(seen, at, acts);
    } catch (error) {
      warn(`the limits pause failed this refresh (${error instanceof Error ? error.message : String(error)})`, "tick");
    }
    for (const s of opts.wake === undefined ? [] : seen.filter((x) => repos.has(x.project.root))) {
      try {
        // Read the clock again: the steps above may have taken a while.
        await opts.wake?.({ root: s.project.root, good: s.good }, now(), warn);
      } catch (error) {
        warn(`the wake of ${s.project.name} failed this refresh (${error instanceof Error ? error.message : String(error)})`, `wake ${s.project.name}`);
      }
    }
  };
  return {
    observe(project, good) {
      latest.set(project.name, { project, good });
      if (!pending) {
        pending = true;
        running = running.then(tick);
      }
    },
    poke() {
      if (!pending && latest.size > 0) {
        pending = true;
        running = running.then(tick);
      }
    },
    async idle() {
      let last: Promise<void> | undefined;
      while (last !== running) {
        last = running;
        await running;
      }
    },
  };
}
